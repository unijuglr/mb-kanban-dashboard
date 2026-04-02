import sys
import json
import os
import requests
from typing import Dict, List, Any

# Add the project root and the services folder to sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'services'))

# Note: Using absolute imports from the project root.
# Some environments might prefer 'from services.agilitas_ai_core...'
# Others might need the '-' replaced with '_' if they are not compliant with PEP 8.
# Let's check the exact directory names again and use a try/except for robustness.

try:
    # Option A: Direct from services
    from agilitas_ai_core.extractor import AgilitasExtractor
    from agilitas_ai_core.llm_client import AgilitasLLMClient
    from agilitas_ai_core.redaction.presidio_redactor import get_redactor
except ImportError:
    # Option B: Trying hyphen to underscore mapping if the system is sensitive
    try:
        sys.path.append(os.path.join(project_root, 'services', 'agilitas-ai-core'))
        from extractor import AgilitasExtractor
        from llm_client import AgilitasLLMClient
        from redaction.presidio_redactor import get_redactor
    except ImportError as e:
        print(f"Import Error: {e}")
        sys.exit(1)

def run_qa_agilitas_pipeline():
    print("=== Agilitas Semantic Pipeline QA ===")
    
    # 1. Test Redaction
    print("\n[1/3] Testing PII Redaction...")
    redactor = get_redactor()
    raw_text = "My name is John Doe, my email is john.doe@example.com, and my phone is 555-0123. I live at 123 Maple Street."
    redacted = redactor.redact(raw_text)
    print(f"Original: {raw_text}")
    print(f"Redacted: {redacted}")
    
    # Simple check for redaction
    if "<" in redacted and ">" in redacted:
        print("✅ Redaction looks active (labels found).")
    else:
        print("⚠️ Redaction might be using fallback or is inactive.")

    # 2. Test LLM Client (Ollama focus)
    print("\n[2/3] Testing LLM Client (Ollama)...")
    client = AgilitasLLMClient()
    # Check if Ollama is reachable
    try:
        # Simple health check to the MB tunnel port
        health_check = requests.get("http://127.0.0.1:11435/api/tags", timeout=2)
        if health_check.status_code == 200:
            print("✅ Motherbrain Ollama tunnel (11435) is REACHABLE.")
            # Only attempt prompt if reachable
            response = client.call_ollama("Respond with the word 'READY' if you can hear me.", model="llama3")
            print(f"Ollama Response: {response.strip()}")
        else:
            print(f"❌ Motherbrain Ollama tunnel returned status {health_check.status_code}.")
    except Exception as e:
        print(f"❌ Motherbrain Ollama tunnel (11435) is UNREACHABLE: {e}")
        print("   (This is expected if the SSH tunnel is down or Motherbrain is offline.)")

    # 3. Test Extractor Integration
    print("\n[3/3] Testing Extractor Interface...")
    extractor = AgilitasExtractor(use_cloud=False)
    sample_transcript = "The customer was very frustrated with the slow load times. They mentioned that 'SpeedyCorp' is much faster. We should optimize the database."
    result = extractor.extract_dimensions(sample_transcript)
    
    print("Extraction Result (Mock/Stub Check):")
    print(json.dumps(result, indent=2))
    
    if result.get("sentiment") and result.get("pain_points"):
        print("✅ Extractor interface functional.")
    else:
        print("❌ Extractor returned empty or invalid data.")

    print("\n=== QA Run Complete ===")

if __name__ == "__main__":
    run_qa_agilitas_pipeline()
