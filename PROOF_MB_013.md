# PROOF_MB_013

Task: MB-013 — Board read model aggregator

## What shipped
- `src/board-read-model.mjs` — explicit board read-model aggregator
- `scripts/prove-mb-013.mjs` — proof script over real repo docs
- `src/index.ts` / `src/app-data.mjs` — export compatibility wired to the new aggregator surface

## Proof
Run:

```bash
node scripts/prove-mb-013.mjs
```

Expected behavior:
- reads cards from `docs/cards`
- reads decisions through the decision parser
- reads updates through the updates timeline reader
- emits one unified board/dashboard read model with counts and status-grouped columns
