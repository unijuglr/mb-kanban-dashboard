# MB Metrics Baseline

Date: 2026-03-31
Task: MB-003

## Goal
Make MB repo work metrics-aware from day one.

## First-party metrics source
- workspace SQLite DB: `/Users/adamgoldband/.openclaw/workspace/data/metrics/metrics.db`

## Required fields per MB task run
- run_id
- task_id
- coder_id
- label
- model
- started_at
- ended_at
- duration_ms
- status
- artifact_paths
- proof_path

## Immediate policy
Every MB task must leave:
1. durable artifact(s)
2. proof note
3. metrics row or importable run record

## Near-term API goals
- `/metrics/summary`
- `/metrics/runs`
- `/metrics/timeseries`
- `/metrics/live`

## Repo expectation
Future MB implementation should read from first-party metrics storage and expose dashboard-ready summaries.
