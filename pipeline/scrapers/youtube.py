"""YouTube comment scraper — uses YouTube Data API v3 when quota is available,
falls back to yt-dlp when it's exhausted or no API key is set."""

import asyncio
from datetime import datetime, timezone
from typing import Optional
import httpx
from rich.console import Console
from yt_dlp import YoutubeDL

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

        resp = await client.get(f"{API_BASE}/commentThreads", params=params)
        resp.raise_for_status()
        data = resp.json()

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

        resp = await client.get(f"{API_BASE}/comments", params=params)
        resp.raise_for_status()
        data = resp.json()

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


# ---------------------------------------------------------------------------
# yt-dlp fallback (no API key / no quota needed)
# ---------------------------------------------------------------------------

def _fetch_comments_ytdlp(video_id: str, max_comments: int = 1000) -> list[dict]:
    """Fetch comments for a video using yt-dlp (no API key needed)."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "getcomments": True,
        "extractor_args": {
            "youtube": {
                "max_comments": [str(max_comments)],
                "comment_sort": ["top"],
            }
        },
    }

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}",
                download=False,
            )
            return info.get("comments", []) or []
    except Exception as e:
        console.print(f"  [red]yt-dlp error for {video_id}: {e}[/red]")
        return []


def _map_ytdlp_comments(ytdlp_comments: list[dict]) -> list[dict]:
    """Convert yt-dlp comment format to internal comment tree format."""
    comments: list[dict] = []

    for c in ytdlp_comments:
        parent = c.get("parent", "root")
        is_top_level = parent == "root"

        # Normalize nested reply parents to top-level comment ID.
        # yt-dlp reply IDs are "{top_level_id}.{suffix}" — the YouTube API
        # always flattened parent_id to the top-level comment, so we do the same
        # to keep _reconstruct_threads() working correctly.
        if not is_top_level and "." in parent:
            parent = parent.split(".")[0]

        # Convert unix timestamp to ISO 8601
        ts = c.get("timestamp")
        if ts is not None:
            timestamp = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        else:
            timestamp = ""

        comments.append({
            "id": c.get("id", ""),
            "parent_id": "" if is_top_level else parent,
            "author": c.get("author", "[unknown]"),
            "body": c.get("text", ""),
            "score": c.get("like_count") or 0,
            "timestamp": timestamp,
            "depth": 0 if is_top_level else 1,
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


async def _fetch_comments_api(
    config: YouTubeConfig,
    video_id: str,
) -> list[dict] | None:
    """Try fetching comments via YouTube Data API v3.
    Returns comment tree on success, None on quota/auth failure so caller can fallback.
    """
    if not config.api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            comment_threads = await _fetch_comment_threads(
                client, video_id, config.api_key, config.max_results_per_video
            )
            if not comment_threads:
                return []

            for ct in comment_threads:
                await _fetch_all_replies(client, ct, config.api_key)

            return _flatten_threads_to_tree(comment_threads)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            return None  # Quota exhausted — signal fallback
        console.print(f"  [red]API error for {video_id}: {e}[/red]")
        return None
    except Exception as e:
        console.print(f"  [red]API error for {video_id}: {e}[/red]")
        return None


def _scrape_videos(
    config: YouTubeConfig,
    video_ids: list[str],
    limit: int | None = None,
) -> list[RawThread]:
    """Scrape YouTube video comments for argument chains.
    Tries YouTube Data API first, falls back to yt-dlp on quota exhaustion.
    """
    threads: list[RawThread] = []
    use_ytdlp = not config.api_key  # Start with yt-dlp if no key

    for video_id in video_ids:
        console.print(f"  [dim]Fetching comments for video {video_id}...[/dim]")

        comment_tree = None

        # Try API first (unless we already know quota is gone)
        if not use_ytdlp:
            comment_tree = asyncio.run(_fetch_comments_api(config, video_id))
            if comment_tree is None:
                console.print("  [yellow]API quota exhausted, switching to yt-dlp[/yellow]")
                use_ytdlp = True
            elif comment_tree == []:
                console.print(f"  [dim]No comments found for {video_id}[/dim]")
                continue
            else:
                console.print(f"  [dim]Got {len(comment_tree)} comments via API, finding chains...[/dim]")

        # yt-dlp fallback
        if use_ytdlp:
            ytdlp_comments = _fetch_comments_ytdlp(video_id, config.max_comments)
            if not ytdlp_comments:
                console.print(f"  [dim]No comments found for {video_id}[/dim]")
                continue
            console.print(f"  [dim]Got {len(ytdlp_comments)} comments via yt-dlp, finding chains...[/dim]")
            comment_tree = _map_ytdlp_comments(ytdlp_comments)

        # Reconstruct threading and find argument chains
        comment_tree = _reconstruct_threads(comment_tree, config.min_messages_per_side)

        chains = find_argument_chains(
            comment_tree,
            min_per_side=config.min_messages_per_side,
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
    threads = _scrape_videos(config, video_ids, limit)
    console.print(f"\n[bold]Total YouTube threads found: {len(threads)}[/bold]")
    return threads
