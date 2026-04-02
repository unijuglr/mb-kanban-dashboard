import json
import time
import os
import subprocess
from datetime import datetime

# Configuration
OLLAMA_BASE_URL = "http://127.0.0.1:11435" # Assumes running via laptop tunnel
MODELS = ["llama3.2:latest", "deepseek-coder-v2:16b", "qwen2.5-coder:14b", "deepseek-r1:32b"]
BENCHMARK_FILE = "docs/eval/model-performance-report.md"

BENCHMARK_TASKS = [
    {
        "id": "logic_1",
        "name": "Logical Reasoning (Sally's Brothers)",
        "prompt": "Sally has 3 brothers. Each of her brothers has 2 sisters. How many sisters does Sally have? Explain your reasoning.",
        "expected_answer": "1"
    },
    {
        "id": "code_1",
        "name": "Python Generation (Fibonacci)",
        "prompt": "Write a Python function to calculate the Nth Fibonacci number using recursion, and explain the time complexity.",
        "expected_answer": "O(2^n)"
    },
    {
        "id": "summarization_1",
        "name": "Summarization",
        "prompt": "Summarize the following text in one sentence: 'The quick brown fox jumps over the lazy dog. This sentence is a pangram because it uses every letter of the alphabet. It is often used for testing typewriters and computer keyboards.'",
        "expected_answer": "pangram"
    }
]

def run_query(model, prompt):
    # Use SSH to run the curl command on Motherbrain directly
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    # We use a file on the remote side to avoid escaping hell
    temp_file = f"/tmp/ollama_req_{int(time.time())}.json"
    ssh_setup = ["ssh", "darthg@motherbrain.local", f"cat > {temp_file}"]
    
    start_time = time.time()
    try:
        # Write payload to remote file
        subprocess.run(ssh_setup, input=json.dumps(payload), text=True, check=True)
        
        # Run curl using that file
        ssh_curl = [
            "ssh", "darthg@motherbrain.local",
            f"curl -s -X POST {url} -H 'Content-Type: application/json' -d @{temp_file} && rm {temp_file}"
        ]
        process = subprocess.run(ssh_curl, capture_output=True, text=True, timeout=300)
        end_time = time.time()
        
        if process.returncode != 0:
             return {"error": f"SSH/Curl failed: {process.stderr}"}
             
        data = json.loads(process.stdout)
        duration = end_time - start_time
        
        eval_count = data.get("eval_count", 0)
        eval_duration = data.get("eval_duration", 1) / 1e9 # convert nanoseconds to seconds
        
        tps = eval_count / eval_duration if eval_duration > 0 else 0
        
        return {
            "response": data.get("response", ""),
            "duration": duration,
            "tps": tps,
            "total_tokens": eval_count
        }
    except Exception as e:
        return {"error": str(e)}

def benchmark_models():
    results = {}
    
    for model in MODELS:
        print(f"Benchmarking model: {model}...")
        results[model] = []
        for task in BENCHMARK_TASKS:
            print(f"  Task: {task['name']}")
            res = run_query(model, task["prompt"])
            res["task_id"] = task["id"]
            res["task_name"] = task["name"]
            results[model].append(res)
            
    return results

def generate_report(results):
    report = f"# Model Bake-off Report\n"
    report += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    report += "## Performance Summary (Tokens/sec)\n\n"
    report += "| Model | Avg TPS | Max TPS | Min TPS |\n"
    report += "| :--- | :--- | :--- | :--- |\n"
    
    for model, tasks in results.items():
        tps_values = [t["tps"] for t in tasks if "tps" in t]
        if tps_values:
            avg_tps = sum(tps_values) / len(tps_values)
            max_tps = max(tps_values)
            min_tps = min(tps_values)
            report += f"| {model} | {avg_tps:.2f} | {max_tps:.2f} | {min_tps:.2f} |\n"
        else:
            report += f"| {model} | N/A | N/A | N/A |\n"
            
    report += "\n## Detailed Results\n"
    
    for model, tasks in results.items():
        report += f"\n### {model}\n"
        for t in tasks:
            report += f"#### {t['task_name']}\n"
            if "error" in t:
                report += f"**Error:** {t['error']}\n"
            else:
                report += f"- **TPS:** {t['tps']:.2f}\n"
                report += f"- **Duration:** {t['duration']:.2f}s\n"
                report += f"- **Response:** {t['response'][:200]}...\n"
    
    return report

if __name__ == "__main__":
    # Ensure docs/eval exists
    os.makedirs("docs/eval", exist_ok=True)
    
    print("Starting Model Bake-off...")
    results = benchmark_models()
    report = generate_report(results)
    
    with open(BENCHMARK_FILE, "w") as f:
        f.write(report)
    
    print(f"Report generated: {BENCHMARK_FILE}")
