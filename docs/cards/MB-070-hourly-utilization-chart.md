# MB-070 — Implement Hourly Utilization Chart on Metrics Page

Status: Done
Priority: P1 high
Project: Motherbrain
Owner: Coder-1
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Visualize agent activity over time using the hourly metrics data to provide an "at-a-glance" view of Motherbrain utilization.

## Why It Matters
The user needs to see when coders are active and how many tasks are being processed in parallel to understand system utilization.

## Scope
- Add a CSS-based or SVG-based bar chart to the `/metrics` page.
- Hydrate the chart from the hourly buckets in `/api/metrics/timeline`.
- Display "Runs per Hour" on the Y-axis and "Time" on the X-axis.

## Steps
- [x] Update `/metrics` template in `scripts/dev-server.mjs` to include a chart container.
- [x] Implement client-side logic to map timeline JSON to chart elements.
- [x] Ensure the chart updates when filters are applied.
- [x] Verify rendering against the backfilled overnight metrics.

## Artifacts
- `scripts/dev-server.mjs`
- `src/metrics-api.mjs`
- `PROOF_MB_070.md`
