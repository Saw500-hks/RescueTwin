"""NVIDIA Nemotron Client Integration for RescueTwin.
Interfaces with NVIDIA NIM API (OpenAI-compatible) using meta/llama-3.1-nemotron-70b-instruct
with seamless autonomous fallback when running in local offline demo mode.
"""
import os
import json
import httpx
from typing import List, Dict, Any, Optional
from app.agent.tools import NEMOTRON_TOOL_DEFINITIONS, TOOL_EXECUTORS

NEBIUS_STUDIO_BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.studio.nebius.ai/v1")
NVIDIA_NIM_BASE_URL = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
DEFAULT_NEMOTRON_MODEL = os.getenv("NEMOTRON_MODEL", "meta/llama-3.1-nemotron-70b-instruct")

class NemotronClient:
    def __init__(self):
        self.nebius_key = os.getenv("NEBIUS_API_KEY") or os.getenv("NEBIUS_TOKEN")
        self.nvidia_key = os.getenv("NVIDIA_API_KEY") or os.getenv("NIM_API_KEY")
        
        if self.nebius_key and len(self.nebius_key.strip()) > 8:
            self.provider = "Nebius Token Factory"
            self.api_key = self.nebius_key.strip()
            self.base_url = NEBIUS_STUDIO_BASE_URL
            self.model = os.getenv("NEMOTRON_MODEL", "nvidia/nemotron-4-340b-instruct")
        elif self.nvidia_key and len(self.nvidia_key.strip()) > 8:
            self.provider = "NVIDIA NIM"
            self.api_key = self.nvidia_key.strip()
            self.base_url = NVIDIA_NIM_BASE_URL
            self.model = DEFAULT_NEMOTRON_MODEL
        else:
            self.provider = "RescueTwin ReAct Engine (Nemotron Simulator)"
            self.api_key = None
            self.base_url = NVIDIA_NIM_BASE_URL
            self.model = DEFAULT_NEMOTRON_MODEL

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    @property
    def provider_name(self) -> str:
        return self.provider

    @property
    def has_nebius(self) -> bool:
        return bool(self.nebius_key and len(self.nebius_key.strip()) > 8)

    @property
    def has_nvidia(self) -> bool:
        return bool(self.nvidia_key and len(self.nvidia_key.strip()) > 8)

    async def call_nemotron(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """Calls the live NVIDIA Nemotron API via Nebius Token Factory or NVIDIA NIM."""
        if not self.has_api_key:
            raise ValueError(f"No valid API key configured for {self.provider}.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
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
