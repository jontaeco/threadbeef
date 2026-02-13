"""YouTube comment scraper using the YouTube Data API v3."""

import asyncio
from typing import Optional
import httpx
from rich.console import Console

from pipeline.config import YouTubeConfig
from pipeline.models import RawMessage, RawThread
from pipeline.detection.argument_finder import find_argument_chains

console = Console()

API_BASE = "https://www.googleapis.com/youtube/v3"


async def _search_debate_videos(
    client: httpx.AsyncClient,
    api_key: str,
    queries: list[str],
    max_per_query: int = 5,
) -> list[str]:
    """Search YouTube for debate-heavy videos using curated queries.
    Returns deduplicated list of video IDs.
    """
    video_ids: list[str] = []
    seen: set[str] = set()

    for query in queries:
        params = {
            "part": "id",
            "q": query,
            "type": "video",
            "key": api_key,
            "maxResults": max_per_query,
            "order": "relevance",
            "relevanceLanguage": "en",
        }
        try:
            resp = await client.get(f"{API_BASE}/search", params=params)
            resp.raise_for_status()
            data = resp.json()
            for item in data.get("items", []):
                vid = item["id"]["videoId"]
                if vid not in seen:
                    seen.add(vid)
                    video_ids.append(vid)
        except Exception as e:
            console.print(f"  [red]Search error for '{query}': {e}[/red]")

    return video_ids


async def _fetch_comment_threads(
    client: httpx.AsyncClient,
    video_id: str,
    api_key: str,
    max_results: int = 100,
) -> list[dict]:
    """Fetch top-level comment threads with replies for a video."""
    all_threads: list[dict] = []
    page_token: Optional[str] = None

    while len(all_threads) < max_results:
        params = {
            "part": "snippet,replies",
            "videoId": video_id,
            "key": api_key,
            "maxResults": min(100, max_results - len(all_threads)),
            "order": "relevance",
            "textFormat": "plainText",
        }
        if page_token:
            params["pageToken"] = page_token

        try:
            resp = await client.get(f"{API_BASE}/commentThreads", params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            console.print(f"  [red]Error fetching comments: {e}[/red]")
            break

        items = data.get("items", [])
        all_threads.extend(items)

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return all_threads


async def _fetch_all_replies(
    client: httpx.AsyncClient,
    thread: dict,
    api_key: str,
) -> None:
    """Fetch all replies for a thread using the comments.list endpoint.

    The commentThreads endpoint only returns up to 5 inline replies.
    For threads with more, we need a separate call to get the full list.
    Mutates the thread dict in place.
    """
    total = thread["snippet"].get("totalReplyCount", 0)
    inline = len(thread.get("replies", {}).get("comments", []))
    if total <= inline:
        return

    parent_id = thread["snippet"]["topLevelComment"]["id"]
    all_replies: list[dict] = []
    page_token: Optional[str] = None

    while True:
        params = {
            "part": "snippet",
            "parentId": parent_id,
            "key": api_key,
            "maxResults": 100,
            "textFormat": "plainText",
        }
        if page_token:
            params["pageToken"] = page_token

        try:
            resp = await client.get(f"{API_BASE}/comments", params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            console.print(f"  [red]Error fetching replies for {parent_id}: {e}[/red]")
            break

        all_replies.extend(data.get("items", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break

    if all_replies:
        thread.setdefault("replies", {})["comments"] = all_replies


def _flatten_threads_to_tree(threads: list[dict]) -> list[dict]:
    """Convert YouTube comment threads into a flat comment tree format
    compatible with find_argument_chains()."""
    comments: list[dict] = []

    for thread in threads:
        top_comment = thread["snippet"]["topLevelComment"]
        top_snippet = top_comment["snippet"]
        top_id = top_comment["id"]

        comments.append({
            "id": top_id,
            "parent_id": "",
            "author": top_snippet.get("authorDisplayName", "[unknown]"),
            "body": top_snippet.get("textDisplay", ""),
            "score": top_snippet.get("likeCount"),
            "timestamp": top_snippet.get("publishedAt", ""),
            "depth": 0,
        })

        # Add replies
        replies = thread.get("replies", {}).get("comments", [])
        for reply in replies:
            reply_snippet = reply["snippet"]
            comments.append({
                "id": reply["id"],
                "parent_id": reply_snippet.get("parentId", top_id),
                "author": reply_snippet.get("authorDisplayName", "[unknown]"),
                "body": reply_snippet.get("textDisplay", ""),
                "score": reply_snippet.get("likeCount"),
                "timestamp": reply_snippet.get("publishedAt", ""),
                "depth": 1,
            })

    return comments


def _reconstruct_threads(comments: list[dict], min_per_side: int = 3) -> list[dict]:
    """Reconstruct threaded structure from YouTube's flat replies.

    YouTube replies are all depth=1 with parent_id pointing to the
    top-level comment. This groups replies by author pairs and
    re-links them chronologically so find_argument_chains() can
    walk them as a proper chain.
    """
    from collections import defaultdict

    # Separate top-level comments from replies
    top_level = [c for c in comments if not c["parent_id"]]
    replies_by_parent: dict[str, list[dict]] = defaultdict(list)
    for c in comments:
        if c["parent_id"]:
            replies_by_parent[c["parent_id"]].append(c)

    result = list(top_level)  # Keep top-level as-is

    for top_id, replies in replies_by_parent.items():
        # Count messages per author
        author_counts: dict[str, int] = defaultdict(int)
        for r in replies:
            author_counts[r["author"]] += 1

        # Find author pairs where both have min_per_side messages
        qualifying_authors = [a for a, c in author_counts.items() if c >= min_per_side]

        paired_ids: set[str] = set()  # Track which replies get re-linked

        # For each qualifying pair, reconstruct threading
        for i, author_a in enumerate(qualifying_authors):
            for author_b in qualifying_authors[i + 1:]:
                pair_msgs = sorted(
                    [r for r in replies if r["author"] in (author_a, author_b)],
                    key=lambda r: r.get("timestamp", ""),
                )

                if len(pair_msgs) < min_per_side * 2:
                    continue

                # Re-link: each message's parent = previous message
                for idx, msg in enumerate(pair_msgs):
                    if idx == 0:
                        msg["parent_id"] = top_id  # First reply → top comment
                        msg["depth"] = 1
                    else:
                        msg["parent_id"] = pair_msgs[idx - 1]["id"]
                        msg["depth"] = idx + 1

                    paired_ids.add(msg["id"])

                result.extend(pair_msgs)

        # Add unpaired replies unchanged
        for r in replies:
            if r["id"] not in paired_ids:
                result.append(r)

    return result


async def _scrape_videos(
    config: YouTubeConfig,
    video_ids: list[str],
    limit: int | None = None,
) -> list[RawThread]:
    """Scrape YouTube video comments for argument chains."""
    threads: list[RawThread] = []

    if not config.api_key:
        console.print("[red]YOUTUBE_API_KEY not set[/red]")
        return threads

    async with httpx.AsyncClient(timeout=30.0) as client:
        for video_id in video_ids:
            console.print(f"  [dim]Fetching comments for video {video_id}...[/dim]")

            comment_threads = await _fetch_comment_threads(
                client, video_id, config.api_key, config.max_results_per_video
            )

            if not comment_threads:
                console.print(f"  [dim]No comments found for {video_id}[/dim]")
                continue

            # Fetch full reply lists for threads with >5 replies
            for ct in comment_threads:
                await _fetch_all_replies(client, ct, config.api_key)

            # Flatten into comment tree format and reconstruct threading
            comment_tree = _flatten_threads_to_tree(comment_threads)
            comment_tree = _reconstruct_threads(comment_tree, config.min_messages_per_side)

            # Find argument chains
            chains = find_argument_chains(
                comment_tree,
                min_per_side=config.min_messages_per_side,
                max_per_side=config.max_messages_per_side,
                max_total=config.max_total_messages,
            )

            for chain in chains:
                messages = [
                    RawMessage(
                        author_id=msg["author"],
                        body=msg["body"],
                        timestamp=msg.get("timestamp", ""),
                        score=msg.get("score"),
                    )
                    for msg in chain["messages"]
                ]

                threads.append(
                    RawThread(
                        platform="youtube",
                        source="YouTube",
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        title=None,
                        messages=messages,
                        participant_a=chain["participant_a"],
                        participant_b=chain["participant_b"],
                    )
                )

                console.print(
                    f"  [green]Found chain:[/green] {chain['participant_a']} vs {chain['participant_b']} "
                    f"({len(messages)} messages)"
                )

            if limit and len(threads) >= limit:
                threads = threads[:limit]
                break

    return threads


def scrape_youtube(
    config: YouTubeConfig | None = None,
    video_ids: list[str] | None = None,
    limit: int | None = None,
) -> list[RawThread]:
    """Main entry point: scrape YouTube comments for argument threads."""
    config = config or YouTubeConfig()
    video_ids = video_ids or []

    if not video_ids:
        console.print("[yellow]No video IDs provided.[/yellow]")
        return []

    console.print("[bold cyan]Scraping YouTube[/bold cyan]")
    threads = asyncio.run(_scrape_videos(config, video_ids, limit))
    console.print(f"\n[bold]Total YouTube threads found: {len(threads)}[/bold]")
    return threads
