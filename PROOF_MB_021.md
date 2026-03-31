# PROOF_MB_021

Task: MB-021 — Read-only board API

## What shipped
- `scripts/dev-server.mjs` — now serves read-only JSON endpoints for board, cards, decisions, and updates
- `scripts/prove-mb-021.mjs` — starts the local server on a test port and validates API responses against real repo-backed docs

## Endpoints
- `/api/summary`
- `/api/board`
- `/api/cards`
- `/api/cards/:id`
- `/api/decisions`
- `/api/decisions/:id`
- `/api/updates`
- `/health`

## Proof
Run:

```bash
node scripts/prove-mb-021.mjs
```

Expected behavior:
- boots the local server on an isolated port
- reads real files under `docs/cards`, `docs/decisions`, and `docs/updates`
- validates summary counts, six board columns, card detail lookup, decision detail lookup, and updates list
- prints a compact JSON proof payload
