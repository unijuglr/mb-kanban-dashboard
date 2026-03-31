# PROOF_MB_030

Task: MB-030 — Board screen

## What shipped
- `scripts/dev-server.mjs` — upgraded `/board` from a static placeholder into an API-backed board screen
- `scripts/prove-mb-030.mjs` — boots the local server on an isolated port and validates board-screen behavior
- `README.md` — updated current status to reflect MB-030 delivery

## Board screen behavior
- summary strip for visible cards / in-progress / blocked / done
- live search across card ID, title, summary, owner, and priority
- filters for owner, priority, and status
- clear-filters action
- six status columns hydrated from `/api/board`
- embedded JSON fallback so the page still renders even if client fetch fails

## Proof
Run:

```bash
npm run proof:mb-030
```

Expected behavior:
- boots the local server on an isolated port
- fetches `/board` and `/api/board`
- confirms filter controls and API hydration are present in the board HTML
- confirms the board API still returns six columns with real repo-backed cards
- prints a compact JSON proof payload
