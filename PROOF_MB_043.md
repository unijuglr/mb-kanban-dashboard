# PROOF_MB_043

## Task
Build the metrics timeline/comparison screen on top of the existing metrics API work.

## What landed
- Added a dedicated `/metrics` route to the local app shell.
- Added a durable comparison endpoint: `/api/metrics/comparison`.
- Extended `src/metrics-api.mjs` to return owner comparison rows with:
  - runs
  - successful runs
  - average / total duration
  - total / average artifacts
  - first/last activity timestamps
- Built the metrics screen with:
  - summary strip
  - owner filter
  - comparison sort control
  - timeline window selector
  - owner comparison cards
  - timeline cards with bucket-over-bucket deltas
- Kept the screen API-backed by hydrating from:
  - `/api/metrics/summary`
  - `/api/metrics/timeline`
  - `/api/metrics/comparison`

## Proof command
```bash
npm run proof:mb-043
```

## Expected proof
The script starts the local server, fetches `/metrics`, `/api/metrics/comparison`, `/api/metrics/timeline`, and `/health`, then verifies:
- the metrics screen renders the timeline/comparison UI
- the screen contains real filter/sort controls and embedded hydration payload
- the comparison API returns owner rows
- the timeline API returns daily buckets
- `/health` advertises both `/metrics` and `/api/metrics/comparison`
