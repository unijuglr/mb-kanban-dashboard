# MB-097 — Graph Explorer: pathfinding and connectivity queries

Status: Ready
Priority: P1
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-05
Last Updated: 2026-04-05

## Objective
Upgrade the live `/graph` route to support basic pathfinding between two selected nodes and show connectivity (shortest path) using proof-backed graph data.

## Why It Matters
A graph is only as good as the connections it reveals. MB-096 added intent modes, but operators still explore node-by-node. Pathfinding (e.g., "How is Luke Skywalker related to Jabba the Hutt?") is a core graph primitive that should be available in the explorer before moving to live Neo4j.

## Scope
- Add pathfinding logic (Dijkstra or BFS) to `src/graph-explorer/scoring.mjs` or a new helper.
- Update `/graph` UI to allow selecting a 'Source' and 'Target' node for pathfinding.
- Highlight the path in the 3D visualization.
- Keep implementation sourced only from committed proof artifacts already in-tree.
- Add repeatable executable QA proof for pathfinding results.

## Out of Scope
- DTS / Rockler work
- Live Neo4j pathfinding queries (keep it proof-backed for now)
- Complex multi-path weighting (keep it to shortest path v1)

## Steps
- [ ] Add `findShortestPath` helper for proof-backed graph data.
- [ ] Add 'Path' mode to the explorer UI (complementing existing intent modes).
- [ ] Implement dual-node selection UI for source/target.
- [ ] Update visualization to highlight the resulting path nodes and edges.
- [ ] Add `scripts/prove-mb-097.mjs` and verify pathfinding on the Luke/Tatooine proof set.
- [ ] Update `mb_tasks.json` and mark done.
