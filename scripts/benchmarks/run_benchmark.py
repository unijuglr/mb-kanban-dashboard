import json
import time
import requests
import os
import sys

# Motherbrain Ollama configuration
OLLAMA_HOST = "http://motherbrain.local:11434" # Motherbrain directly or via laptop tunnel 11435

def query_ollama(model, prompt):
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    start_time = time.time()
    try:
        response = requests.post(url, json=payload)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            total_time = end_time - start_time
            eval_count = data.get('eval_count', 0)
            eval_duration = data.get('eval_duration', 0) / 1e9 # convert nanoseconds to seconds
            
            tokens_per_sec = eval_count / eval_duration if eval_duration > 0 else 0
            
            return {
                "success": True,
                "response": data.get('response', ''),
                "total_time": total_time,
                "eval_count": eval_count,
                "tokens_per_sec": tokens_per_sec,
                "created_at": data.get('created_at', '')
            }
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_benchmark(models, prompts_file, output_file):
    with open(prompts_file, 'r') as f:
        prompts = json.load(f)
    
    results = []
    
    for model in models:
        print(f"Benchmarking model: {model}")
        for prompt_data in prompts:
            print(f"  - Prompt: {prompt_data['id']} ({prompt_data['category']})")
            result = query_ollama(model, prompt_data['prompt'])
            result['model'] = model
            result['prompt_id'] = prompt_data['id']
            result['category'] = prompt_data['category']
            results.append(result)
            
            # Print intermediate results
            if result['success']:
                print(f"    - Success: {result['tokens_per_sec']:.2f} t/s, {result['total_time']:.2f}s total")
            else:
                print(f"    - Error: {result.get('error', 'Unknown error')}")
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    # Selected models for bake-off
    models_to_test = [
        "llama3.2:latest",
        "deepseek-coder-v2:16b",
        "qwen2.5-coder:14b"
    ]
    
    prompts_path = "prompts.json"
    results_path = "../../docs/eval/benchmark-results.json"
    
    run_benchmark(models_to_test, prompts_path, results_path)
