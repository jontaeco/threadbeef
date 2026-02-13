"""Direct Postgres connection for pipeline insertion."""

import os
import json
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Create a new database connection."""
    return psycopg2.connect(os.environ["DATABASE_URL"])


def insert_argument(data: dict) -> Optional[int]:
    """
    Insert a processed argument into the arguments table.
    Returns the beef_number of the inserted row, or None on failure.
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO arguments (
                    platform, platform_source, original_url,
                    title, context_blurb, topic_drift,
                    category, heat_rating,
                    user_a_display_name, user_b_display_name,
                    user_a_zinger, user_b_zinger,
                    messages, entertainment_score, status
                ) VALUES (
                    %(platform)s, %(platform_source)s, %(original_url)s,
                    %(title)s, %(context_blurb)s, %(topic_drift)s,
                    %(category)s, %(heat_rating)s,
                    %(user_a_display_name)s, %(user_b_display_name)s,
                    %(user_a_zinger)s, %(user_b_zinger)s,
                    %(messages)s, %(entertainment_score)s, %(status)s
                )
                RETURNING beef_number
                """,
                {
                    **data,
                    "messages": json.dumps(data["messages"]),
                    "status": data.get("status", "pending_review"),
                },
            )
            result = cur.fetchone()
            conn.commit()
            return result["beef_number"] if result else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def get_stats() -> dict:
    """Get pipeline stats from the database."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    status,
                    COUNT(*) as count
                FROM arguments
                GROUP BY status
                """
            )
            status_counts = {row["status"]: row["count"] for row in cur.fetchall()}

            cur.execute(
                """
                SELECT
                    category,
                    COUNT(*) as count
                FROM arguments
                WHERE status = 'approved'
                GROUP BY category
                ORDER BY count DESC
                """
            )
            category_counts = {
                row["category"]: row["count"] for row in cur.fetchall()
            }

            cur.execute("SELECT COUNT(*) as total FROM arguments")
            total = cur.fetchone()["total"]

            return {
                "total": total,
                "by_status": status_counts,
                "approved_by_category": category_counts,
            }
    finally:
        conn.close()
