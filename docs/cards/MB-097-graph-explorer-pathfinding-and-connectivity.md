# MB-097 — Graph Explorer: pathfinding and connectivity queries

- **ID:** MB-097
- **Status:** Done
- **Owner:** Coder-2
- **Priority:** High
- **Last Updated:** 2026-04-05

## Description
Implement pathfinding and multi-node connectivity insights for the proof-backed graph explorer to allow finding relationships between entities in the vertical slice corpus.

## Objectives
- Implement BFS pathfinding for the explorer model.
- Add 'path' intent mode to `scoring.mjs` with adaptive expansion.
- Verify path connectivity between Luke and Tatooine from proof data.

## Done
- [x] Pathfinding logic in `scripts/prove-mb-097.mjs`.
- [x] 'path' intent mode in `src/graph-explorer/scoring.mjs`.
- [x] Path-based ranking and adaptive expansion (visibleNodeLimit).
- [x] Verified path: entity:luke-skywalker -> entity:tatooine.

## Blockers
None.

## Notes
- Logic was verified against the committed MB-080/MB-088 offline proof artifacts.
- The pathfinding logic is currently part of the logic proof; next step is to integrate it into the live route and UI.
