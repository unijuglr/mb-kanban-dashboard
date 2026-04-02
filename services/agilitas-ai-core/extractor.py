import os
import json
from typing import Dict, List, Any
import sys

class AgilitasExtractor:
    """
    Agilitas Core AI Extractor (7-Dimension Schema)
    This defines the interface for interacting with both
    cloud-scale (Vertex AI) and local (Ollama) AI models.
    """
    
    def __init__(self, use_cloud: bool = False, redact_pii: bool = True):
        self.use_cloud = use_cloud
        self.redact_pii = redact_pii
        
        # Load LLM client from current directory
        import importlib.util
        current_dir = os.path.dirname(os.path.abspath(__file__))
        client_path = os.path.join(current_dir, 'llm_client.py')
        
        spec = importlib.util.spec_from_file_location("agilitas_llm_client", client_path)
        client_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(client_module)
        
        self.client = client_module.AgilitasLLMClient()

        # Load PII Redactor
        if self.redact_pii:
            redactor_path = os.path.join(current_dir, 'redaction', 'presidio_redactor.py')
            if os.path.exists(redactor_path):
                r_spec = importlib.util.spec_from_file_location("agilitas_redactor", redactor_path)
                r_module = importlib.util.module_from_spec(r_spec)
                r_spec.loader.exec_module(r_module)
                self.redactor = r_module.get_redactor()
            else:
                self.redactor = None
        else:
            self.redactor = None

    def extract_dimensions(self, transcript: str) -> Dict[str, Any]:
        """
        Processes a raw transcript and returns an extraction based on the
        7-dimension Agilitas schema.
        """
        # 1. Redact PII first if enabled
        processed_transcript = transcript
        if self.redactor:
            processed_transcript = self.redactor.redact(transcript)

        # 2. Build Prompt
        prompt = f"""
        Extract the following 7 dimensions from the transcript below in JSON format:
        1. sentiment: Overall tone (Positive, Neutral, Negative)
        2. pain_points: List of specific obstacles mentioned
        3. emotion: Underlying feeling (Frustration, Delight, etc.)
        4. effort: Perceived difficulty (Low, Medium, High)
        5. competitors: Mentions of rival solutions
        6. innovation: Suggestions for features or improvements
        7. summary: Concise recap

        Transcript:
        {processed_transcript}
        
        Return ONLY valid JSON.
        """

        # 3. Call LLM
        if self.use_cloud:
            response = self.client.complete(prompt, provider="vertex")
        else:
            response = self.client.complete(prompt, provider="ollama")
        
        # 4. Parse Result
        try:
            # Clean up response if it has markdown blocks
            clean_response = response.strip()
            if "```json" in clean_response:
                clean_response = clean_response.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_response:
                clean_response = clean_response.split("```")[1].split("```")[0].strip()
            
            return json.loads(clean_response)
        except Exception as e:
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }

if __name__ == "__main__":
    # Basic usage test
    extractor = AgilitasExtractor(use_cloud=False)
    sample_text = "I love the new UI but hate the lack of Slack integration."
    result = extractor.extract_dimensions(sample_text)
    print(json.dumps(result, indent=2))
