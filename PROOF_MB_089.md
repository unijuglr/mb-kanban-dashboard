# PROOF_MB_089

Task: MB-089  
Date: 2026-04-04  
Branch intent: ship a real, read-only OLN graph explorer MVP without paid services or fake data

## What was completed in-repo

- Added `src/graph-explorer/adapter.mjs` to build graph JSON from committed OLN proof artifacts.
- Added `/api/graph` to expose the proof-backed graph model.
- Added `/graph` to the local dashboard shell with:
  - node search
  - group/type filtering
  - clickable node selection
  - neighbor inspection
  - property detail panel
- Added `scripts/prove-mb-089.mjs` and `npm run proof:mb-089`.
- Updated `README.md`, `package.json`, `docs/cards/MB-089-3d-graph-explorer-mvp.md`, and `mb_tasks.json`.

## Proof source

This MVP is grounded in committed OLN evidence already in-tree:

- `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json`
- `docs/cards/MB-088-oln-two-page-ingest-proof-into-local-neo4j.md`

The route does not invent synthetic graph content and does not require a live Neo4j connection.

## QA commands run

```bash
node --check scripts/dev-server.mjs
node --check src/graph-explorer/adapter.mjs
node --check scripts/prove-mb-089.mjs
npm run proof:mb-089
```

## QA results

`npm run proof:mb-089` passed and verified:

- `/graph` renders the explorer shell
- `/api/graph` returns graph JSON
- `/health` advertises `/graph` and `/api/graph`
- `Luke Skywalker` is present in the graph payload
- `Tatooine` is present in the graph payload
- a `Luke Skywalker -> Tatooine` edge is present in the payload

Observed proof output:

```json
{
  "ok": true,
  "checkedRoutes": ["/graph", "/api/graph", "/health"],
  "nodeCount": 9,
  "edgeCount": 9,
  "sourceMode": "proof-artifact"
}
```

## Honest boundaries

This completes the MVP read-only explorer lane, not the full future vision implied by the original card title.

Specifically, this proof does **not** claim:

- live Neo4j reads at request time
- Three.js / force-graph rendering
- write/edit graph behavior
- large-graph performance tuning

What it does prove is that the dashboard now has a durable, interactive graph exploration path grounded in real OLN proof artifacts, with repeatable QA in the repo.
