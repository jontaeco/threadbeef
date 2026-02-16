"""
ThreadBeef Content Pipeline CLI.

Usage:
  python main.py scrape reddit [--subreddits r/cooking,r/gaming] [--limit 5] [--dry-run]
  python main.py scrape hn [--limit 5] [--dry-run]
  python main.py scrape all [--limit 5] [--dry-run]
  python main.py process [--batch-size 10] [--provider claude|openai]
  python main.py stats
"""

import sys
import os
import argparse
from rich.console import Console
from rich.table import Table
from dotenv import load_dotenv

# Add parent directory to path so we can import pipeline modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from pipeline.config import RedditConfig, HNConfig, YouTubeConfig, LLMConfig
from pipeline.scrapers.reddit import scrape_reddit
from pipeline.scrapers.hackernews import scrape_hackernews
from pipeline.scrapers.youtube import scrape_youtube
from pipeline.detection.scoring import score_argumentness, score_entertainment
from pipeline.processing.content_filter import pre_filter, post_filter
from pipeline.processing.llm_client import get_llm_client
from pipeline.processing.enrichment import batch_enrich
from pipeline.output.inserter import insert_batch
from pipeline.db import get_stats

console = Console()


def generate_trending_queries(llm_config) -> list[str]:
    """Use the LLM to generate trending YouTube search queries for finding arguments."""
    import json
    try:
        client = get_llm_client()
        response = client.complete(
            system="You generate YouTube search queries designed to find videos with heated, entertaining comment section arguments. Return ONLY a JSON array of 5-8 search query strings. Focus on current events, trending debates, viral controversies, and polarizing topics people are arguing about right now. Make queries specific enough to find argumentative content but broad enough to return results.",
            user="Generate YouTube search queries for finding videos with entertaining comment section arguments. Focus on whatever people are likely arguing about right now — trending topics, recent controversies, viral debates. Return ONLY a JSON array of strings.",
        )
        response = response.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
        queries = json.loads(response)
        if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
            return queries
    except Exception as e:
        console.print(f"  [yellow]Trending query generation failed: {e}[/yellow]")
    return []


def cmd_scrape(args):
    """Scrape platforms for argument threads."""
    reddit_config = RedditConfig()
    hn_config = HNConfig()
    youtube_config = YouTubeConfig()
    llm_config = LLMConfig()

    threads = []

    if args.source in ("reddit", "all"):
        subreddits = args.subreddits.split(",") if args.subreddits else None
        reddit_threads = scrape_reddit(
            config=reddit_config, subreddits=subreddits, limit=args.limit
        )
        threads.extend(reddit_threads)

    if args.source in ("hn", "all"):
        hn_threads = scrape_hackernews(config=hn_config, limit=args.limit)
        threads.extend(hn_threads)

    if args.source in ("youtube", "all"):
        video_ids = args.video_ids.split(",") if args.video_ids else []

        # Auto-discover debate videos via Search API
        if args.auto_discover and youtube_config.api_key:
            from pipeline.config import YOUTUBE_SEARCH_QUERIES
            from pipeline.scrapers.youtube import _search_debate_videos
            import httpx

            # Generate trending queries via LLM
            all_queries = list(YOUTUBE_SEARCH_QUERIES)
            if not args.no_trending:
                trending = generate_trending_queries(llm_config)
                if trending:
                    console.print(f"  [magenta]Generated {len(trending)} trending queries:[/magenta]")
                    for q in trending:
                        console.print(f"    [dim]• {q}[/dim]")
                    all_queries.extend(trending)

            async def discover():
                async with httpx.AsyncClient(timeout=30.0) as client:
                    return await _search_debate_videos(
                        client, youtube_config.api_key, all_queries
                    )

            import asyncio
            discovered = asyncio.run(discover())
            console.print(f"  [cyan]Auto-discovered {len(discovered)} videos from {len(all_queries)} queries[/cyan]")
            video_ids.extend(discovered)

        youtube_threads = scrape_youtube(
            config=youtube_config, video_ids=video_ids, limit=args.limit
        )
        threads.extend(youtube_threads)

    if not threads:
        console.print("[yellow]No threads found.[/yellow]")
        return

    # Pre-filter
    console.print(f"\n[bold]Pre-filtering {len(threads)} threads...[/bold]")
    filtered = []
    for thread in threads:
        passed, reason = pre_filter(thread)
        if not passed:
            console.print(f"  [dim]Rejected: {reason}[/dim]")
            continue

        # Score argumentness and entertainment
        arg_score = score_argumentness(thread)
        ent_score = score_entertainment(thread)

        if arg_score < llm_config.argumentness_threshold:
            console.print(
                f"  [dim]Low argumentness ({arg_score}): "
                f"{thread.participant_a} vs {thread.participant_b}[/dim]"
            )
            continue

        if ent_score < llm_config.entertainment_pre_threshold:
            console.print(
                f"  [dim]Low entertainment ({ent_score}): "
                f"{thread.participant_a} vs {thread.participant_b}[/dim]"
            )
            continue

        filtered.append(thread)
        console.print(
            f"  [green]Passed[/green] (arg={arg_score}, ent={ent_score}): "
            f"{thread.participant_a} vs {thread.participant_b}"
        )

    console.print(
        f"\n[bold]{len(filtered)}/{len(threads)} threads passed pre-filter[/bold]"
    )

    if args.dry_run:
        console.print("[yellow]Dry run — skipping LLM processing and DB insertion.[/yellow]")
        return

    if not filtered:
        return

    # LLM enrichment
    llm_client = get_llm_client()
    enriched = batch_enrich(
        llm_client, filtered, batch_size=llm_config.batch_size
    )

    # Post-filter
    console.print(f"\n[bold]Post-filtering {len(enriched)} enriched arguments...[/bold]")
    final = []
    for arg in enriched:
        passed, reason = post_filter(arg, llm_config.entertainment_threshold)
        if passed:
            final.append(arg)
            console.print(f"  [green]✓[/green] {arg.title}")
        else:
            console.print(f"  [dim]Rejected: {reason}[/dim]")

    console.print(
        f"\n[bold]{len(final)}/{len(enriched)} arguments passed post-filter[/bold]"
    )

    # Insert into DB
    if final:
        beef_numbers = insert_batch(final)
        console.print(
            f"\n[bold green]Pipeline complete! "
            f"Inserted {len(beef_numbers)} arguments as pending_review.[/bold green]"
        )


def cmd_process(args):
    """Process existing raw threads (placeholder for future batch reprocessing)."""
    console.print("[yellow]Process command is for future batch reprocessing.[/yellow]")
    console.print("Use 'scrape' command which includes processing inline.")


def cmd_stats(args):
    """Show pipeline statistics."""
    stats = get_stats()

    table = Table(title="Pipeline Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green", justify="right")

    table.add_row("Total Arguments", str(stats["total"]))
    table.add_row("", "")

    for status, count in sorted(stats["by_status"].items()):
        table.add_row(f"  {status}", str(count))

    if stats["approved_by_category"]:
        table.add_row("", "")
        table.add_row("[bold]Approved by Category[/bold]", "")
        for category, count in stats["approved_by_category"].items():
            table.add_row(f"  {category}", str(count))

    console.print(table)


def main():
    parser = argparse.ArgumentParser(
        description="ThreadBeef Content Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # scrape
    scrape_parser = subparsers.add_parser("scrape", help="Scrape platforms for arguments")
    scrape_parser.add_argument(
        "source",
        choices=["reddit", "hn", "youtube", "all"],
        help="Platform to scrape",
    )
    scrape_parser.add_argument(
        "--subreddits",
        type=str,
        help="Comma-separated subreddit names (Reddit only)",
    )
    scrape_parser.add_argument(
        "--video-ids",
        type=str,
        dest="video_ids",
        help="Comma-separated YouTube video IDs (YouTube only)",
    )
    scrape_parser.add_argument(
        "--limit", type=int, help="Max posts/stories per source"
    )
    scrape_parser.add_argument(
        "--auto-discover",
        action="store_true",
        help="Use YouTube Search API to find debate videos automatically",
    )
    scrape_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape and filter only, skip LLM and DB",
    )
    scrape_parser.add_argument(
        "--no-trending",
        action="store_true",
        help="Skip LLM-generated trending queries, use only static queries",
    )
    scrape_parser.set_defaults(func=cmd_scrape)

    # process
    process_parser = subparsers.add_parser(
        "process", help="Process existing raw threads"
    )
    process_parser.add_argument("--batch-size", type=int, default=10)
    process_parser.add_argument("--provider", choices=["claude", "openai"])
    process_parser.set_defaults(func=cmd_process)

    # stats
    stats_parser = subparsers.add_parser("stats", help="Show pipeline statistics")
    stats_parser.set_defaults(func=cmd_stats)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    args.func(args)


if __name__ == "__main__":
    main()
