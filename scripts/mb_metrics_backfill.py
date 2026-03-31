#!/usr/bin/env python3
import json
import os
import sqlite3
import subprocess
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TASKS_PATH = REPO_ROOT / 'mb_tasks.json'
REPORT_PATH = REPO_ROOT / 'data' / 'mb_metrics_backfill_report.json'
WORKSPACE = Path('/Users/adamgoldband/.openclaw/workspace')
DB_PATH = WORKSPACE / 'data' / 'metrics' / 'metrics.db'
SCHEMA_PATH = WORKSPACE / 'data_metrics_schema.sql'
PROJECT_ID = 'mb-kanban-dashboard'
HOST = 'Adams-MacBook-Pro.local'
SOURCE_SURFACE = 'mb-task-backfill'


def sh(*args):
    return subprocess.run(args, cwd=REPO_ROOT, text=True, capture_output=True)


def ensure_db(conn):
    if SCHEMA_PATH.exists():
        conn.executescript(SCHEMA_PATH.read_text())


def parse_iso(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def to_utc_iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def file_mtime_iso(path):
    if not path.exists():
        return None
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()


def git_log_for_paths(paths):
    rows = []
    seen = set()
    for path in paths:
        if not path.exists():
            continue
        rel = str(path.relative_to(REPO_ROOT))
        proc = sh('git', 'log', '--follow', '--format=%H|%cI|%s', '--', rel)
        if proc.returncode != 0 or not proc.stdout.strip():
            continue
        for line in proc.stdout.splitlines():
            parts = line.split('|', 2)
            if len(parts) != 3:
                continue
            key = (parts[0], parts[1], parts[2])
            if key in seen:
                continue
            seen.add(key)
            rows.append({'commit': parts[0], 'committed_at': parts[1], 'subject': parts[2]})
    rows.sort(key=lambda row: row['committed_at'], reverse=True)
    return rows


def infer_task_times(task_id, artifacts, proof_path):
    relevant = [path for path in artifacts if path.exists()]
    if proof_path and proof_path.exists() and proof_path not in relevant:
        relevant.append(proof_path)
    logs = git_log_for_paths(relevant)
    timestamps = [parse_iso(row['committed_at']) for row in logs if row.get('committed_at')]
    timestamps = [ts for ts in timestamps if ts is not None]
    if timestamps:
        started = min(timestamps)
        ended = max(timestamps)
    else:
        file_times = [parse_iso(file_mtime_iso(path)) for path in relevant]
        file_times = [ts for ts in file_times if ts is not None]
        if file_times:
            started = min(file_times)
            ended = max(file_times)
        else:
            now = datetime.now(timezone.utc)
            started = now
            ended = now
    duration_ms = max(0, int((ended - started).total_seconds() * 1000))
    return {
        'started_at': to_utc_iso(started),
        'ended_at': to_utc_iso(ended),
        'duration_ms': duration_ms,
        'git_history': logs,
    }


def build_run(task):
    task_id = task['id']
    artifacts = [REPO_ROOT / rel for rel in task.get('artifacts', [])]
    proof_path = next((path for path in artifacts if path.name.startswith('PROOF_')), None)
    fallback_proof = REPO_ROOT / f'PROOF_{task_id}.md'
    if proof_path is None and fallback_proof.exists():
        proof_path = fallback_proof
        if fallback_proof not in artifacts:
            artifacts.append(fallback_proof)

    timing = infer_task_times(task_id, artifacts, proof_path)
    owner = task.get('owner') or 'unknown'
    status = 'done' if task.get('state') == 'done' else task.get('state')
    existing_artifacts = [path for path in artifacts if path.exists()]
    latest_commit = timing['git_history'][0] if timing['git_history'] else None
    run_id = f'mb-task:{task_id}'
    metadata = {
        'source': 'mb_metrics_backfill.py',
        'task_title': task.get('title'),
        'owner': owner,
        'depends_on': task.get('depends_on', []),
        'artifacts': [str(path.relative_to(REPO_ROOT)) for path in existing_artifacts],
        'proof_path': str(proof_path.relative_to(REPO_ROOT)) if proof_path and proof_path.exists() else None,
        'latest_commit': latest_commit,
        'git_history_count': len(timing['git_history']),
    }
    return {
        'run_id': run_id,
        'session_id': task_id,
        'label': f'MB task {task_id}',
        'role': 'coder',
        'task_id': task_id,
        'project_id': PROJECT_ID,
        'model': 'repo-backfill',
        'source_surface': SOURCE_SURFACE,
        'host': HOST,
        'status': status,
        'started_at': timing['started_at'],
        'ended_at': timing['ended_at'],
        'duration_ms': timing['duration_ms'],
        'artifacts_count': len(existing_artifacts),
        'metadata_json': json.dumps(metadata, indent=2),
        'report_row': {
            'task_id': task_id,
            'title': task.get('title'),
            'owner': owner,
            'status': status,
            'started_at': timing['started_at'],
            'ended_at': timing['ended_at'],
            'duration_ms': timing['duration_ms'],
            'artifacts': metadata['artifacts'],
            'proof_path': metadata['proof_path'],
            'latest_commit': latest_commit,
        }
    }


def upsert_run(conn, run):
    conn.execute(
        '''
        INSERT OR REPLACE INTO agent_runs (
          run_id, parent_run_id, session_id, label, role, task_id, project_id, model,
          source_surface, host, status, started_at, ended_at, duration_ms,
          estimated_cost_usd, token_input, token_output, token_total,
          assistant_messages, user_messages, artifacts_count, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            run['run_id'], None, run['session_id'], run['label'], run['role'], run['task_id'], run['project_id'], run['model'],
            run['source_surface'], run['host'], run['status'], run['started_at'], run['ended_at'], run['duration_ms'],
            None, 0, 0, 0, 0, 0, run['artifacts_count'], run['metadata_json']
        )
    )


def main():
    tasks = json.loads(TASKS_PATH.read_text())
    done_tasks = [task for task in tasks if task.get('state') == 'done']

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    ensure_db(conn)
    conn.execute('DELETE FROM agent_runs WHERE project_id = ? AND source_surface = ?', (PROJECT_ID, SOURCE_SURFACE))

    imported = []
    skipped = []
    for task in done_tasks:
        artifact_paths = [REPO_ROOT / rel for rel in task.get('artifacts', [])]
        proof_path = REPO_ROOT / f"PROOF_{task['id']}.md"
        has_artifacts = any(path.exists() for path in artifact_paths)
        has_proof = proof_path.exists()
        if not has_artifacts and not has_proof:
            skipped.append({
                'task_id': task['id'],
                'title': task.get('title'),
                'reason': 'no existing artifacts or proof file to import'
            })
            continue
        run = build_run(task)
        upsert_run(conn, run)
        imported.append(run['report_row'])

    conn.commit()
    conn.close()

    report = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'project_id': PROJECT_ID,
        'db_path': str(DB_PATH),
        'imported_runs': len(imported),
        'skipped_runs': len(skipped),
        'tasks': imported,
        'skipped': skipped,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
