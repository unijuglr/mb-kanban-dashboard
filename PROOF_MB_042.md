# PROOF_MB_042

## Task
Build the dashboard overview screen on top of the metrics API work.

## What landed
- Replaced the placeholder `/` overview with a metrics-backed dashboard overview.
- Combined repo board state with first-party SQLite metrics data from `src/metrics-api.mjs`.
- Added overview sections for:
  - top KPI strip
  - board snapshot
  - run status mix
  - owner throughput
  - recent runs
  - timeline buckets
- Added fallback handling so the overview still renders if metrics loading fails.
- Added proof script: `scripts/prove-mb-042.mjs`.

## Proof command
```bash
npm run proof:mb-042
```

## Expected proof
The script starts the local server, fetches `/`, `/api/metrics/summary`, and `/api/board`, then verifies the overview HTML contains the metrics-backed dashboard sections and live run totals.
