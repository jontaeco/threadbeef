"""Pydantic models for the pipeline data flow."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RawMessage(BaseModel):
    """A single message from a thread, before processing."""

    author_id: str
    body: str
    timestamp: Optional[str] = None
    score: Optional[int] = None
    quoted_text: Optional[str] = None


class RawThread(BaseModel):
    """A raw argument thread extracted from a platform."""

    platform: str  # "reddit" | "hackernews"
    source: str  # e.g. "r/cooking", "HN"
    url: Optional[str] = None
    title: Optional[str] = None
    messages: list[RawMessage]
    participant_a: str
    participant_b: str


class ProcessedMessage(BaseModel):
    """A message after LLM processing, ready for DB."""

    author: str  # "a" | "b"
    body: str
    timestamp: str = ""
    score: Optional[int] = None
    quoted_text: Optional[str] = None


class ProcessedArgument(BaseModel):
    """Fully processed argument matching the arguments_ DB columns."""

    platform: str
    platform_source: str
    original_url: Optional[str] = None
    title: str = Field(max_length=80)
    context_blurb: Optional[str] = Field(default=None, max_length=120)
    topic_drift: Optional[str] = None
    category: str
    heat_rating: int = Field(ge=1, le=5)
    user_a_display_name: str
    user_b_display_name: str
    user_a_zinger: Optional[str] = None
    user_b_zinger: Optional[str] = None
    messages: list[ProcessedMessage]
    entertainment_score: Optional[float] = Field(default=None, ge=1.0, le=10.0)
    nsfw_level: Optional[str] = None  # "mild" | "spicy" | "nuclear"
    status: str = "pending_review"
