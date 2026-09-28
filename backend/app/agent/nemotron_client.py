"""NVIDIA Nemotron Client Integration for RescueTwin.
Interfaces with NVIDIA NIM API (OpenAI-compatible) using meta/llama-3.1-nemotron-70b-instruct
with seamless autonomous fallback when running in local offline demo mode.
"""
import os
import json
import httpx
from typing import List, Dict, Any, Optional
from app.agent.tools import NEMOTRON_TOOL_DEFINITIONS, TOOL_EXECUTORS

NVIDIA_NIM_BASE_URL = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
NEMOTRON_MODEL = os.getenv("NEMOTRON_MODEL", "meta/llama-3.1-nemotron-70b-instruct")

class NemotronClient:
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("NIM_API_KEY")
        self.base_url = NVIDIA_NIM_BASE_URL
        self.model = NEMOTRON_MODEL

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    async def call_nemotron(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """Calls the live NVIDIA NIM Nemotron API."""
        if not self.has_api_key:
            raise ValueError("No valid NVIDIA_API_KEY found in environment.")

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
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

# Global singleton
nemotron_client = NemotronClient()
