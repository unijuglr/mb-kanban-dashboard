# MB Kanban Dashboard

Standalone repo scaffold for the Motherbrain Kanban + Samiverse Dashboard.

## Purpose
A first-party local app for:
- MB Kanban board
- decision log
- updates timeline
- metrics/dashboard views

## Current status
MB-030 through MB-033 are now live on top of the existing shell/API:
- minimal app shell route structure
- API-backed board screen with summary strip, live search, and owner/priority/status filters
- API-backed card detail screen with metadata summary, source-file visibility, and status-action controls
- API-backed decision list/detail route with in-page inspection
- API-backed updates timeline route with search, author/section filters, and detail inspection
- read-only JSON API for board, cards, decisions, and updates

MB-042 upgrades `/` into a real dashboard overview on top of the metrics API:
- top KPI strip combining board + run metrics
- board snapshot by status
- run status mix
- owner throughput summary
- recent runs panel
- daily metrics timeline panel

MB-043 adds a dedicated metrics timeline/comparison screen:
- `/metrics` route in the app shell
- owner comparison view for run volume, success rate, duration, and artifacts
- timeline window control with bucket-over-bucket deltas
- API hydration from `/api/metrics/summary`, `/api/metrics/timeline`, and `/api/metrics/comparison`

MB-050 adds the first safe write path:
- `POST /api/cards/:id/status`
- guarded status transitions only
- `expectedCurrentStatus` required to prevent stale writes
- card markdown remains the source of truth

MB-052 adds repo-backed card creation:
- `POST /api/cards`
- board-side create-card form in `/board`
- creates a new markdown card from a fixed template
- duplicate card IDs are rejected before write

MB-053 adds repo-backed decision creation:
- `POST /api/decisions`
- decisions-side create-decision form in `/decisions`
- creates a new markdown decision record from a fixed template
- duplicate decision IDs are rejected before write

## Routes
- `/` — overview shell
- `/board` — status-grouped card board
- `/metrics` — metrics timeline + comparison screen
- `/cards/:id` — card detail view
- `/decisions` — decision list
- `/decisions/:id` — decision detail view
- `/updates` — updates timeline
- `/api/summary` — read-only JSON counts/status summary
- `/api/board` — status-grouped board JSON
- `/api/cards` — all cards JSON
- `POST /api/cards` — create a new card from template
- `/api/cards/:id` — card detail JSON
- `POST /api/cards/:id/status` — guarded status transition write path
- `/api/decisions` — all decisions JSON
- `POST /api/decisions` — create a new decision from template
- `/api/decisions/:id` — decision detail JSON
- `/api/updates` — updates timeline JSON
- `/api/updates/:id` — update detail JSON
- `/api/metrics/summary` — aggregate metrics snapshot from first-party SQLite metrics storage
- `/api/metrics/runs` — recent MB task/run records with metadata
- `/api/metrics/comparison` — owner comparison rows for leaderboard/side-by-side review
- `/api/metrics/timeline` — daily timeline buckets for dashboard charts
- `/health` — health probe

## Local structure
- `docs/` — imported product docs/specs
- `src/` — parser/read-model code
- `public/` — static assets
- `scripts/` — utility scripts and local dev server
- `artifacts/local-coder-runs/` — bounded proof-run artifacts for MB-024 / MB-025 local-coder validation

## Run
```bash
npm run dev
```

## Local coder proof harness

Run the reusable local-coder artifact harness:

```bash
node scripts/local_coder_proof_run.mjs \
  --run-id my-proof-run \
  --request "Write a tiny file and validate it" \
  --command "echo ok > artifacts/local-coder-runs/my-proof-run/workspace/output.txt" \
  --validation-command "grep -q ok artifacts/local-coder-runs/my-proof-run/workspace/output.txt"
```

Or run the built-in self-proof that exercises success, failure, and diagnostic-only cases:

```bash
npm run proof:mb-025
```

Each run writes a bounded artifact set under `artifacts/local-coder-runs/<run-id>/`:
- `request.txt`
- `command.txt`
- `agent.log`
- `manifest.json`
- `validation.txt`
- `result.md`
- `workspace/`

Then open:
- `http://127.0.0.1:4187/`
- `http://127.0.0.1:4187/board`

Or inspect the API directly:
- `http://127.0.0.1:4187/api/board`
- `http://127.0.0.1:4187/api/cards`
- `http://127.0.0.1:4187/api/cards/mb-018`
- `http://127.0.0.1:4187/api/decisions`
- `http://127.0.0.1:4187/api/updates`

Example status transition request:

```bash
curl -X POST http://127.0.0.1:4187/api/cards/mb-001/status \
  -H 'Content-Type: application/json' \
  -d '{"expectedCurrentStatus":"Ready","status":"In Progress"}'
```

Example create-card request:

```bash
curl -X POST http://127.0.0.1:4187/api/cards \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"MB-052",
    "title":"Create new card from template",
    "owner":"Coder-5",
    "objective":"Create a repo-backed markdown card from the local app shell."
  }'
```

Example create-decision request:

```bash
curl -X POST http://127.0.0.1:4187/api/decisions \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"DEC-004",
    "title":"Create new decision from template",
    "owner":"Coder-5",
    "context":"The app needs a safe decision-creation path.",
    "decision":"Create decisions through a fixed template-backed write path."
  }'
```

## Notes
- This build reads markdown directly from `docs/cards`, `docs/decisions`, and `docs/updates`.
- Safe writes are intentionally narrow: MB-050 covers status transitions, MB-052 covers creating new cards from a fixed template, and MB-053 covers creating new decisions from a fixed template.
- Arbitrary markdown editing is still out of scope; the file-backed source of truth remains intact.
