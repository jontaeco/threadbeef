"""
Content filtering: pre-filter (before LLM) and post-filter (after LLM).

No content censorship — slurs and edgy content are tagged with NSFW intensity
levels (mild/spicy/nuclear) instead of rejected. Only structural quality checks.
"""

import re
from pipeline.models import RawThread, ProcessedArgument


def pre_filter(thread: RawThread) -> tuple[bool, str]:
    """
    Pre-filter before LLM processing.
    Only structural quality checks — no content censorship.
    Returns (passed, reason).
    """
    messages = thread.messages

    # Minimum message count (need at least 6 for a real back-and-forth)
    if len(messages) < 4:
        return False, f"Too few messages ({len(messages)})"

    # No upper message cap — arguments run as long as they naturally go

    # Min average length 20 chars
    avg_length = sum(len(m.body) for m in messages) / max(1, len(messages))
    if avg_length < 20:
        return False, f"Messages too short (avg {avg_length:.0f} chars)"

    # Basic English check — look for common English words
    all_text = " ".join(m.body for m in messages)
    english_markers = ["the", "is", "are", "was", "have", "that", "this", "with"]
    lower_text = all_text.lower()
    english_hits = sum(1 for w in english_markers if f" {w} " in lower_text)
    if english_hits < 2:
        return False, "Likely not English"

    # Check for deleted content
    deleted_count = sum(
        1
        for m in messages
        if m.body in ("[deleted]", "[removed]", "")
        or m.author_id == "[deleted]"
    )
    if deleted_count > len(messages) * 0.3:
        return False, f"Too many deleted messages ({deleted_count})"

    return True, "ok"


def post_filter(
    argument: ProcessedArgument,
    entertainment_threshold: float = 5.5,
) -> tuple[bool, str]:
    """
    Post-filter after LLM enrichment.
    Returns (passed, reason).
    """
    # Entertainment threshold (unified at 5.5 across the pipeline)
    if (
        argument.entertainment_score is not None
        and argument.entertainment_score < entertainment_threshold
    ):
        return (
            False,
            f"Entertainment score too low ({argument.entertainment_score})",
        )

    # Verify minimum message count after cleaning
    if len(argument.messages) < 4:
        return False, f"Too few messages after cleaning ({len(argument.messages)})"

    # Verify both sides have messages
    a_count = sum(1 for m in argument.messages if m.author == "a")
    b_count = sum(1 for m in argument.messages if m.author == "b")
    if a_count < 2 or b_count < 2:
        return False, f"Unbalanced sides (a={a_count}, b={b_count})"

    return True, "ok"
