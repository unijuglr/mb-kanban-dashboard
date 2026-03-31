#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path('/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard')
TASKS = ROOT / 'mb_tasks.json'


def load_tasks():
    return json.loads(TASKS.read_text())


def main():
    tasks = load_tasks()
    done = [t for t in tasks if t['state'] == 'done']
    in_progress = [t for t in tasks if t['state'] == 'in_progress']
    ready = [t for t in tasks if t['state'] == 'ready' and all(next(x for x in tasks if x['id'] == dep)['state'] == 'done' for dep in t.get('depends_on', []))]
    blocked = [t for t in tasks if t['state'] == 'ready' and t not in ready]
    report = {
        'done': [t['id'] for t in done],
        'in_progress': [t['id'] for t in in_progress],
        'ready_now': [t['id'] for t in ready],
        'blocked_waiting': [t['id'] for t in blocked],
        'next_recommended': ready[:3],
    }
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
