"""
Content filtering: pre-filter (before LLM) and post-filter (after LLM).
"""

import re
from pipeline.models import RawThread, ProcessedArgument

# Slur list — common offensive terms to auto-reject
SLUR_PATTERNS = [
    r"\bn[i!1]gg[ae3]r?\b",
    r"\bf[a@]gg?[o0]t\b",
    r"\br[e3]t[a@]rd\b",
    r"\bk[i1]ke\b",
    r"\bch[i1]nk\b",
    r"\bsp[i1]c\b",
    r"\btr[a@]nn[yi]\b",
]


def pre_filter(thread: RawThread) -> tuple[bool, str]:
    """
    Pre-filter before LLM processing.
    Returns (passed, reason).
    """
    messages = thread.messages

    # Check message count bounds (4-20)
    if len(messages) < 4:
        return False, f"Too few messages ({len(messages)})"
    if len(messages) > 20:
        return False, f"Too many messages ({len(messages)})"

    # Min average length 20 chars
    avg_length = sum(len(m.body) for m in messages) / max(1, len(messages))
    if avg_length < 20:
        return False, f"Messages too short (avg {avg_length:.0f} chars)"

    # Check for slurs
    all_text = " ".join(m.body for m in messages)
    for pattern in SLUR_PATTERNS:
        if re.search(pattern, all_text, re.IGNORECASE):
            return False, "Contains slur"

    # Basic English check — look for common English words
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
    entertainment_threshold: float = 7.0,
) -> tuple[bool, str]:
    """
    Post-filter after LLM enrichment.
    Returns (passed, reason).
    """
    # Entertainment threshold
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
