import sys
import os
import importlib.util

# Get project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def load_client_manually():
    client_path = os.path.join(project_root, "services", "agilitas-ai-core", "llm_client.py")
    spec = importlib.util.spec_from_file_location("llm_client", client_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.AgilitasLLMClient

def test_ollama_path():
    """
    Test the Ollama connection through the MB tunnel.
    """
    try:
        AgilitasLLMClient = load_client_manually()
        client = AgilitasLLMClient()
    except Exception as e:
        print(f"FAILED: Could not load client module: {str(e)}")
        return False
        
    prompt = "Say 'Hello' back to me in exactly one word."
    
    print(f"Testing Ollama connection on {client.ollama_endpoint}...")
    
    try:
        # Note: We expect this to fail if the tunnel is down, which is a valid test condition.
        response = client.complete(prompt, provider="ollama")
        print(f"Response from Ollama: {response}")
        
        if "Ollama Error" in response:
            print("FAILED (Expected if tunnel is down): Ollama request failed.")
            return True
        else:
            print("SUCCESS: Ollama request completed successfully.")
            return True
            
    except Exception as e:
        print(f"FAILED: Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    if test_ollama_path():
        sys.exit(0)
    else:
        sys.exit(1)
