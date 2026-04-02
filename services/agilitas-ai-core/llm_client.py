import requests
import os
import json
import socket
from urllib.parse import urlparse


class AgilitasLLMClient:
    """
    Model-agnostic LLM client for Agilitas AI Core.
    Supports local Ollama and Google Cloud Vertex AI.
    """

    def __init__(self):
        self.ollama_base_url = self._resolve_ollama_base_url()
        self.ollama_endpoint = f"{self.ollama_base_url}/api/generate"
        # Vertex AI settings would typically come from environment variables
        self.project_id = os.getenv("GCP_PROJECT_ID")
        self.location = os.getenv("GCP_LOCATION", "us-central1")

    def _resolve_ollama_base_url(self):
        """
        Resolve the Ollama base URL from environment.

        Accepted forms:
        - AGILITAS_OLLAMA_HOST=http://127.0.0.1:11435
        - OLLAMA_HOST=http://127.0.0.1:11435
        - OLLAMA_BASE_URL=http://127.0.0.1:11435
        - OLLAMA_ENDPOINT=http://127.0.0.1:11435/api/generate

        Defaults to the laptop tunnel for Motherbrain-local access.
        """
        configured = (
            os.getenv("AGILITAS_OLLAMA_HOST")
            or os.getenv("OLLAMA_ENDPOINT")
            or os.getenv("OLLAMA_BASE_URL")
            or os.getenv("OLLAMA_HOST")
            or "http://127.0.0.1:11435"
        ).strip()

        if configured.endswith("/api/generate"):
            configured = configured[: -len("/api/generate")]

        configured = configured.rstrip("/")
        tunnel_default = "http://127.0.0.1:11435"

        # Guard against the common local mismatch where a generic OLLAMA_HOST
        # points at 11434, but the usable Motherbrain path for this demo is the
        # laptop tunnel on 11435.
        if (
            os.getenv("AGILITAS_OLLAMA_HOST") is None
            and os.getenv("OLLAMA_ENDPOINT") is None
            and os.getenv("OLLAMA_BASE_URL") is None
            and configured == "http://127.0.0.1:11434"
            and self._is_reachable(tunnel_default)
            and not self._is_reachable(configured)
        ):
            return tunnel_default

        return configured

    def _is_reachable(self, base_url):
        parsed = urlparse(base_url)
        host = parsed.hostname
        port = parsed.port
        if not host or not port:
            return False

        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            return False

    def call_ollama(self, prompt, model="llama3.2:latest"):
        """
        Calls local Ollama instance via the MB tunnel (port 11435).
        """
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        try:
            response = requests.post(self.ollama_endpoint, json=payload, timeout=60)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            return f"Ollama Error: {str(e)}"

    def call_vertex(self, prompt, model="gemini-1.5-flash"):
        """
        Calls Google Cloud Vertex AI. 
        Note: This implementation assumes standard Google Cloud authentication
        is configured in the environment (e.g., GOOGLE_APPLICATION_CREDENTIALS).
        """
        # Note: Using the REST API for Vertex AI for simplicity in this client.
        # In a production environment, using the `google-cloud-aiplatform` SDK is preferred.
        endpoint = f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/{model}:streamGenerateContent"
        
        # This is a placeholder for the auth token. In a real environment, 
        # you'd use google-auth to get a fresh token.
        auth_token = os.getenv("GCP_AUTH_TOKEN") 
        
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        try:
            # Note: streamGenerateContent returns a stream of JSON objects.
            # For a 'complete' style, we'd aggregate them.
            response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Simplified parsing for the unified interface
            results = response.json()
            # Vertex returns an array of candidates
            text_parts = []
            for response_item in results:
                for candidate in response_item.get("candidates", []):
                    for part in candidate.get("content", {}).get("parts", []):
                        text_parts.append(part.get("text", ""))
            
            return "".join(text_parts)
            
        except requests.exceptions.RequestException as e:
            return f"Vertex AI Error: {str(e)}"

    def complete(self, prompt, provider="ollama", model=None):
        """
        Unified completion method.
        """
        if provider == "ollama":
            target_model = model if model else "llama3.2:latest"
            return self.call_ollama(prompt, model=target_model)
        elif provider == "vertex":
            target_model = model if model else "gemini-1.5-flash"
            return self.call_vertex(prompt, model=target_model)
        else:
            return f"Error: Unsupported provider '{provider}'"

if __name__ == "__main__":
    # Basic self-test
    client = AgilitasLLMClient()
    print("Testing AgilitasLLMClient initialization...")
