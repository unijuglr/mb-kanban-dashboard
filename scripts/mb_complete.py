import json
import sys
import os
from datetime import datetime

def complete_task(task_id, artifacts=None, notes=None):
    path = "mb_tasks.json"
    with open(path, "r") as f:
        tasks = json.load(f)
    
    found = False
    for task in tasks:
        if task["id"] == task_id:
            task["state"] = "done"
            task["completed_at"] = datetime.utcnow().isoformat() + "Z"
            if artifacts:
                # Merge new artifacts into existing list, avoiding duplicates
                existing = task.get("artifacts", [])
                task["artifacts"] = list(set(existing + artifacts))
            if notes:
                task["notes"] = task.get("notes", []) + [notes]
            found = True
            break
            
    if found:
        with open(path, "w") as f:
            json.dump(tasks, f, indent=2)
        print(f"Task {task_id} marked as done.")
    else:
        print(f"Task {task_id} not found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 mb_complete.py <task_id> [artifact1,artifact2] [note]")
        sys.exit(1)
        
    tid = sys.argv[1]
    arts = sys.argv[2].split(",") if len(sys.argv) > 2 else []
    note = sys.argv[3] if len(sys.argv) > 3 else None
    complete_task(tid, arts, note)
