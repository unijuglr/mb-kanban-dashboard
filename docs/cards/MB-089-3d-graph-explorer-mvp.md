# MB-089 — 3D Graph Explorer: MVP visualization for Neo4j nodes

Status: Done
Priority: P0 critical
Project: OLN
Owner: Coder-2
Created: 2026-04-02
Last Updated: 2026-04-04

## Objective
Implement a high-performance 3D visualization interface for the OLN Neo4j graph. The interface must allow for node exploration, filtering by type/property, and interactive traversals.

## Why It Matters
Seeing the "facts" in a spatial, interactive format is critical for validating the density of the Lore Network and discovering gaps in character/event relationships that a flat list cannot surface.

## Scope
- Implement a 3D Force-Directed Graph interface (using Three.js or 3d-force-graph).
- Create a read-only API bridge to the live Motherbrain Neo4j instance.
- Features:
  - Node filtering (by Label, Franchise, Source).
  - Traversal expansion (click to show neighbors).
  - Detail panel: view all node properties when selected.
  - Search: fly to specific nodes.

## Out of Scope
- Graph editing (write operations).
- Advanced VR/AR support.
- User authentication.

## Steps
- [x] Implement read-only graph JSON adapter in the backend over committed OLN proof artifacts.
- [x] Add `/graph` route to the dashboard UI.
- [x] Implement minimal graph render layer with interactive node/link geometry in the zero-dependency shell.
- [x] Add side-panel for property inspection.
- [x] Add filtering/search controls.
- [x] Verify against the Luke/Tatooine vertical slice proof data.

## Artifacts
- `src/graph-explorer/`
- `scripts/dev-server.mjs`
- `scripts/prove-mb-089.mjs`
- `PROOF_MB_089.md`

## Completion Notes (2026-04-04)
- Implemented `/api/graph` and `/graph` in the existing dashboard app shell.
- Built a lightweight adapter over committed OLN proof artifacts instead of introducing paid services, DTS work, or write paths.
- Rendered the graph as an interactive SVG explorer with node selection, neighborhood focus, search, and filters.
- Used the Luke/Tatooine proof slice from `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json` as the real data source.
- Added `scripts/prove-mb-089.mjs` and `PROOF_MB_089.md` for reproducible QA proof.
- Honest MVP scope: this is a real graph explorer path now, but the rendering layer is zero-dependency SVG rather than a bundled 3D library.

## Correction Note (2026-04-04)
- This card was materially overstated on 2026-04-04: the repo contained the graph adapter, proof script, and documentation, but the actual running dev server still returned 404 for `/graph` and `/api/graph` because route registration was missing in `scripts/dev-server.mjs`.
- MB-093 repaired that live wiring and re-proved both endpoints against the real local server on port 4187.
- Treat the current graph route/API claim as true only after the MB-093 repair, not before it.

## Completion Notes (2026-04-04)
- Shipped a minimal read-only graph explorer at `/graph` backed by committed OLN proof artifacts instead of inventing synthetic demo data.
- Added `/api/graph` and `src/graph-explorer/adapter.mjs` to translate the Luke/Tatooine proof bundle plus MB-088 card metadata into explorable nodes and edges.
- Used a zero-dependency SVG interaction layer for the MVP to stay cost-disciplined and avoid pulling in Three.js at this stage.
- Added `scripts/prove-mb-089.mjs` plus `npm run proof:mb-089` to verify the route, API, and Luke→Tatooine edge end to end.
- Live route truth was repaired afterward by MB-093 when the missing dev-server registration was discovered.
- This closes the MVP read-only explorer lane, not the later live-Neo4j/3D-heavy follow-on work.
