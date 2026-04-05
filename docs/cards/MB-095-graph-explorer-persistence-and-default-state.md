# MB-095 — Graph Explorer: persistence, default state, and return-to-context behavior

Status: Done
Priority: P0 critical
Project: OLN
Owner: Coder-2
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Make the live `/graph` route open into a curated starter subgraph by default, remember local explorer context, and restore the operator to that context on reload without breaking deep-link behavior.

## Why It Matters
MB-094 made the graph explorer interactive, but it still dropped context between visits and always reopened as a blank full-graph view. For actual exploration, the route needs a trustworthy default state plus a durable local return path.

## Scope
- define a curated starter subgraph from already-committed proof-backed OLN graph data
- persist the last selected node locally on the device
- persist the last search query locally on the device
- restore that local context on reload when no explicit deep-link is present
- preserve `/graph?selected=:id` precedence so deep links still work
- add repeatable executable QA proof

## Out of Scope
- cross-device sync
- semantic resume across logins
- live Neo4j querying
- adaptive expansion / intent modes (MB-096)
- DTS / Rockler work

## Steps
- [x] Add explicit starter-subgraph metadata to the proof-backed graph model.
- [x] Add shared graph explorer state helpers for persistence/default-state resolution.
- [x] Update the live `/graph` route to use starter/default/restore behavior.
- [x] Keep deep-link `selected` precedence intact.
- [x] Add executable QA proof and re-run graph explorer regressions.
- [x] Mark MB-095 done in `mb_tasks.json` only after proof passes.

## Artifacts
- `scripts/dev-server.mjs`
- `src/graph-explorer/adapter.mjs`
- `src/graph-explorer/state.mjs`
- `scripts/prove-mb-095.mjs`
- `PROOF_MB_095.md`
- `mb_tasks.json`
- `README.md`

## Completion Notes
- The default cold-load view is now a curated Luke / Tatooine / MB-088 proof-card starter slice sourced only from committed OLN proof artifacts.
- Local device persistence is intentionally narrow and honest for this tranche: selected node + search query only.
- Restore precedence is: deep-link `selected` param first, then local persisted state, then curated starter fallback.
- Deep-link loads continue to honor the URL-selected node while preserving the locally remembered search-query contract.
- Cross-device or semantic restoration remains future work and is not claimed here.

## Update Log
- 2026-04-04: Implemented starter-slice metadata and shared state-resolution helpers.
- 2026-04-04: Updated the live `/graph` route to persist selected node and search query via local storage.
- 2026-04-04: Verified MB-089, MB-094, and MB-095 proof scripts pass on the current tree.
