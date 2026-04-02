# PROOF_MB_084 — operator dashboard: active work / next-up operations screen

## What changed
Reworked the home route (`/`) from a generic overview into an operator-facing dashboard that answers four practical questions:

1. What is being worked on right now
2. By which coder/agent
3. Rough ETA / time to next meaningful update
4. What is queued next for each agent

## Files changed
- `scripts/dev-server.mjs`
- `docs/cards/MB-084-dashboard-active-work-next-up-operations-screen.md`
- `mb_tasks.json`

## Implementation summary
### 1. Added an operations snapshot builder
The dashboard now derives a local ops snapshot from two existing first-party sources:
- repo-backed card metadata from `docs/cards`
- local SQLite run history from `data/metrics/metrics.db`

### 2. Honest active-work logic
The `/` screen now prefers explicit board truth:
- cards in `In Progress` or `Review` are shown as active first
- freshness is computed from their most recent timestamp
- ETA is only shown when a card actually contains one

If there are **no** cards marked active, the screen does **not** fake realtime. It falls back to:
- most recent completed local runs from the metrics DB
- clearly labels that mode as inferred
- marks confidence as low
- explains that the view is useful but not live

### 3. Freshness and confidence cues
Each active item now carries:
- freshness label (`Fresh`, `Aging`, `Stale today`, `Stale`, or `Freshness unknown`)
- source label (`Board card metadata` vs `SQLite metrics run log`)
- confidence label (`Medium` or `Low` based on actual data quality)
- an explicit "next meaningful update" field instead of made-up deadlines

### 4. Next-up queue by agent
The home screen now groups `Ready` cards by agent and shows up to three queued-next items per agent.

Important honesty rule:
- only explicitly assigned/owned cards are shown under that agent
- otherwise the work is surfaced as `Unassigned` instead of silently inventing ownership

## Smoke test
### Syntax / basic check
Command:
```bash
node --check scripts/dev-server.mjs && npm run check
```

Observed output:
```text
ok
```

### Route verification
Command:
```bash
PORT=4191 node scripts/dev-server.mjs > /tmp/mb084-server.log 2>&1 &
sleep 2
curl -s http://127.0.0.1:4191/ > /tmp/mb084-home.html
curl -s http://127.0.0.1:4191/api/metrics/runs?limit=5 > /tmp/mb084-runs.json
```

Observed markers in `/tmp/mb084-home.html`:
```text
<h1>Operator dashboard</h1>
<h2>What is active right now</h2>
Mode: inferred from local run log
<h2>Queued next by agent</h2>
```

Observed sample from `/api/metrics/runs?limit=5`:
```text
MB-055 Prime Sam 2026-04-02T14:37:41.263314Z
MB-054 Prime Sam 2026-04-02T14:37:41.263037Z
MB-049 Prime Sam 2026-04-02T14:37:41.262459Z
```

## What this proves
- `/` is now an operator-focused status board, not just a general summary page
- the screen answers active work, agent ownership, next meaningful update window, and queued-next per agent
- the data comes from local repo and local metrics sources only
- when the board lacks explicit in-progress state, the UI says so and degrades honestly instead of pretending to be live

## Honest status
Done.

The screen is only as real-time as the local card updates and metrics log allow. That is a feature, not a bug. It avoids fake certainty.