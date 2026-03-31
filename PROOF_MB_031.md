# PROOF_MB_031

Task: MB-031 — Card detail screen

## What shipped
- `scripts/dev-server.mjs` — upgraded `/cards/:id` from a static server-rendered page into an API-backed detail screen with richer layout and status-action controls on top of the existing board/API.
- `scripts/prove-mb-031.mjs` — boots the local server on an isolated port and validates the detail screen plus card-detail API shape.
- `README.md` — updated current status and proof/run notes for MB-031.

## Card detail behavior
- metadata summary strip for status, priority, owner, and last-updated
- two-column detail layout for narrative sections and operational panels
- embedded JSON fallback plus client-side hydration from `/api/cards/:id`
- status action panel wired to existing `POST /api/cards/:id/status` write path
- source-file and update-log panels so file truth stays visible

## Proof
Run:

```bash
npm run proof:mb-031
```

Expected behavior:
- boots the local server on an isolated port
- fetches `/cards/mb-018` and `/api/cards/mb-018`
- confirms the card detail HTML includes hydration payload, action panel, update log, and source-file panel
- confirms the card API exposes `allowedNextStatuses` for safe transition controls
- prints a compact JSON proof payload
