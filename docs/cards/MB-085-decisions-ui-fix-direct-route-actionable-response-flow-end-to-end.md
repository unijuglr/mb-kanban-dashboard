# MB-085 — Decisions UI: fix direct-route actionable response flow end-to-end

Status: Done
Priority: P0 critical
Project: Motherbrain
Owner: Coder-1
Created: 2026-04-02
Last Updated: 2026-04-02
Completion Time: 2026-04-02 11:55 PDT

## Objective
Make the direct decision routes actually usable end-to-end for decision making, not just partially implemented in one view.

## Why It Matters
The intended operating loop depends on direct URLs like `/decisions?selected=dec-001`. Right now the real operator path is still not good enough.

## Scope
- fix the actual route(s) Adam will use
- ensure actionable controls render
- ensure submit/persist/refresh/history all work
- verify live on port 4187

## Out of Scope
- unrelated decision system redesign

## Steps
- [x] inspect divergence between list/detail route and direct route
- [x] make the direct route clearly actionable
- [x] verify persistence and response history
- [x] verify on the live local port
- [x] document proof

## Artifacts
- `scripts/dev-server.mjs`
- `PROOF_MB_085.md`
