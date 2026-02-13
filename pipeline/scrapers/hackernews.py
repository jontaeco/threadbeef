"""Hacker News scraper using the Firebase API."""

import asyncio
from typing import Optional
import httpx
from rich.console import Console

from pipeline.config import HNConfig
from pipeline.models import RawMessage, RawThread
from pipeline.detection.argument_finder import find_argument_chains

console = Console()


async def _fetch_item(client: httpx.AsyncClient, item_id: int, base_url: str) -> Optional[dict]:
    """Fetch a single HN item by ID."""
    try:
        resp = await client.get(f"{base_url}/item/{item_id}.json")
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


async def _fetch_comment_tree(
    client: httpx.AsyncClient,
    item_id: int,
    base_url: str,
    depth: int = 0,
    max_depth: int = 20,
) -> list[dict]:
    """Recursively fetch a comment tree from HN API."""
    if depth > max_depth:
        return []

    item = await _fetch_item(client, item_id, base_url)
    if not item or item.get("type") != "comment" or item.get("dead") or item.get("deleted"):
        return []

    result = [
        {
            "id": str(item["id"]),
            "parent_id": str(item.get("parent", "")),
            "author": item.get("by", "[deleted]"),
            "body": item.get("text", ""),
            "score": None,  # HN comments don't expose scores
            "timestamp": str(item.get("time", "")),
            "depth": depth,
        }
    ]

    kids = item.get("kids", [])
    # Fetch child comments concurrently (limit concurrency)
    tasks = [
        _fetch_comment_tree(client, kid_id, base_url, depth + 1, max_depth)
        for kid_id in kids[:10]  # Limit to first 10 children per level
    ]
    children = await asyncio.gather(*tasks)
    for child_list in children:
        result.extend(child_list)

    return result


async def _scrape_stories(
    config: HNConfig,
    limit: int | None = None,
) -> list[RawThread]:
    """Scrape HN stories for argument chains."""
    threads: list[RawThread] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for story_type in config.story_types:
            console.print(f"  [dim]Fetching {story_type}...[/dim]")

            try:
                resp = await client.get(f"{config.base_url}/{story_type}.json")
                resp.raise_for_status()
                story_ids = resp.json()
            except Exception as e:
                console.print(f"  [red]Error fetching {story_type}: {e}[/red]")
                continue

            stories_limit = limit or config.stories_per_type

            for story_id in story_ids[:stories_limit]:
                story = await _fetch_item(client, story_id, config.base_url)
                if not story or not story.get("kids"):
                    continue

                # Fetch comment trees for this story
                comment_tree: list[dict] = []
                tasks = [
                    _fetch_comment_tree(client, kid_id, config.base_url)
                    for kid_id in story["kids"][:15]
                ]
                results = await asyncio.gather(*tasks)
                for tree in results:
                    comment_tree.extend(tree)

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
                            timestamp=msg["timestamp"],
                            score=msg["score"],
                        )
                        for msg in chain["messages"]
                    ]

                    threads.append(
                        RawThread(
                            platform="hackernews",
                            source="HN",
                            url=f"https://news.ycombinator.com/item?id={story_id}",
                            title=story.get("title"),
                            messages=messages,
                            participant_a=chain["participant_a"],
                            participant_b=chain["participant_b"],
                        )
                    )

                    console.print(
                        f"  [green]Found chain:[/green] {chain['participant_a']} vs {chain['participant_b']} "
                        f"({len(messages)} messages)"
                    )

    return threads


def scrape_hackernews(
    config: HNConfig | None = None,
    limit: int | None = None,
) -> list[RawThread]:
    """Main entry point: scrape Hacker News for argument threads."""
    config = config or HNConfig()
    console.print("[bold cyan]Scraping Hacker News[/bold cyan]")

    threads = asyncio.run(_scrape_stories(config, limit))
    console.print(f"\n[bold]Total HN threads found: {len(threads)}[/bold]")
    return threads
