#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path('/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard')
TASKS = ROOT / 'mb_tasks.json'


def load_tasks():
    return json.loads(TASKS.read_text())


def save_tasks(tasks):
    TASKS.write_text(json.dumps(tasks, indent=2) + '\n')


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: mb_complete.py TASK_ID')
    task_id = sys.argv[1]
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t['state'] = 'done'
            save_tasks(tasks)
            print(json.dumps({'completed': task_id}, indent=2))
            return
    raise SystemExit(f'unknown task: {task_id}')


if __name__ == '__main__':
    main()
