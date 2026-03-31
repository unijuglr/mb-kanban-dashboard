# PROOF_MB_020

Task: MB-020 — Minimal app shell + local server

## What shipped
- `scripts/dev-server.mjs` — local Node server rendering overview, board, card detail, decisions, decision detail, and updates routes
- `scripts/start-mb-dev.sh` — durable launcher helper
- `scripts/check-mb-dev.sh` — local health check helper
- `scripts/prove-mb-020.mjs` — proof script that boots the server on an isolated port and verifies the shell routes render

## Proof
Run:

```bash
node scripts/prove-mb-020.mjs
```

Expected behavior:
- starts the local server on a test port
- renders `/`, `/board`, `/cards/mb-018`, `/decisions`, `/decisions/dec-001`, and `/updates`
- prints a compact JSON proof payload
