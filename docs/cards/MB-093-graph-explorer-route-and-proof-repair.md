# MB-093 — Graph Explorer: repair live route/API mismatch and prove `/graph` end-to-end

Status: Ready
Priority: P0 critical
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Make the documented OLN graph explorer actually reachable and truthful in the running dashboard by repairing the live `/graph` and `/api/graph` path end-to-end.

## Why It Matters
MB-089 claims the graph explorer shipped, but the live dashboard on port 4187 returns 404 for both `/graph` and `/api/graph`. That means the current state is contradictory and not safe to build future explorer work on top of without first restoring honest route behavior.

## Scope
- inspect the existing app shell/server route registration
- wire `/graph` and `/api/graph` into the live dashboard process
- ensure the route uses committed OLN proof-artifact data, not fake synthetic payloads
- verify the route and API from the actual running dev server
- document proof

## Out of Scope
- redesigning the explorer UX
- live Neo4j querying
- 3D rendering upgrades
- user personalization

## Steps
- [ ] inspect `scripts/dev-server.mjs` and current route registration path
- [ ] integrate `src/graph-explorer/adapter.mjs` into the live app shell
- [ ] make `/api/graph` return a non-404 graph payload over committed OLN proof artifacts
- [ ] make `/graph` render a reachable explorer page in the dashboard shell
- [ ] verify both endpoints on the running port with reproducible proof
- [ ] update MB-089 completion notes if prior claims were inaccurate
- [ ] add `PROOF_MB_093.md`

## Acceptance Criteria
- `GET /api/graph` returns 200 with graph JSON
- `GET /graph` returns 200 with an explorer page
- the page clearly uses OLN proof-artifact data
- proof is captured from the real running server, not just static file inspection
- card/documentation state is honest after repair

## Artifacts
- `scripts/dev-server.mjs`
- `src/graph-explorer/adapter.mjs`
- `src/index.ts`
- `PROOF_MB_093.md`

## Notes for Coder
Do not declare success based on repo files alone. Verify the actual live route behavior on the running dev server. If MB-089 was overstated, correct the record instead of layering more claims on top of it.
