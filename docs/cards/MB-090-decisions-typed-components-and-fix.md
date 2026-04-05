# MB-090 — Decisions UI: Typed components and FormData submission fix

Status: Done
Priority: P0 critical
Project: Motherbrain
Owner: Coder-1
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Fix the Decisions UI/runtime issue and refactor the actionable response UI to render correctly for binary vs. multiple-choice vs. nuanced decisions, with notes always available.

## Why It Matters
The current JS/runtime drift around decision responses breaks the operator loop. Typed controls reduce ambiguity and prevent the UI from offering the wrong response mechanism for a given decision.

## Scope
- unify the live decision response runtime onto the file-backed response path in `docs/decisions/responses/*.json`
- fix the server-side response handlers so the route/API path actually persists responses
- implement decision classification for `binary`, `multiple-choice`, and `nuanced`
- render typed controls on both `/decisions` and `/decisions/:id`
- keep notes available regardless of decision type

## Steps
- [x] Fix server/runtime response handler drift in `scripts/dev-server.mjs`.
- [x] Add `DecisionType` logic in `src/decision-models.mjs`.
- [x] Render conditional controls for binary vs. multiple-choice vs. nuanced decisions.
- [x] Verify DEC-001 can be responded to through the intended direct route.

## Artifacts
- `scripts/dev-server.mjs`
- `src/decision-models.mjs`
- `scripts/prove-mb-090.mjs`
- `PROOF_MB_090.md`

## Update Log
- 2026-04-02: Implemented typed decision classification and removed the stale mixed response-store runtime from the live server path.
- 2026-04-02: Verified DEC-001 through `POST /api/decisions/dec-001/respond` using a fixture-backed proof run; response persisted and re-rendered after refresh.
