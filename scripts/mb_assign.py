#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path('/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard')
TASKS = ROOT / 'mb_tasks.json'


def load_tasks():
    return json.loads(TASKS.read_text())


def save_tasks(tasks):
    TASKS.write_text(json.dumps(tasks, indent=2) + '\n')


def main():
    tasks = load_tasks()
    lookup = {t['id']: t for t in tasks}
    for t in tasks:
        if t['state'] != 'ready':
            continue
        if all(lookup[d]['state'] == 'done' for d in t.get('depends_on', [])):
            t['state'] = 'in_progress'
            save_tasks(tasks)
            print(json.dumps({'assigned': t['id'], 'owner': t['owner']}, indent=2))
            return
    print(json.dumps({'assigned': None}, indent=2))


if __name__ == '__main__':
    main()
