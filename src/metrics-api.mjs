import { spawnSync } from 'node:child_process';
import path from 'node:path';

const DEFAULT_DB_PATH = '/Users/adamgoldband/.openclaw/workspace/data/metrics/metrics.db';
const DEFAULT_PROJECT_ID = 'mb-kanban-dashboard';

function runPythonQuery({ dbPath = DEFAULT_DB_PATH, projectId = DEFAULT_PROJECT_ID, limit = 50 }) {
  const script = String.raw`
import json
import sqlite3
import sys

DB_PATH = sys.argv[1]
PROJECT_ID = sys.argv[2]
LIMIT = int(sys.argv[3])

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

summary_row = conn.execute(
    """
    SELECT
      COUNT(*) AS total_runs,
      SUM(CASE WHEN status IN ('done','verified','completed') THEN 1 ELSE 0 END) AS successful_runs,
      SUM(CASE WHEN status NOT IN ('done','verified','completed') THEN 1 ELSE 0 END) AS non_successful_runs,
      COALESCE(AVG(duration_ms), 0) AS avg_duration_ms,
      COALESCE(SUM(duration_ms), 0) AS total_duration_ms,
      COALESCE(SUM(artifacts_count), 0) AS total_artifacts,
      MIN(started_at) AS first_started_at,
      MAX(COALESCE(ended_at, started_at)) AS last_activity_at
    FROM agent_runs
    WHERE project_id = ?
    """,
    (PROJECT_ID,)
).fetchone()

status_rows = conn.execute(
    """
    SELECT status, COUNT(*) AS runs
    FROM agent_runs
    WHERE project_id = ?
    GROUP BY status
    ORDER BY runs DESC, status ASC
    """,
    (PROJECT_ID,)
).fetchall()

owner_rows = conn.execute(
    """
    SELECT
      COALESCE(json_extract(metadata_json, '$.owner'), '(unknown)') AS owner,
      COUNT(*) AS runs,
      COALESCE(AVG(duration_ms), 0) AS avg_duration_ms,
      COALESCE(SUM(artifacts_count), 0) AS artifacts_count
    FROM agent_runs
    WHERE project_id = ?
    GROUP BY COALESCE(json_extract(metadata_json, '$.owner'), '(unknown)')
    ORDER BY runs DESC, owner ASC
    """,
    (PROJECT_ID,)
).fetchall()

recent_rows = conn.execute(
    """
    SELECT
      run_id, session_id, label, role, task_id, project_id, model,
      source_surface, host, status, started_at, ended_at, duration_ms,
      estimated_cost_usd, token_input, token_output, token_total,
      assistant_messages, user_messages, artifacts_count, metadata_json
    FROM agent_runs
    WHERE project_id = ?
    ORDER BY datetime(COALESCE(ended_at, started_at)) DESC, run_id DESC
    LIMIT ?
    """,
    (PROJECT_ID, LIMIT)
).fetchall()

timeline_rows = conn.execute(
    """
    SELECT
      substr(started_at, 1, 10) AS day,
      COUNT(*) AS runs,
      SUM(CASE WHEN status IN ('done','verified','completed') THEN 1 ELSE 0 END) AS successful_runs,
      COALESCE(AVG(duration_ms), 0) AS avg_duration_ms,
      COALESCE(SUM(estimated_cost_usd), 0) AS total_cost_usd,
      COALESCE(SUM(token_total), 0) AS total_tokens
    FROM agent_runs
    WHERE project_id = ?
    GROUP BY substr(started_at, 1, 10)
    ORDER BY day DESC
    LIMIT ?
    """,
    (PROJECT_ID, LIMIT)
).fetchall()

payload = {
    'db_path': DB_PATH,
    'project_id': PROJECT_ID,
    'summary': dict(summary_row) if summary_row else {},
    'by_status': [dict(row) for row in status_rows],
    'by_owner': [dict(row) for row in owner_rows],
    'recent_runs': [dict(row) for row in recent_rows],
    'timeline': [dict(row) for row in timeline_rows],
}

print(json.dumps(payload))
conn.close()
`;

  const result = spawnSync('python3', ['-c', script, dbPath, projectId, String(limit)], {
    encoding: 'utf8',
    cwd: path.resolve('.')
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'metrics query failed').trim());
  }

  return JSON.parse(result.stdout);
}

function normalizeRun(row) {
  let metadata = null;
  try {
    metadata = row.metadata_json ? JSON.parse(row.metadata_json) : null;
  } catch {
    metadata = null;
  }

  return {
    ...row,
    metadata,
  };
}

export function loadMetricsSnapshot({ dbPath = DEFAULT_DB_PATH, projectId = DEFAULT_PROJECT_ID, limit = 50 } = {}) {
  const payload = runPythonQuery({ dbPath, projectId, limit });
  return {
    dbPath: payload.db_path,
    projectId: payload.project_id,
    summary: payload.summary,
    byStatus: payload.by_status,
    byOwner: payload.by_owner,
    recentRuns: payload.recent_runs.map(normalizeRun),
    timeline: payload.timeline,
  };
}
