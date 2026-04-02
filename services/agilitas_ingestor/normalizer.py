import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

# Relative import might be tricky depending on how this is run, 
# so we'll ensure we handle the structure.
import sys
import os
import importlib.util

current_dir = os.path.dirname(os.path.abspath(__file__))
# agilitas/schemas/models.py is in src/
models_path = os.path.abspath(os.path.join(current_dir, '../../src/agilitas/schemas/models.py'))

spec = importlib.util.spec_from_file_location("agilitas_models", models_path)
models_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_module)

TranscriptData = models_module.TranscriptData
TranscriptPart = models_module.TranscriptPart
TranscriptPartType = models_module.TranscriptPartType

class AgilitasNormalizer:
    """
    Normalizes different transcript formats (Zoom JSON, Teams VTT) 
    into the Agilitas TranscriptData schema.
    """

    def normalize_zoom_json(self, data: Dict[str, Any]) -> TranscriptData:
        """
        Converts Zoom JSON format to Agilitas TranscriptData.
        """
        parts: List[TranscriptPart] = []
        full_transcript = []
        customer_transcript = []
        
        agent_name = None
        customer_name = None
        
        # Simple heuristic: first speaker is agent, others are customers
        # In a real scenario, this would be more robust.
        participants = data.get("participants", [])
        if participants:
            agent_name = next((p["name"] for p in participants if p.get("role") == "Host"), participants[0]["name"])
            customer_name = next((p["name"] for p in participants if p.get("role") != "Host"), "Customer")

        for entry in data.get("transcript", []):
            speaker = entry.get("speaker")
            text = entry.get("text", "")
            
            p_type = TranscriptPartType.Agent if speaker == agent_name else TranscriptPartType.Customer
            parts.append({"type": p_type, "text": text})
            full_transcript.append(f"{speaker}: {text}")
            
            if p_type == TranscriptPartType.Customer:
                customer_transcript.append(text)

        return {
            "dateTime": data.get("start_time", datetime.now().isoformat()),
            "agent": agent_name,
            "customer": customer_name,
            "fullTranscript": "\n".join(full_transcript),
            "customerTranscript": "\n".join(customer_transcript),
            "parts": parts
        }

    def normalize_teams_vtt(self, vtt_content: str, date_time: str = None) -> TranscriptData:
        """
        Converts Teams VTT format to Agilitas TranscriptData.
        Assumes "Speaker: Text" format in VTT cues.
        """
        parts: List[TranscriptPart] = []
        full_transcript_lines = []
        customer_transcript_lines = []
        
        # Basic VTT parsing
        cues = re.split(r'\n\s*\n', vtt_content)
        
        agent_name = None
        customer_name = None
        
        for cue in cues:
            if "-->" not in cue:
                continue
                
            lines = cue.split('\n')
            # Look for the line after the timestamp
            for line in lines[1:]:
                if ':' in line:
                    speaker, text = line.split(':', 1)
                    speaker = speaker.strip()
                    text = text.strip()
                    
                    if not agent_name:
                        agent_name = speaker
                    elif not customer_name and speaker != agent_name:
                        customer_name = speaker
                        
                    p_type = TranscriptPartType.Agent if speaker == agent_name else TranscriptPartType.Customer
                    parts.append({"type": p_type, "text": text})
                    full_transcript_lines.append(f"{speaker}: {text}")
                    
                    if p_type == TranscriptPartType.Customer:
                        customer_transcript_lines.append(text)

        return {
            "dateTime": date_time or datetime.now().isoformat(),
            "agent": agent_name,
            "customer": customer_name,
            "fullTranscript": "\n".join(full_transcript_lines),
            "customerTranscript": "\n".join(customer_transcript_lines),
            "parts": parts
        }

if __name__ == "__main__":
    # Quick sanity check code if needed
    pass
