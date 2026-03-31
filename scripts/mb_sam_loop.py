#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path('/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard')
TASKS = ROOT / 'mb_tasks.json'
RUNTIME = ROOT / 'MB_SAM_RUNTIME.md'


def load_tasks():
    return json.loads(TASKS.read_text())


def ready_tasks(tasks):
    lookup = {t['id']: t for t in tasks}
    out = []
    for t in tasks:
        if t['state'] != 'ready':
            continue
        if all(lookup[d]['state'] == 'done' for d in t.get('depends_on', [])):
            out.append(t)
    return out


def main():
    tasks = load_tasks()
    ready = ready_tasks(tasks)
    result = {
        'manager': 'MB-Sam',
        'runtime_doc': str(RUNTIME),
        'ready_task_ids': [t['id'] for t in ready],
        'recommended_assignments': [
            {'task_id': t['id'], 'owner': t['owner']} for t in ready[:5]
        ],
        'handoff_ready': True if ready else False,
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
