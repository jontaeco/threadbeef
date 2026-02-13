"""
LLM-based enrichment: scoring, categorization, anonymization, and more.
"""

import json
import time
from typing import Optional
from rich.console import Console

from pipeline.models import RawThread, ProcessedArgument, ProcessedMessage
from pipeline.processing.llm_client import LLMClient
from pipeline.config import CATEGORIES

console = Console()

ENRICHMENT_SYSTEM_PROMPT = """You are an expert at analyzing internet arguments for entertainment value.
Given a raw argument thread, produce a JSON object with the following fields:

{
  "entertainment_score": <float 1.0-10.0, how entertaining is this argument>,
  "category": <string, one of: """ + ", ".join(CATEGORIES) + """>,
  "heat_rating": <int 1-5, how heated the argument gets>,
  "title": <string, max 80 chars, catchy title for the argument>,
  "context_blurb": <string, max 120 chars, one-sentence summary>,
  "topic_drift": <string or null, "Started about X → Ended about Y" if topics changed>,
  "user_a_display_name": <string, anonymized creative username for participant A>,
  "user_b_display_name": <string, anonymized creative username for participant B>,
  "user_a_zinger": <string or null, best/funniest line from user A>,
  "user_b_zinger": <string or null, best/funniest line from user B>,
  "messages": <array of cleaned messages, each with: author ("a" or "b"), body (PII removed, platform noise stripped), timestamp, score, quoted_text>,
  "content_flags": <array of strings, any concerning content: ["slurs", "doxxing", "threats", etc.] or empty>
}

Rules:
- Anonymize all usernames. Never include real usernames in output.
- Remove PII (real names, emails, phone numbers, addresses) from message bodies.
- Strip platform-specific noise (Reddit formatting artifacts, "Edit:", award edits, etc.)
- Map the original authors to "a" and "b" consistently.
- Be honest about entertainment_score — only score 7+ if genuinely entertaining.
- Pick the most fitting category from the list.
- For zingers, pick the single funniest/most devastating line from each side.
- content_flags should be empty for acceptable content. Flag: slurs, doxxing, threats, extreme_nsfw.

Return ONLY valid JSON, no markdown code fences."""


def enrich_thread(
    client: LLMClient,
    thread: RawThread,
) -> Optional[ProcessedArgument]:
    """Enrich a single thread using the LLM."""
    # Build the user prompt with the raw thread data
    messages_text = []
    for msg in thread.messages:
        messages_text.append(
            f"[{msg.author_id}] (score: {msg.score}): {msg.body}"
        )

    user_prompt = f"""Platform: {thread.platform}
Source: {thread.source}
Thread title: {thread.title or "N/A"}
Participant A: {thread.participant_a}
Participant B: {thread.participant_b}

Messages:
{chr(10).join(messages_text)}"""

    try:
        response = client.complete(ENRICHMENT_SYSTEM_PROMPT, user_prompt)

        # Parse the JSON response
        # Strip markdown code fences if present
        response = response.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

        data = json.loads(response)

        # Check for content flags
        if data.get("content_flags"):
            console.print(
                f"  [yellow]Content flags detected: {data['content_flags']}[/yellow]"
            )
            return None

        # Build ProcessedArgument
        processed_messages = [
            ProcessedMessage(
                author=m["author"],
                body=m["body"],
                timestamp=str(m.get("timestamp") or ""),
                score=m.get("score"),
                quoted_text=m.get("quoted_text"),
            )
            for m in data["messages"]
        ]

        return ProcessedArgument(
            platform=thread.platform,
            platform_source=thread.source,
            original_url=thread.url,
            title=data["title"][:80],
            context_blurb=(data.get("context_blurb") or "")[:120] or None,
            topic_drift=data.get("topic_drift"),
            category=data["category"],
            heat_rating=max(1, min(5, data["heat_rating"])),
            user_a_display_name=data["user_a_display_name"],
            user_b_display_name=data["user_b_display_name"],
            user_a_zinger=data.get("user_a_zinger"),
            user_b_zinger=data.get("user_b_zinger"),
            messages=processed_messages,
            entertainment_score=data["entertainment_score"],
        )

    except json.JSONDecodeError as e:
        console.print(f"  [red]JSON parse error: {e}[/red]")
        return None
    except Exception as e:
        console.print(f"  [red]Enrichment error: {e}[/red]")
        return None


def batch_enrich(
    client: LLMClient,
    threads: list[RawThread],
    batch_size: int = 10,
    rate_limit_delay: float = 1.0,
) -> list[ProcessedArgument]:
    """Process threads in batches with rate limiting."""
    results: list[ProcessedArgument] = []

    for i in range(0, len(threads), batch_size):
        batch = threads[i : i + batch_size]
        console.print(
            f"\n[bold]Processing batch {i // batch_size + 1} "
            f"({len(batch)} threads)...[/bold]"
        )

        for j, thread in enumerate(batch):
            console.print(
                f"  [{j + 1}/{len(batch)}] "
                f"{thread.participant_a} vs {thread.participant_b}..."
            )

            result = enrich_thread(client, thread)
            if result:
                results.append(result)
                console.print(
                    f"    [green]✓[/green] Score: {result.entertainment_score}, "
                    f"Category: {result.category}"
                )
            else:
                console.print(f"    [dim]Skipped[/dim]")

            # Rate limiting between individual calls
            if j < len(batch) - 1:
                time.sleep(rate_limit_delay)

        # Extra delay between batches
        if i + batch_size < len(threads):
            console.print("[dim]Waiting between batches...[/dim]")
            time.sleep(rate_limit_delay * 2)

    console.print(f"\n[bold]Enriched {len(results)}/{len(threads)} threads[/bold]")
    return results
