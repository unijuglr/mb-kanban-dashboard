import os
import json
import re
from typing import Dict, List, Any, Optional
import sys

class AgilitasExtractor:
    """
    Agilitas Core AI Extractor (7-Dimension Schema)
    This defines the interface for interacting with both
    cloud-scale (Vertex AI) and local (Ollama) AI models.
    """
    
    def __init__(self, use_cloud: bool = False, redact_pii: bool = True, deterministic_fallback: bool = True):
        self.use_cloud = use_cloud
        self.redact_pii = redact_pii
        self.deterministic_fallback = deterministic_fallback
        
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

    def extract_dimensions(self, transcript: str, provider: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Processes a raw transcript and returns an extraction based on the
        7-dimension Agilitas schema.
        """
        processed_transcript = transcript
        if self.redactor:
            processed_transcript = self.redactor.redact(transcript)

        selected_provider = provider or ("vertex" if self.use_cloud else "ollama")
        if selected_provider == "deterministic":
            return self._deterministic_extract(processed_transcript, source_provider="deterministic")

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

        response = self.client.complete(prompt, provider=selected_provider, model=model)
        if self._response_signals_provider_failure(response):
            if self.deterministic_fallback:
                fallback = self._deterministic_extract(processed_transcript, source_provider="deterministic-fallback")
                fallback["providerWarning"] = response
                return fallback
            return {
                "error": "Provider call failed before JSON extraction.",
                "raw_response": response,
            }

        try:
            clean_response = response.strip()
            if "```json" in clean_response:
                clean_response = clean_response.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_response:
                clean_response = clean_response.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean_response)
            if isinstance(parsed, dict):
                parsed.setdefault("providerUsed", selected_provider)
            return parsed
        except Exception as e:
            if self.deterministic_fallback:
                fallback = self._deterministic_extract(processed_transcript, source_provider="deterministic-fallback")
                fallback["providerWarning"] = f"Failed to parse provider response: {str(e)}"
                fallback["raw_response"] = response
                return fallback
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }

    def _response_signals_provider_failure(self, response: Any) -> bool:
        if not isinstance(response, str):
            return False
        lowered = response.strip().lower()
        return lowered.startswith("ollama error:") or lowered.startswith("vertex ai error:") or lowered.startswith("error: unsupported provider")

    def _deterministic_extract(self, transcript: str, source_provider: str) -> Dict[str, Any]:
        text = transcript.strip()
        lowered = text.lower()
        pain_points = self._extract_pain_points(text)
        competitors = self._extract_competitors(text)
        innovation = self._extract_innovations(text)

        positive_hits = sum(1 for token in ["love", "great", "good", "cleaner", "cool", "saved me", "pretty good"] if token in lowered)
        negative_hits = sum(1 for token in ["frustrating", "slow", "hate", "bug", "unauthorized", "missing", "lack", "difficult", "hard"] if token in lowered)

        if negative_hits > positive_hits:
            sentiment = "Negative"
        elif positive_hits > negative_hits:
            sentiment = "Positive"
        elif positive_hits or negative_hits:
            sentiment = "Neutral / Mixed"
        else:
            sentiment = "Neutral"

        if "frustrat" in lowered:
            emotion = "Frustration"
        elif "confus" in lowered or "not sure" in lowered:
            emotion = "Confusion"
        elif positive_hits and negative_hits:
            emotion = "Mixed"
        elif positive_hits:
            emotion = "Satisfaction"
        else:
            emotion = "Neutral"

        if any(token in lowered for token in ["three hours", "high effort", "very slow", "hard", "difficult"]):
            effort = "High"
        elif any(token in lowered for token in ["two hours", "manual", "missing", "need", "trying"]):
            effort = "Medium"
        else:
            effort = "Low"

        summary_bits = []
        if pain_points:
            summary_bits.append(f"Pain points: {', '.join(pain_points[:2])}")
        if competitors:
            summary_bits.append(f"Competitors: {', '.join(competitors[:2])}")
        if innovation:
            summary_bits.append(f"Requested improvements: {', '.join(innovation[:2])}")
        if not summary_bits:
            summary_bits.append(text[:160].strip())

        return {
            "sentiment": sentiment,
            "pain_points": pain_points,
            "emotion": emotion,
            "effort": effort,
            "competitors": competitors,
            "innovation": innovation,
            "summary": "; ".join(summary_bits),
            "providerUsed": source_provider,
            "deterministic": True,
        }

    def _extract_pain_points(self, transcript: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        clues = ["slow", "frustr", "hate", "unauthorized", "bug", "missing", "lack", "need", "difficult", "hard", "error", "rough", "lost"]
        points = []
        for sentence in sentences:
            lowered = sentence.lower()
            if "<email_address>" in lowered or "<phone_number>" in lowered:
                continue
            if any(clue in lowered for clue in clues):
                cleaned = sentence.strip().strip('"')
                if cleaned and cleaned not in points:
                    points.append(cleaned)
        return points[:5]

    def _extract_competitors(self, transcript: str) -> List[str]:
        matches = re.findall(r'\b(?:Competitor[A-Z]\w*|Salesforce|Slack|Shopify|Excel)\b', transcript)
        seen = []
        for item in matches:
            if item not in seen:
                seen.append(item)
        return seen

    def _extract_innovations(self, transcript: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        triggers = ["need", "would love", "wish", "could", "should", "feature", "export", "integration", "connector", "api", "guided checklist", "clearer handoff"]
        ideas = []
        for sentence in sentences:
            lowered = sentence.lower()
            if "<email_address>" in lowered or "<phone_number>" in lowered:
                continue
            if any(trigger in lowered for trigger in triggers):
                cleaned = sentence.strip().strip('"')
                if cleaned and cleaned not in ideas:
                    ideas.append(cleaned)
        return ideas[:5]

if __name__ == "__main__":
    # Basic usage test
    extractor = AgilitasExtractor(use_cloud=False)
    sample_text = "I love the new UI but hate the lack of Slack integration."
    result = extractor.extract_dimensions(sample_text)
    print(json.dumps(result, indent=2))
