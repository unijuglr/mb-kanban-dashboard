# PROOF_MB_011

Task: MB-011 — Markdown parser for decisions

## What shipped
- `src/decision-parser.mjs` — dependency-free parser for decision markdown files
- `src/index.ts` — export surface for decision parser functions
- `scripts/prove-mb-011.mjs` — proof script against seeded docs in `docs/decisions/`

## Proof
Run:

```bash
node scripts/prove-mb-011.mjs
```

Expected behavior:
- reads all `docs/decisions/*.md`
- parses decision id/title/status/date/owner
- parses `Context`, `Options Considered`, `Decision`, `Why`, `Consequences`, and checklist items under `Follow-Up Tasks`
- prints a compact JSON summary
