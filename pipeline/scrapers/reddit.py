"""Reddit scraper using PRAW."""

import os
from typing import Generator
import praw
from rich.console import Console
from dotenv import load_dotenv

from pipeline.config import RedditConfig
from pipeline.models import RawMessage, RawThread
from pipeline.detection.argument_finder import find_argument_chains

load_dotenv()
console = Console()


def get_reddit_client() -> praw.Reddit:
    """Create a PRAW Reddit client from env vars."""
    return praw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        user_agent=os.environ.get("REDDIT_USER_AGENT", "threadbeef-scraper/1.0"),
    )


def _comment_to_raw(comment) -> RawMessage:
    """Convert a PRAW comment to a RawMessage."""
    return RawMessage(
        author_id=str(comment.author) if comment.author else "[deleted]",
        body=comment.body,
        timestamp=str(comment.created_utc),
        score=comment.score,
        quoted_text=None,
    )


def _extract_comment_tree(comment, depth: int = 0, max_depth: int = 20) -> list[dict]:
    """Recursively extract comment tree as flat list with parent info."""
    if depth > max_depth:
        return []

    result = [
        {
            "id": comment.id,
            "parent_id": comment.parent_id,
            "author": str(comment.author) if comment.author else "[deleted]",
            "body": comment.body,
            "score": comment.score,
            "timestamp": str(comment.created_utc),
            "depth": depth,
        }
    ]

    if hasattr(comment, "replies"):
        comment.replies.replace_more(limit=0)
        for reply in comment.replies:
            result.extend(_extract_comment_tree(reply, depth + 1, max_depth))

    return result


def scrape_subreddit(
    reddit: praw.Reddit,
    subreddit_name: str,
    config: RedditConfig,
    limit: int | None = None,
) -> Generator[RawThread, None, None]:
    """Scrape a subreddit for argument chains."""
    sub = reddit.subreddit(subreddit_name)
    posts_limit = limit or config.posts_per_subreddit

    for sort_mode in config.sort_modes:
        console.print(
            f"  [dim]Fetching {sort_mode} posts from r/{subreddit_name}...[/dim]"
        )

        if sort_mode == "hot":
            posts = sub.hot(limit=posts_limit)
        elif sort_mode == "top":
            posts = sub.top(limit=posts_limit, time_filter="week")
        else:
            posts = sub.controversial(limit=posts_limit, time_filter="week")

        for post in posts:
            post.comments.replace_more(limit=3)
            comment_tree = []
            for top_level in post.comments:
                comment_tree.extend(_extract_comment_tree(top_level))

            # Find argument chains in this post's comments
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

                yield RawThread(
                    platform="reddit",
                    source=f"r/{subreddit_name}",
                    url=f"https://reddit.com{post.permalink}",
                    title=post.title,
                    messages=messages,
                    participant_a=chain["participant_a"],
                    participant_b=chain["participant_b"],
                )


def scrape_reddit(
    config: RedditConfig | None = None,
    subreddits: list[str] | None = None,
    limit: int | None = None,
) -> list[RawThread]:
    """Main entry point: scrape Reddit for argument threads."""
    config = config or RedditConfig()
    reddit = get_reddit_client()
    targets = subreddits or config.subreddits

    threads: list[RawThread] = []

    for sub_name in targets:
        console.print(f"[bold cyan]Scraping r/{sub_name}[/bold cyan]")
        try:
            for thread in scrape_subreddit(reddit, sub_name, config, limit):
                threads.append(thread)
                console.print(
                    f"  [green]Found chain:[/green] {thread.participant_a} vs {thread.participant_b} "
                    f"({len(thread.messages)} messages)"
                )
        except Exception as e:
            console.print(f"  [red]Error scraping r/{sub_name}: {e}[/red]")

    console.print(f"\n[bold]Total threads found: {len(threads)}[/bold]")
    return threads
