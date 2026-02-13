"""Pipeline configuration: subreddit targets, thresholds, LLM settings."""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class RedditConfig:
    """Target subreddits and scraping thresholds."""

    subreddits: list[str] = field(
        default_factory=lambda: [
            "AmItheAsshole",
            "unpopularopinion",
            "changemyview",
            "cooking",
            "relationships",
            "gaming",
            "movies",
            "music",
            "technology",
            "AskReddit",
            "mildlyinfuriating",
        ]
    )
    posts_per_subreddit: int = 25
    sort_modes: list[str] = field(
        default_factory=lambda: ["hot", "top", "controversial"]
    )
    min_messages_per_side: int = 3
    max_messages_per_side: int = 8
    max_total_messages: int = 16
    min_score: int = 5


@dataclass
class HNConfig:
    """Hacker News API settings."""

    base_url: str = "https://hacker-news.firebaseio.com/v0"
    story_types: list[str] = field(
        default_factory=lambda: ["topstories", "beststories"]
    )
    stories_per_type: int = 30
    min_messages_per_side: int = 3
    max_messages_per_side: int = 8
    max_total_messages: int = 16


@dataclass
class YouTubeConfig:
    """YouTube Data API v3 settings."""

    api_key: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_API_KEY", "")
    )
    max_results_per_video: int = 100
    min_messages_per_side: int = 3
    max_messages_per_side: int = 8
    max_total_messages: int = 16


@dataclass
class LLMConfig:
    """LLM provider and processing settings."""

    provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "claude")
    )
    claude_model: str = "claude-sonnet-4-5-20250929"
    openai_model: str = "gpt-4o"
    entertainment_threshold: float = 5.0
    batch_size: int = 10

    # Scoring thresholds for pre-LLM filtering
    argumentness_threshold: int = 30
    entertainment_pre_threshold: int = 30


YOUTUBE_SEARCH_QUERIES = [
    "debate goes wrong",
    "change my mind argument",
    "heated argument comments",
    "controversial opinion reaction",
    "is a hot dog a sandwich debate",
    "tabs vs spaces debate",
    "iphone vs android debate",
    "worst food takes",
    "unpopular gaming opinions",
    "relationship advice gone wrong",
]

# Categories matching the app's category enum
CATEGORIES = [
    "petty",
    "tech",
    "food_takes",
    "unhinged",
    "relationship",
    "gaming",
    "sports",
    "politics",
    "aita",
    "pedantic",
    "movies_tv",
    "music",
    "philosophy",
    "money",
]
