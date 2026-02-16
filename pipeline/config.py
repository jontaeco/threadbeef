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


@dataclass
class YouTubeConfig:
    """YouTube Data API v3 settings."""

    api_key: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_API_KEY", "")
    )
    max_results_per_video: int = 100
    max_comments: int = 1000
    min_messages_per_side: int = 3


@dataclass
class LLMConfig:
    """LLM provider and processing settings."""

    provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "kimi")
    )
    claude_model: str = "claude-haiku-4-5-20251001"
    openai_model: str = "gpt-4o"
    kimi_model: str = "kimi-k2.5"
    entertainment_threshold: float = 5.5
    batch_size: int = 10

    # Scoring thresholds for pre-LLM filtering
    argumentness_threshold: int = 30
    entertainment_pre_threshold: int = 30


# Static evergreen queries — broad enough to surface fresh content each run
YOUTUBE_SEARCH_QUERIES = [
    "debate goes wrong",
    "change my mind argument",
    "heated argument comments",
    "controversial opinion reaction",
    "unpopular gaming opinions",
    "relationship advice gone wrong",
    "comment section fight",
    "worst take ever",
    "most controversial opinion",
    "people arguing in comments",
]
