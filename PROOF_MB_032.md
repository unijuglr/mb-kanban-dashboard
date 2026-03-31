# PROOF_MB_032

Task: MB-032 — Decisions screen

## What shipped
- `scripts/dev-server.mjs` — upgraded `/decisions` from a static list into an API-backed decisions screen
- `scripts/prove-mb-032.mjs` — boots the local server on an isolated port and validates decisions-screen behavior

## Decisions screen behavior
- summary strip for visible decisions / proposed decisions / unique owners / follow-up count
- live search across ID, title, context, decision, consequences, and owner
- filters for status and owner
- in-page master/detail layout with selectable decision records
- selected decision persisted in the URL query string for deep-linkable in-page state
- embedded JSON fallback so the page still renders if client fetch fails
- existing dedicated detail route remains available at `/decisions/:id`

## Proof
Run:

```bash
npm run proof:mb-032
```

Expected behavior:
- boots the local server on an isolated port
- fetches `/decisions`, `/api/decisions`, `/decisions/dec-001`, and `/api/decisions/dec-001`
- confirms filters, master/detail mounts, query-state handling, and API hydration in the decisions HTML
- confirms real repo-backed decision data is returned by the API
- prints a compact JSON proof payload
