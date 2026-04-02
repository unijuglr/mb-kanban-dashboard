import json
import os

def run_test():
    workspace = "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
    analysis_report = os.path.join(workspace, "docs/oln/graph-analysis-v1.md")
    
    if os.path.exists(analysis_report):
        with open(analysis_report, 'r') as f:
            content = f.read()
            if "Star Wars Lore Network" in content and "Metrics" in content:
                print("✅ PASS: Graph analysis report found and valid.")
                return
    
    print("❌ FAIL: Graph analysis report missing or malformed.")

if __name__ == "__main__":
    run_test()
