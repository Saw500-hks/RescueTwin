"""Nebius Token Factory Client for RescueTwin.
Connects to Nebius AI Studio Token Factory (OpenAI-compatible) API to run NVIDIA Nemotron inference.
"""

import os
import json
import httpx
from typing import List, Dict, Any, Optional

NEBIUS_STUDIO_BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.studio.nebius.ai/v1")
DEFAULT_NEMOTRON_MODEL = os.getenv("NEBIUS_MODEL", "meta/llama-3.1-nemotron-70b-instruct")

class NebiusClient:
    def __init__(self):
        self.api_key = (
            os.getenv("NEBIUS_API_KEY") or
            os.getenv("NEBIUS_TOKEN") or
            os.getenv("NVIDIA_API_KEY")
        )
        self.base_url = os.getenv("NEBIUS_BASE_URL", NEBIUS_STUDIO_BASE_URL)
        self.model = os.getenv("NEBIUS_MODEL", DEFAULT_NEMOTRON_MODEL)
        self.provider = "Nebius Token Factory" if self.has_api_key else "Nebius Token Factory (Simulator)"

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """Dispatches chat completions to Nebius AI Studio Token Factory."""
        if not self.has_api_key:
            raise ValueError("Nebius API key is not configured. Running in simulator fallback mode.")

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

nebius_client = NebiusClient()
