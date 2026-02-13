"""
Shared argument chain detection logic.

Walks comment trees to find exactly-2-author argument chains
with sufficient back-and-forth.
"""

from collections import defaultdict


def find_argument_chains(
    comments: list[dict],
    min_per_side: int = 3,
    max_per_side: int = 8,
    max_total: int = 16,
) -> list[dict]:
    """
    Find argument chains in a flat comment tree.

    Each comment dict must have: id, parent_id, author, body, score, timestamp, depth.

    Returns list of chains, each with:
      - participant_a, participant_b
      - messages: ordered list of comment dicts
    """
    # Build parent-child index
    children_of: dict[str, list[dict]] = defaultdict(list)
    comment_map: dict[str, dict] = {}

    for c in comments:
        comment_map[c["id"]] = c
        children_of[c["parent_id"]].append(c)

    # Walk each comment to find 2-person reply chains
    chains: list[dict] = []
    visited: set[str] = set()

    for comment in comments:
        if comment["id"] in visited:
            continue
        if comment["author"] == "[deleted]":
            continue

        # Try to build a chain starting from this comment
        chain = _build_chain(comment, comment_map, children_of, visited)

        if chain is None:
            continue

        authors = set(m["author"] for m in chain)
        if len(authors) != 2:
            continue

        author_list = sorted(authors)
        a_count = sum(1 for m in chain if m["author"] == author_list[0])
        b_count = sum(1 for m in chain if m["author"] == author_list[1])

        if a_count < min_per_side or b_count < min_per_side:
            continue

        # Mark all as visited
        for m in chain:
            visited.add(m["id"])

        # Trim if too long
        chain = _trim_chain(chain, max_total)

        chains.append(
            {
                "participant_a": author_list[0],
                "participant_b": author_list[1],
                "messages": chain,
            }
        )

    return chains


def _build_chain(
    start: dict,
    comment_map: dict[str, dict],
    children_of: dict[str, list[dict]],
    visited: set[str],
    max_depth: int = 30,
) -> list[dict] | None:
    """
    Build a reply chain from a starting comment.
    Follows the longest single-thread path between exactly 2 authors.
    """
    chain = [start]
    current = start
    authors = {start["author"]}

    for _ in range(max_depth):
        replies = children_of.get(current["id"], [])

        # Filter to non-deleted, non-visited replies
        valid_replies = [
            r
            for r in replies
            if r["author"] != "[deleted]" and r["id"] not in visited
        ]

        if not valid_replies:
            break

        # Prefer replies from existing participants (keeps it 2-person)
        from_participants = [r for r in valid_replies if r["author"] in authors]

        if from_participants:
            # Pick the one with the best score (or first)
            next_comment = max(
                from_participants, key=lambda r: r.get("score") or 0
            )
        elif len(authors) < 2:
            # Allow one new author
            next_comment = max(
                valid_replies, key=lambda r: r.get("score") or 0
            )
        else:
            break

        authors.add(next_comment["author"])
        if len(authors) > 2:
            break

        chain.append(next_comment)
        current = next_comment

    if len(chain) < 4:
        return None

    return chain


def _trim_chain(chain: list[dict], max_total: int) -> list[dict]:
    """
    Trim a chain to max_total messages.
    Keep first 4, last 4, and 2 highest-scored middle messages.
    """
    if len(chain) <= max_total:
        return chain

    if max_total <= 10:
        head = chain[:4]
        tail = chain[-4:]
        middle = chain[4:-4]

        # Pick 2 highest-scored middle messages
        remaining = max_total - len(head) - len(tail)
        if remaining > 0 and middle:
            scored = sorted(middle, key=lambda m: m.get("score") or 0, reverse=True)
            picks = scored[:remaining]
            # Maintain original order
            pick_ids = {m["id"] for m in picks}
            ordered_picks = [m for m in middle if m["id"] in pick_ids]
            return head + ordered_picks + tail
        return head + tail

    return chain[:max_total]
