import json
import sys
from datetime import datetime

def add_task(task_id, title, owner="Prime Sam", depends_on=None):
    path = "mb_tasks.json"
    with open(path, "r") as f:
        tasks = json.load(f)
        
    new_task = {
        "id": task_id,
        "title": title,
        "state": "todo",
        "owner": owner,
        "depends_on": depends_on or [],
        "artifacts": []
    }
    
    tasks.append(new_task)
    with open(path, "w") as f:
        json.dump(tasks, f, indent=2)
    print(f"Task {task_id} added.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 mb_add_task.py <task_id> <title> [owner] [dep1,dep2]")
        sys.exit(1)
        
    tid = sys.argv[1]
    title = sys.argv[2]
    owner = sys.argv[3] if len(sys.argv) > 3 else "Prime Sam"
    deps = sys.argv[4].split(",") if len(sys.argv) > 4 else []
    add_task(tid, title, owner, deps)
