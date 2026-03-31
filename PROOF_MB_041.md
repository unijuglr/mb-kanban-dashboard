# MB-041 Proof

Date: 2026-03-31
Task: MB-041 Metrics API endpoints

## Created
- `src/metrics-api.mjs`
- `scripts/prove-mb-041.mjs`
- `PROOF_MB_041.md`

## What it does
- reads first-party metrics from `/Users/adamgoldband/.openclaw/workspace/data/metrics/metrics.db`
- scopes queries to project_id `mb-kanban-dashboard`
- exposes durable JSON endpoints from the local dev server:
  - `/api/metrics/summary`
  - `/api/metrics/runs?limit=N`
  - `/api/metrics/timeline`
- returns aggregated status/owner summaries plus recent run and daily timeline views
- leaves markdown/card source-of-truth behavior unchanged

## Run
```bash
cd /Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard
node scripts/prove-mb-041.mjs
```

## Expected proof points
- `/health` advertises the three metrics routes
- `/api/metrics/summary` returns project-level totals from the SQLite metrics DB
- `/api/metrics/runs` returns recent MB run rows with parsed metadata
- `/api/metrics/timeline` returns day buckets suitable for the next dashboard screens
