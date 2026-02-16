"""
Pre-LLM scoring to filter out non-arguments and boring content.

score_argumentness(): How much does this look like an argument?
score_entertainment(): How entertaining is this argument?
"""

import re
from pipeline.models import RawThread

# Confrontational markers
CONFRONTATIONAL_MARKERS = [
    r"\bactually\b",
    r"\bwrong\b",
    r"\byou clearly\b",
    r"\bthat's not\b",
    r"\byou('re| are) (wrong|mistaken|confused|ignorant)\b",
    r"\bnonsense\b",
    r"\bridiculous\b",
    r"\bidiotic\b",
    r"\bstupid\b",
    r"\bno offense\b",
    r"\blmao\b",
    r"\bwhat\?\b",
    r"\bare you serious\b",
    r"\byou (don't|dont) (know|understand)\b",
    r"\bimagine (thinking|believing)\b",
]

# Entertainment indicators
ENTERTAINMENT_MARKERS = [
    r"!{2,}",  # Multiple exclamation marks
    r"\?{2,}",  # Multiple question marks
    r"[A-Z]{4,}",  # CAPS shouting
    r"\blmao\b",
    r"\bbruh\b",
    r"\bsir\b.*\bthis is\b",
    r"\btouched grass\b",
    r"\bcope\b",
    r"\bseeth(e|ing)\b",
    r"\bpeak\b",
    r"\btake the L\b",
]


def score_argumentness(thread: RawThread) -> int:
    """
    Score how much a thread looks like a genuine argument (0-100).

    Factors:
    - Sentiment polarity / confrontational markers
    - Reply depth (alternating authors)
    - Score disparity between messages
    - Direct quoting / referencing
    """
    score = 0
    messages = thread.messages

    if len(messages) < 4:
        return 0

    # 1. Confrontational markers (up to 40 points)
    marker_count = 0
    for msg in messages:
        text = msg.body.lower()
        for pattern in CONFRONTATIONAL_MARKERS:
            if re.search(pattern, text, re.IGNORECASE):
                marker_count += 1

    score += min(40, marker_count * 5)

    # 2. Alternation quality (up to 25 points)
    # How often do authors alternate? (sign of back-and-forth)
    alternations = 0
    for i in range(1, len(messages)):
        if messages[i].author_id != messages[i - 1].author_id:
            alternations += 1

    alternation_ratio = alternations / max(1, len(messages) - 1)
    score += int(alternation_ratio * 25)

    # 3. Score disparity (up to 15 points)
    # Controversial comments (some upvoted, some downvoted) signal arguments
    scores = [m.score for m in messages if m.score is not None]
    if len(scores) >= 2:
        score_range = max(scores) - min(scores)
        if score_range > 20:
            score += 15
        elif score_range > 10:
            score += 10
        elif score_range > 3:
            score += 5

    # 4. Message length consistency (up to 10 points)
    # Arguments tend to have longer messages (people explaining their positions)
    avg_length = sum(len(m.body) for m in messages) / max(1, len(messages))
    if avg_length > 100:
        score += 10
    elif avg_length > 50:
        score += 5

    # 5. Direct references (up to 10 points)
    # Quoting or directly referencing the other person
    ref_count = 0
    for msg in messages:
        body_lower = msg.body.lower()
        if (
            ">" in msg.body
            or "you said" in body_lower
            or "your" in body_lower
            or "@" in msg.body
        ):
            ref_count += 1
    score += min(10, ref_count * 3)

    return min(100, score)


def score_entertainment(thread: RawThread) -> int:
    """
    Score how entertaining an argument is (0-100).

    Factors:
    - Absurdity / humor markers
    - Escalation arc
    - Zinger quality
    - Relatability (common topics)
    - Sweet spot length (6-10 messages)
    """
    score = 0
    messages = thread.messages

    # 1. Entertainment markers (up to 30 points)
    marker_count = 0
    for msg in messages:
        for pattern in ENTERTAINMENT_MARKERS:
            if re.search(pattern, msg.body):
                marker_count += 1

    score += min(30, marker_count * 4)

    # 2. Escalation arc (up to 25 points)
    # Messages getting longer or more heated over time
    lengths = [len(m.body) for m in messages]
    if len(lengths) >= 4:
        first_half_avg = sum(lengths[: len(lengths) // 2]) / max(
            1, len(lengths) // 2
        )
        second_half_avg = sum(lengths[len(lengths) // 2 :]) / max(
            1, len(lengths) - len(lengths) // 2
        )
        if second_half_avg > first_half_avg * 1.5:
            score += 25
        elif second_half_avg > first_half_avg * 1.2:
            score += 15
        elif second_half_avg > first_half_avg:
            score += 8

    # 3. Length bonus (up to 15 points)
    # Longer arguments = more investment from both sides = likely more entertaining
    msg_count = len(messages)
    if msg_count >= 6:
        score += 15
    elif msg_count >= 4:
        score += 10

    # 4. Caps usage / emphasis (up to 15 points)
    caps_count = sum(
        1 for m in messages if re.search(r"[A-Z]{3,}", m.body)
    )
    score += min(15, caps_count * 4)

    # 5. Topic variety bonus (up to 10 points)
    # If the argument drifts topics, it's often more entertaining
    all_text = " ".join(m.body for m in messages)
    unique_words = len(set(all_text.lower().split()))
    if unique_words > 200:
        score += 10
    elif unique_words > 100:
        score += 5

    return min(100, score)
