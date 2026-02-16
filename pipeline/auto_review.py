"""
Auto-review pending arguments using LLM.

Criteria:
1. Real back-and-forth — both sides actively engaging
2. Context coherence — fix orphan messages from 3-person trimming, reject if too confusing
3. Entertaining — genuinely funny, dramatic, or relatable. Reject boring/dry.
4. No message cap — arguments run as long as they naturally go
5. No content censorship — tag NSFW intensity instead of rejecting
6. Free-form categories — LLM assigns whatever fits best
"""

import json
import os
import sys
import time
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv()

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from processing.llm_client import get_llm_client
from db import get_connection

console = Console()

REVIEW_SYSTEM_PROMPT = """You are a content curator for ThreadBeef, a TikTok-style app where users swipe through internet arguments and vote on who won. The brand is irreverent, funny, and entertaining — like your funniest friend showing you a screenshot of two strangers fighting about nothing.

You are reviewing arguments that have already been scraped and enriched. Your job is to APPROVE or REJECT each one, optionally FIX minor issues, and TAG content intensity.

## APPROVE if:
- It's a real back-and-forth argument where both sides are actively engaging
- It's entertaining — funny, dramatic, relatable, or has a great zinger
- It would make someone want to vote on who won
- Politics, duplicates of other topics, and long threads are all fine
- Both sides reaching agreement is OK if the argument getting there was entertaining
- One side being confidently wrong is perfectly fine — that's comedy gold
- Trolling is fine, especially when the other person takes the bait

## REJECT if:
- One side is barely participating (monologue, ignored responses)
- One side dominates the entire thread with the other side barely responding at all (e.g. 8 messages from A and only 1-2 from B). Consecutive messages from one side are FINE if they're making a hearty point — the issue is when the overall thread is lopsided and the other person clearly isn't engaging.
- It's boring, dry, or reads like an academic paper with no entertainment value
- The context is too confusing to follow (e.g. clearly a 3+ person convo trimmed badly, with references to things that make no sense)
- Entertainment score is below 5.5 — these should not have made it this far

## FIX if:
- The argument is good but has 1-2 orphan messages that clearly reference a third person or missing context. Delete those specific messages and approve.
- Only fix if the result still makes sense as a coherent argument.

## NSFW Intensity Tagging (REQUIRED for all approvals):
Tag every approved argument with one of these intensity levels:
- "mild" — clean or light insults, nothing offensive
- "spicy" — harsh personal attacks, crude language, aggressive tone
- "nuclear" — slurs, extreme language, highly offensive content

## Category (REQUIRED for all approvals):
Assign whatever category fits best. You are NOT limited to a fixed list. Use short, lowercase, snake_case labels. Examples: "petty", "tech", "politics", "food_takes", "gaming", "philosophy", "relationship", "sports", "aita", "science", "cars", "fitness", "anime", "religion", etc. Use your judgment — if none of the common ones fit, make up a new one.

For each argument, respond with ONLY valid JSON:
{
  "decision": "approve" | "reject" | "fix",
  "reason": "<1 sentence explaining why>",
  "nsfw_level": "mild" | "spicy" | "nuclear",
  "category": "<best-fit category in snake_case>",
  "delete_message_indices": [<0-based indices of messages to remove, only if decision is "fix">]
}

Return ONLY the JSON object, no markdown fences, no extra text."""


def fetch_pending():
    """Fetch all pending_review arguments from the database."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, beef_number, title, category, entertainment_score, heat_rating,
               user_a_display_name, user_b_display_name, context_blurb, messages
        FROM arguments
        WHERE status = 'pending_review'
        ORDER BY entertainment_score DESC
    """)
    columns = [desc[0] for desc in cur.description]
    rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def apply_decision(beef_id: str, decision: str, messages_json=None, nsfw_level=None, category=None):
    """Update the argument status in the database."""
    conn = get_connection()
    cur = conn.cursor()
    if decision == "approve":
        updates = ["status = 'approved'"]
        params = []
        if messages_json is not None:
            updates.append("messages = %s")
            params.append(messages_json)
        if nsfw_level is not None:
            updates.append("nsfw_level = %s")
            params.append(nsfw_level)
        if category is not None:
            updates.append("category = %s")
            params.append(category)
        params.append(beef_id)
        cur.execute(
            f"UPDATE arguments SET {', '.join(updates)} WHERE id = %s",
            params,
        )
    elif decision == "reject":
        cur.execute(
            "UPDATE arguments SET status = 'rejected' WHERE id = %s",
            (beef_id,),
        )
    conn.commit()
    cur.close()
    conn.close()


def review_argument(client, arg: dict) -> dict:
    """Send a single argument to the LLM for review."""
    messages = arg["messages"]
    if isinstance(messages, str):
        messages = json.loads(messages)

    # Build readable thread for the LLM
    lines = []
    for i, msg in enumerate(messages):
        author_name = arg["user_a_display_name"] if msg["author"] == "a" else arg["user_b_display_name"]
        quoted = f'\n  > Quoting: "{msg["quoted_text"]}"' if msg.get("quoted_text") else ""
        lines.append(f"[{i}] {author_name} ({msg['author']}): {msg['body']}{quoted}")

    user_prompt = f"""Title: {arg['title']}
Category: {arg['category']}
Entertainment Score: {arg['entertainment_score']}
Heat: {arg['heat_rating']}/5
Context: {arg.get('context_blurb', 'N/A')}

{arg['user_a_display_name']} vs {arg['user_b_display_name']}

Messages ({len(messages)} total):
{chr(10).join(lines)}"""

    try:
        response = client.complete(REVIEW_SYSTEM_PROMPT, user_prompt)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
        return json.loads(response)
    except Exception as e:
        console.print(f"  [red]Review error for #{arg['beef_number']}: {e}[/red]")
        return {"decision": "skip", "reason": "Review failed, keeping as pending for manual review"}


def main():
    console.print("[bold red]🥩 ThreadBeef Auto-Reviewer[/bold red]\n")

    pending = fetch_pending()
    console.print(f"Found [bold]{len(pending)}[/bold] pending arguments\n")

    if not pending:
        console.print("[dim]Nothing to review.[/dim]")
        return

    client = get_llm_client()
    console.print(f"Using [bold]{type(client).__name__}[/bold] ({client.model})\n")

    approved = 0
    rejected = 0
    fixed = 0
    skipped = 0

    # Pre-filter: reject anything below entertainment score threshold
    score_threshold = 5.5
    pre_rejected = [a for a in pending if (a.get("entertainment_score") or 0) < score_threshold]
    pending = [a for a in pending if (a.get("entertainment_score") or 0) >= score_threshold]

    for arg in pre_rejected:
        apply_decision(arg["id"], "reject")
        rejected += 1
        console.print(
            f"  [red]✗ AUTO-REJECTED[/red] #{arg['beef_number']} — "
            f"Score {arg['entertainment_score']} below {score_threshold} threshold"
        )

    for i, arg in enumerate(pending):
        console.print(
            f"[{i + 1}/{len(pending)}] [bold]#{arg['beef_number']}[/bold] — {arg['title']}"
        )

        result = review_argument(client, arg)
        decision = result.get("decision", "skip")
        reason = result.get("reason", "")
        nsfw_level = result.get("nsfw_level")
        category = result.get("category")

        if decision == "fix":
            # Remove orphan messages
            messages = arg["messages"]
            if isinstance(messages, str):
                messages = json.loads(messages)
            indices_to_delete = sorted(result.get("delete_message_indices", []), reverse=True)
            for idx in indices_to_delete:
                if 0 <= idx < len(messages):
                    messages.pop(idx)
            apply_decision(arg["id"], "approve", json.dumps(messages), nsfw_level, category)
            fixed += 1
            nsfw_tag = f" [{nsfw_level}]" if nsfw_level else ""
            console.print(f"  [yellow]✂ FIXED[/yellow]{nsfw_tag} (removed {len(indices_to_delete)} msgs) — {reason}")
        elif decision == "approve":
            apply_decision(arg["id"], "approve", nsfw_level=nsfw_level, category=category)
            approved += 1
            nsfw_tag = f" [{nsfw_level}]" if nsfw_level else ""
            console.print(f"  [green]✓ APPROVED[/green]{nsfw_tag} — {reason}")
        elif decision == "reject":
            apply_decision(arg["id"], "reject")
            rejected += 1
            console.print(f"  [red]✗ REJECTED[/red] — {reason}")
        else:
            # skip — leave as pending_review for manual review
            skipped += 1
            console.print(f"  [dim]⏭ SKIPPED[/dim] — {reason}")

        # Rate limit
        if i < len(pending) - 1:
            time.sleep(0.5)

    # Summary
    console.print()
    table = Table(title="Review Summary")
    table.add_column("Status", style="bold")
    table.add_column("Count", justify="right")
    table.add_row("[green]Approved[/green]", str(approved))
    table.add_row("[yellow]Fixed & Approved[/yellow]", str(fixed))
    table.add_row("[red]Rejected[/red]", str(rejected))
    table.add_row("[dim]Skipped (pending)[/dim]", str(skipped))
    table.add_row("[bold]Total[/bold]", str(len(pending) + len(pre_rejected)))
    console.print(table)


if __name__ == "__main__":
    main()
