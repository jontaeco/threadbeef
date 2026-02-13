"""Format ProcessedArgument into a DB-ready dict."""

from pipeline.models import ProcessedArgument


def format_for_db(argument: ProcessedArgument) -> dict:
    """Convert a ProcessedArgument into a dict matching arguments_ columns."""
    return {
        "platform": argument.platform,
        "platform_source": argument.platform_source,
        "original_url": argument.original_url,
        "title": argument.title,
        "context_blurb": argument.context_blurb,
        "topic_drift": argument.topic_drift,
        "category": argument.category,
        "heat_rating": argument.heat_rating,
        "user_a_display_name": argument.user_a_display_name,
        "user_b_display_name": argument.user_b_display_name,
        "user_a_zinger": argument.user_a_zinger,
        "user_b_zinger": argument.user_b_zinger,
        "messages": [
            {
                "author": m.author,
                "body": m.body,
                "timestamp": m.timestamp,
                "score": m.score,
                "quoted_text": m.quoted_text,
            }
            for m in argument.messages
        ],
        "entertainment_score": argument.entertainment_score,
        "status": argument.status,
    }
