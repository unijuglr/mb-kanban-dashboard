# MB-093 — Graph Explorer: repair live route/API mismatch and prove `/graph` end-to-end

Status: Done
Priority: P0 critical
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Make the documented OLN graph explorer actually reachable and truthful in the running dashboard by repairing the live `/graph` and `/api/graph` path end-to-end.

## Why It Matters
MB-089 claimed the graph explorer shipped, but the live dashboard on port 4187 returned 404 for both `/graph` and `/api/graph`. That contradiction made the repo state untrustworthy until the actual running server path was repaired and re-proved.

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
- [x] inspect `scripts/dev-server.mjs` and current route registration path
- [x] integrate `src/graph-explorer/adapter.mjs` into the live app shell
- [x] make `/api/graph` return a non-404 graph payload over committed OLN proof artifacts
- [x] make `/graph` render a reachable explorer page in the dashboard shell
- [x] verify both endpoints on the running port with reproducible proof
- [x] update MB-089 completion notes if prior claims were inaccurate
- [x] add `PROOF_MB_093.md`

## Acceptance Criteria
- `GET /api/graph` returns 200 with graph JSON
- `GET /graph` returns 200 with an explorer page
- the page clearly uses OLN proof-artifact data
- proof is captured from the real running server, not just static file inspection
- card/documentation state is honest after repair

## Artifacts
- `scripts/dev-server.mjs`
- `src/graph-explorer/adapter.mjs`
- `scripts/prove-mb-089.mjs`
- `PROOF_MB_093.md`

## Completion Notes (2026-04-04)
- Repaired the missing live route registration in `scripts/dev-server.mjs`; the adapter and proof script already existed, but the real server never exposed them.
- Added `/graph` to the shell nav and live route table, plus `/api/graph` to the JSON API and `/health` route list.
- Verified the running local dev server on port 4187 returns live 200s for both endpoints and serves proof-backed Luke/Tatooine graph data.
- Corrected the record: MB-089 repo artifacts existed before, but the route/API claim was overstated until MB-093 repaired the actual running server wiring.
