"""
LLM client abstraction with Claude and OpenAI implementations.
"""

import os
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()


class LLMClient(ABC):
    """Abstract base class for LLM clients."""

    @abstractmethod
    def complete(self, system: str, user: str) -> str:
        """Send a completion request and return the response text."""
        ...


class ClaudeClient(LLMClient):
    """Anthropic Claude client."""

    def __init__(self, model: str = "claude-haiku-4-5-20251001"):
        import anthropic

        self.client = anthropic.Anthropic(
            api_key=os.environ["ANTHROPIC_API_KEY"]
        )
        self.model = model

    def complete(self, system: str, user: str) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text


class OpenAIClient(LLMClient):
    """OpenAI client."""

    def __init__(self, model: str = "gpt-4o"):
        from openai import OpenAI

        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.model = model

    def complete(self, system: str, user: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""


def get_llm_client() -> LLMClient:
    """Factory: create LLM client based on LLM_PROVIDER env var."""
    provider = os.getenv("LLM_PROVIDER", "claude").lower()

    if provider == "openai":
        model = os.getenv("OPENAI_MODEL", "gpt-4o")
        return OpenAIClient(model=model)
    else:
        model = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
        return ClaudeClient(model=model)
