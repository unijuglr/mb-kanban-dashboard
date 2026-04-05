# PROOF_MB_095

Branch: feat/mb-095-graph-explorer-persistence
Date: 2026-04-04

## Goal
Implement MB-095 on the live `/graph` route using committed proof-backed graph data only:
- curated starter subgraph on cold load
- local persistence for last selected node and last search query
- return-to-context restore on reload
- deep-link `selected` param still works and keeps precedence

## What changed
- added starter-slice metadata to `src/graph-explorer/adapter.mjs`
- added shared persistence/default-state helpers in `src/graph-explorer/state.mjs`
- updated `scripts/dev-server.mjs` so `/graph`:
  - advertises the curated starter slice
  - persists selected node + search query to local storage
  - restores local context when there is no explicit deep link
  - keeps `/graph?selected=:id` as the top-precedence selected-node input
- added executable proof coverage in `scripts/prove-mb-095.mjs`
- created the missing MB-095 card and updated repo docs/task state honestly

## Commands
```bash
node --check scripts/dev-server.mjs
node --check src/graph-explorer/adapter.mjs
node --check src/graph-explorer/state.mjs
node --check scripts/prove-mb-095.mjs
node scripts/prove-mb-089.mjs
node scripts/prove-mb-094.mjs
node scripts/prove-mb-095.mjs
```

## Pass criteria
- `/api/graph` publishes explicit starter-subgraph metadata derived from committed proof artifacts
- `/graph` visibly documents the starter subgraph and local persistence contract
- cold load resolves to the curated starter state
- persisted selected node and search query resolve back in on reload when there is no deep link
- `/graph?selected=:id` overrides persisted selected-node state without breaking the persisted search-query contract

## Result
MB-095 passed on the current tree using only committed OLN proof artifacts and local/device persistence. No live Neo4j dependency, no paid services, and no DTS/Rockler scope touched.
