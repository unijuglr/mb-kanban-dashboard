# MB-096 — Graph Explorer: adaptive expansion and intent modes

Status: Backlog
Priority: P1 important
Project: OLN
Owner: Motherbrain local coding agents
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Add adaptive graph expansion behavior and explicit user intent modes so the explorer can support facts, story/world exploration, relationship tracing, and admin/debug work without one mode polluting all the others.

## Why It Matters
Adam wants adaptive expansion rather than a dumb one-size-fits-all neighbor explosion. He also wants four explicit intent modes at the product level: facts, story/world exploration, relationship tracing, and debug/admin.

## Product Decisions Already Set
- expansion should be adaptive
- adaptive logic should consider a mix of:
  - relationship importance
  - entity popularity/centrality
  - canonicality/confidence
  - user intent mode
- initial intent modes should include:
  - facts
  - story/world exploration
  - relationship tracing
  - debug/admin
- intent mode should live globally, but be overridable per query

## Scope
- define adaptive expansion contract
- implement global intent mode selector
- allow per-query override
- vary expansion/ranking behavior by intent mode
- make debug/admin mode expose lower-level graph details than normal exploration modes

## Dependency
- do not start until MB-094 ships the base interaction model; ideally layer this after MB-095 so expansion behavior has a stable persisted/query context to act on

## Out of Scope
- ML-driven personalization
- heavy ranking infrastructure requiring paid services
- ontology redesign

## Steps
- [ ] define expansion scoring/ranking inputs and mode-specific weights
- [ ] implement global intent mode control
- [ ] implement per-query override
- [ ] adapt expansion behavior by intent mode
- [ ] expose debug/admin-specific detail affordances safely
- [ ] document behavior with examples and proof notes
- [ ] add `PROOF_MB_096.md`

## Acceptance Criteria
- expansion behavior differs meaningfully across at least the four defined modes
- per-query override works without permanently mutating global state unexpectedly
- debug/admin mode surfaces additional inspection value
- implementation remains deterministic and explainable
- proof includes concrete before/after examples showing mode-specific expansion differences on the running explorer

## Artifacts
- `src/graph-explorer/`
- `PROOF_MB_096.md`

## Notes for Coder
Keep the ranking logic explainable. We are not building an inscrutable recommendation system; we are building an explorer whose behavior should make sense to an operator.
