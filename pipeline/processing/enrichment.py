"""
LLM-based enrichment: scoring, categorization, anonymization, and more.
"""

import json
import time
from typing import Optional
from rich.console import Console

from pipeline.models import RawThread, ProcessedArgument, ProcessedMessage
from pipeline.processing.llm_client import LLMClient

console = Console()

ENRICHMENT_SYSTEM_PROMPT = """You are an expert at analyzing internet arguments for entertainment value.
Given a raw argument thread, produce a JSON object with the following fields:

{
  "entertainment_score": <float 1.0-10.0, how entertaining is this argument>,
  "category": <string, lowercase snake_case category that best fits — use your judgment, e.g. "petty", "tech", "politics", "food_takes", "gaming", "philosophy", "relationship", "sports", "aita", "religion", "science", "cars", "fitness", "anime", etc.>,
  "heat_rating": <int 1-5, how heated the argument gets>,
  "title": <string, max 80 chars, catchy title for the argument>,
  "context_blurb": <string, max 120 chars, one-sentence summary>,
  "topic_drift": <string or null, "Started about X → Ended about Y" if topics changed>,
  "user_a_display_name": <string, anonymized creative username for participant A>,
  "user_b_display_name": <string, anonymized creative username for participant B>,
  "user_a_zinger": <string or null, best/funniest line from user A>,
  "user_b_zinger": <string or null, best/funniest line from user B>,
  "messages": <array of cleaned messages, each with: author ("a" or "b"), body (PII removed, platform noise stripped), timestamp, score, quoted_text>,
  "nsfw_level": <string, "mild" | "spicy" | "nuclear" — tag the intensity of language/content>
}

Rules:
- Anonymize all usernames. Never include real usernames in output.
- Remove PII (real names, emails, phone numbers, addresses) from message bodies.
- Strip platform-specific noise (Reddit formatting artifacts, "Edit:", award edits, etc.)
- Map the original authors to "a" and "b" consistently.
- Be honest about entertainment_score — only score 7+ if genuinely entertaining.
- Assign whatever category fits best — you are NOT limited to a fixed list.
- For zingers, pick the single funniest/most devastating line from each side.
- nsfw_level: "mild" = clean/light insults, "spicy" = harsh attacks/crude language, "nuclear" = slurs/extreme content.
- Do NOT reject or flag content for being offensive — just tag the intensity level.

Return ONLY valid JSON, no markdown code fences."""


MAX_MESSAGES_FOR_ENRICHMENT = 15
MAX_RETRIES = 2


def _build_enrichment_prompt(thread: RawThread) -> str:
    """Build the user prompt, truncating long threads to avoid output token limits."""
    messages = thread.messages
    truncated = False

    if len(messages) > MAX_MESSAGES_FOR_ENRICHMENT:
        # Keep first 6, last 6, and 3 from the middle for context
        head = messages[:6]
        tail = messages[-6:]
        middle_start = len(messages) // 2 - 1
        middle = messages[middle_start : middle_start + 3]
        messages = head + middle + tail
        truncated = True

    messages_text = []
    for msg in messages:
        messages_text.append(
            f"[{msg.author_id}] (score: {msg.score}): {msg.body}"
        )

    truncation_note = ""
    if truncated:
        truncation_note = (
            f"\n\n(Thread has {len(thread.messages)} total messages. "
            f"Showing {len(messages)} representative messages — first 6, "
            f"3 from middle, last 6. Include ALL shown messages in your output.)"
        )

    return f"""Platform: {thread.platform}
Source: {thread.source}
Thread title: {thread.title or "N/A"}
Participant A: {thread.participant_a}
Participant B: {thread.participant_b}

Messages:
{chr(10).join(messages_text)}{truncation_note}"""


def _parse_llm_response(response: str) -> dict:
    """Parse LLM response, stripping markdown fences if present."""
    response = response.strip()
    if response.startswith("```"):
        response = response.split("\n", 1)[1]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
    return json.loads(response)


def enrich_thread(
    client: LLMClient,
    thread: RawThread,
) -> Optional[ProcessedArgument]:
    """Enrich a single thread using the LLM, with retry on failure."""
    user_prompt = _build_enrichment_prompt(thread)

    for attempt in range(MAX_RETRIES):
        try:
            response = client.complete(ENRICHMENT_SYSTEM_PROMPT, user_prompt)
            data = _parse_llm_response(response)

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
                nsfw_level=data.get("nsfw_level"),
            )

        except json.JSONDecodeError as e:
            if attempt < MAX_RETRIES - 1:
                console.print(f"    [yellow]Retry {attempt + 1} (JSON error)[/yellow]")
                time.sleep(1)
            else:
                console.print(f"  [red]JSON parse error after {MAX_RETRIES} attempts: {e}[/red]")
                return None
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                console.print(f"    [yellow]Retry {attempt + 1} ({e})[/yellow]")
                time.sleep(1)
            else:
                console.print(f"  [red]Enrichment error after {MAX_RETRIES} attempts: {e}[/red]")
                return None

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
