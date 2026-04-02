# PROOF_MB_070 — Hourly Utilization Chart

## Goal
Implement a visual hourly utilization chart on the `/metrics` page to visualize agent activity over time, including overnight bursts.

## Changes

### 1. `scripts/dev-server.mjs`
- Updated `renderMetricsScreen` to include a new "Hourly Utilization" section.
- Added a CSS-based bar chart that renders hourly runs.
- Implemented `renderHourly` client-side logic to map timeline data to the chart.
- Reverses the timeline data (from DESC to ASC) for logical left-to-right time progression.
- Adds tooltips and X-axis labels for readability.

### 2. `docs/cards/MB-070-hourly-utilization-chart.md`
- Marked as completed.

## Verification
- Validated `scripts/dev-server.mjs` with `node --check`.
- The chart hydrates from `/api/metrics/timeline` which already provides hourly buckets (`substr(started_at, 1, 13)`).
- The chart uses a flexible flexbox layout to adjust to the number of available buckets (default 50).

## Artifacts
- `scripts/dev-server.mjs`
- `PROOF_MB_070.md`
