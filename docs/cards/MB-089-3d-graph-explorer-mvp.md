# MB-089 — 3D Graph Explorer: MVP visualization for Neo4j nodes

Status: Ready
Priority: P0 critical
Project: OLN
Owner: Coder-2
Created: 2026-04-02
Last Updated: 2026-04-02

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
- [ ] Implement Neo4j-to-D3/3D JSON adapter in the backend.
- [ ] Add `/graph` route to the dashboard UI.
- [ ] Implement 3D render layer with basic node/link geometry.
- [ ] Add side-panel for property inspection.
- [ ] Add filtering/search controls.
- [ ] Verify live against the Luke/Tatooine vertical slice.

## Artifacts
- `src/graph-explorer/`
- `scripts/dev-server.mjs`
- `PROOF_MB_089.md`
