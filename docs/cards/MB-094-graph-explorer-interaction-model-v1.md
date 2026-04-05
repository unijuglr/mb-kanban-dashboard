# MB-094 — Graph Explorer: interaction model v1 for search, inspect, and exploration

Status: Ready
Priority: P0 critical
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Implement the first real user-facing interaction model for the OLN graph explorer so it behaves like an exploration product rather than a static proof viewer.

## Why It Matters
Adam clarified that the graph explorer should be exploration-first, with validation value as a secondary benefit. The current MVP framing is too implementation-centric; we need the actual operator/user behavior encoded so coders can build toward the right experience.

## Scope
- search-first interaction path
- click behavior: select + inspect + local graph focus
- double-click behavior: navigate to dedicated entity page/route if present, or defined placeholder route
- grouped search results for entity / relationship / path results
- support search over entities + relationships + relationship paths
- preserve admin/debug utility without making it the primary UX

## Dependency
- start only after MB-093 is actually proven on the running dashboard, because this tranche assumes `/graph` and `/api/graph` already work end-to-end

## Product Decisions Already Set
- primary interaction mode: search -> select -> inspect first
- guided exploration prompts are a later follow-on, not required for v1
- single click should both open inspection and recenter/expand context
- double click should navigate to the dedicated entity page
- search should target entities + relationships + paths
- search results should be grouped by result type

## Out of Scope
- adaptive personalization
- graph editing
- LLM-guided prompts
- full live-Neo4j query planner

## Steps
- [ ] define a minimal explorer interaction state model
- [ ] implement grouped search results UI for entities / relationships / paths
- [ ] implement single-click behavior: select, open side panel, focus graph neighborhood
- [ ] implement double-click behavior to entity route/placeholder
- [ ] implement basic relationship/path highlighting in the graph view
- [ ] document exact supported interactions in proof notes
- [ ] add `PROOF_MB_094.md`

## Acceptance Criteria
- a user can search and see grouped result buckets
- selecting a result or clicking a node updates the graph focus and inspection panel together
- double-click has a defined navigational destination
- relationship/path search results are not faked as plain entity hits
- the explorer remains usable for admin/debug inspection mode
- proof is captured against the real running `/graph` route, not just component/unit inspection

## Artifacts
- `src/graph-explorer/`
- `scripts/dev-server.mjs`
- `PROOF_MB_094.md`

## Notes for Coder
Prefer a truthful, sharply-bounded interaction model over flashy rendering. If entity-page routing does not yet exist, create a clear placeholder contract rather than silently no-oping double-click. Ship grouped search + single-click inspect/focus + defined double-click destination as one coherent vertical slice rather than a pile of partial gestures.
