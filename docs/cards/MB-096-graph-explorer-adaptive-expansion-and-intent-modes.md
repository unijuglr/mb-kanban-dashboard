# MB-096 — Graph Explorer: adaptive expansion and intent modes

Status: Done
Priority: P0 critical
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Upgrade the live `/graph` route so expansion is intent-aware instead of static: operators should be able to explore the proof-backed graph in different modes, and the route should adapt which related nodes/edges are emphasized based on that mode.

## Why It Matters
MB-094 and MB-095 made `/graph` interactive and stateful, but exploration is still blunt. Adam’s product direction is exploration-first with guided behavior: facts, story/world exploration, relationship tracing, and debug/admin should feel meaningfully different without inventing live Neo4j data or fake intelligence.

## Product Direction Captured
- exploration-first, with validation also useful
- search-first interaction remains primary
- single click already opens side panel + recenters/expands
- double click already deep-links to the entity page/state
- adaptive expansion should blend relationship importance, centrality/popularity, confidence/canonicality, and user intent mode
- initial global intent modes:
  - `facts`
  - `story`
  - `relationships`
  - `debug`
- global intent mode with per-query/result override is acceptable in v1 so long as the route behavior is explicit and testable
- no DTS work

## Scope
- Add explicit intent-mode metadata/state handling to the live `/graph` route.
- Add an adaptive expansion/ranking layer over the existing proof-backed graph JSON.
- Make selection/expansion behavior vary predictably by intent mode.
- Keep the implementation sourced only from committed proof artifacts already in-tree.
- Add repeatable executable QA proof for the ranking/intent behavior.
- Update durable task/proof/runtime notes only after QA passes.

## Out of Scope
- DTS / Rockler work
- paid services
- live Neo4j queries
- cross-device sync
- semantic multi-device resume
- graph editing or write paths

## Suggested v1 implementation shape
- Add graph scoring helpers in `src/graph-explorer/` that assign per-node / per-edge weights using available proof-backed signals such as:
  - node group/type
  - degree / connectivity within the loaded proof graph
  - proof emphasis / verification hints
  - explicit relationship type
  - whether a node belongs to the curated starter slice
- Add a global intent mode selector on `/graph`.
- For each intent mode, bias ranking/display differently:
  - `facts`: verified/high-confidence/proof-linked entities first
  - `story`: character/place/story-adjacent exploration bias
  - `relationships`: emphasize edges/path visibility and connected neighbors
  - `debug`: expose raw metadata / ranking reasons / broader graph context
- Preserve MB-094/095 behavior unless the new intent/expansion logic intentionally overrides it.
- Prefer deterministic, inspectable heuristics over opaque behavior.

## Steps
- [x] Add intent-mode state model and deterministic default.
- [x] Add adaptive node/edge ranking helpers based on proof-backed graph metadata.
- [x] Update `/graph` UI so operators can change intent mode and see exploration results shift.
- [x] Preserve starter/deep-link/local-persistence contracts from MB-095.
- [x] Add executable proof for ranking/intent behavior.
- [x] Re-run MB-089, MB-094, and MB-095 regressions.
- [x] Mark MB-096 done in `mb_tasks.json` only after proof passes.

## Artifacts
- `docs/cards/MB-096-graph-explorer-adaptive-expansion-and-intent-modes.md`
- `src/graph-explorer/`
- `scripts/prove-mb-096.mjs`
- `PROOF_MB_096.md`
- `mb_tasks.json`
- `MB_SAM_RUNTIME.md`

## Proof Expectations
- Show the live `/graph` route exposes the four intent modes.
- Show intent mode changes produce deterministic differences in ranking/expansion output.
- Show existing graph explorer proofs still pass.
- Do not claim live Neo4j behavior; this tranche remains proof-artifact-backed.

## Completion Notes
- 2026-04-04: Added deterministic intent-mode ranking helpers for proof-backed nodes/edges plus a live `/graph` selector for `facts`, `story`, `relationships`, and `debug`.
- 2026-04-04: Preserved the MB-095 starter/deep-link/local-persistence contract while extending persistence to include the selected intent mode.
- 2026-04-04: Added `scripts/prove-mb-096.mjs` and re-ran MB-089, MB-094, MB-095, and MB-096 successfully on the current tree.
