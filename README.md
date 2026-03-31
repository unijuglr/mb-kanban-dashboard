# MB Kanban Dashboard

Standalone repo scaffold for the Motherbrain Kanban + Samiverse Dashboard.

## Purpose
A first-party local app for:
- MB Kanban board
- decision log
- updates timeline
- metrics/dashboard views

## Current status
MB-020 is now beyond scaffold:
- minimal app shell route structure
- local read-only board surface
- decision list/detail route
- updates timeline route
- JSON summary endpoint for quick inspection

## Routes
- `/` — overview shell
- `/board` — status-grouped card board
- `/cards/:id` — card detail view
- `/decisions` — decision list
- `/decisions/:id` — decision detail view
- `/updates` — updates timeline
- `/api/summary` — read-only JSON counts/status summary
- `/health` — health probe

## Local structure
- `docs/` — imported product docs/specs
- `src/` — parser/read-model code
- `public/` — static assets
- `scripts/` — utility scripts and local dev server

## Run
```bash
npm run dev
```

Then open:
- `http://127.0.0.1:4187/`
- `http://127.0.0.1:4187/board`

## Notes
- This build reads markdown directly from `docs/cards`, `docs/decisions`, and `docs/updates`.
- It is intentionally read-only for now.
- Safe write operations can layer on later without replacing the file-backed source of truth.
