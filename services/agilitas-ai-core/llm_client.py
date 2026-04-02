import requests
import os
import json


class AgilitasLLMClient:
    """
    Model-agnostic LLM client for Agilitas AI Core.
    Supports local Ollama and Google Cloud Vertex AI.

    Local default is Motherbrain-host Ollama on port 11434.
    If running from Adam's laptop through the SSH tunnel, set:
      OLLAMA_HOST=http://127.0.0.1:11435
    """

    def __init__(self):
        ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
        self.ollama_host = ollama_host
        self.ollama_endpoint = f"{ollama_host}/api/generate"
        # Vertex AI settings would typically come from environment variables
        self.project_id = os.getenv("GCP_PROJECT_ID")
        self.location = os.getenv("GCP_LOCATION", "us-central1")

    def call_ollama(self, prompt, model="llama3.2:latest"):
        """
        Calls local Ollama.

        Default path is Motherbrain-local `127.0.0.1:11434`.
        Laptop-tunnel runs can override this via `OLLAMA_HOST=http://127.0.0.1:11435`.
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
