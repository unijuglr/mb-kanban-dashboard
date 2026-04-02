import json
import os
import sys
import importlib.util

# Load the AgilitasLLMClient module from the file path directly to handle the hyphenated directory
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/agilitas-ai-core/llm_client.py'))
spec = importlib.util.spec_from_file_location("llm_client", module_path)
llm_client_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(llm_client_module)
AgilitasLLMClient = llm_client_module.AgilitasLLMClient

def generate_synthetic_transcript(vertical, client):
    """
    Generates a synthetic customer support transcript for a given vertical.
    """
    prompt = f"""
    Generate a realistic, anonymized customer support transcript for the {vertical} vertical.
    The transcript should include:
    - 2 participants (Customer and Agent)
    - A clear technical or service issue
    - Resolution or next steps
    - Some emotional cues (frustration, then relief)
    
    Format the output as a clean text transcript.
    """
    
    print(f"Generating transcript for {vertical}...")
    # Use local Ollama for cost discipline.
    # Default path is Motherbrain-local 127.0.0.1:11434; laptop-tunnel runs can set OLLAMA_HOST=127.0.0.1:11435.
    transcript = client.complete(prompt, provider="ollama", model="llama3")
    return transcript

def main():
    client = AgilitasLLMClient()
    verticals = ["Retail", "SaaS", "Industrial"]
    
    # Ensure data/demo exists
    os.makedirs("projects/mb-kanban-dashboard/data/demo", exist_ok=True)
    
    for vertical in verticals:
        transcript = generate_synthetic_transcript(vertical, client)
        
        filename = f"projects/mb-kanban-dashboard/data/demo/transcript_{vertical.lower()}.txt"
        with open(filename, "w") as f:
            f.write(transcript)
        
        print(f"Saved to {filename}")

if __name__ == "__main__":
    main()
