# MB-095 — Graph Explorer: persistence, default state, and return-to-context behavior

Status: Backlog
Priority: P1 important
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Make the OLN graph explorer feel stateful and user-respectful by restoring prior context and providing a sensible default entry state.

## Why It Matters
Adam explicitly wants the explorer to remember where the user was. A graph tool that forgets the last node/query on every return feels toy-grade and wastes exploration effort.

## Product Decisions Already Set
- default opening state should be a curated starter subgraph
- later, featured/relevant entities can become the default once user modeling exists
- if prior context exists, the explorer should return to that instead of always resetting
- persistence should use two levels:
  - same device/session: restore richer full state
  - cross-device/login: restore semantic context instead of exact camera/layout state

## Scope
- define explorer state persistence contract
- restore last node/query/context on return when available
- fallback to curated starter subgraph when no prior state exists
- clearly separate exact local UI state from portable semantic state

## Dependency
- do not start until MB-094 defines and ships the interaction state model that this persistence layer is supposed to restore

## Out of Scope
- full auth/account system
- recommendation engine
- featured-entity ranking logic beyond a simple placeholder/fallback contract

## Steps
- [ ] define persisted state schema for local/session state and semantic return state
- [ ] implement local restore of last node/query/filters/focus state
- [ ] implement semantic fallback restore contract for future cross-device use
- [ ] implement curated starter subgraph fallback when no prior state exists
- [ ] expose reset/clear-return-context control for debugging
- [ ] add `PROOF_MB_095.md`

## Acceptance Criteria
- returning to the explorer on the same device restores prior exploration state
- cold-start users see a curated starter subgraph, not a blank or chaotic view
- portable semantic state is documented even if cross-device identity is not fully implemented yet
- state restoration is explicit and inspectable, not hidden magic
- proof shows both cold-start behavior and same-device return behavior on the running explorer

## Artifacts
- `src/graph-explorer/`
- `PROOF_MB_095.md`

## Notes for Coder
Do not overengineer auth for this. A well-defined local persistence layer plus a future-facing semantic-state contract is enough for this tranche.
