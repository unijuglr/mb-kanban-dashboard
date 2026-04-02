# MB-072 — OLN: Motherbrain vertical slice definition

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Define the smallest OLN slice that can run end-to-end on Motherbrain: ingest a limited lore corpus, resolve entities, store into Neo4j, and support a few proof queries.

## Why It Matters
We need a runnable OLN dev target, not just more architecture prose. This card turns OLN into a bounded execution target for coders.

## Scope
- pick the exact starter corpus
- define ingest -> parse -> resolve -> store path
- define success criteria and proof queries
- note required services and dependencies

## Out of Scope
- full-franchise ingestion
- production scaling
- multi-franchise generalization beyond what is needed for the first slice

## Steps
- [x] choose the exact starter corpus size and content
- [x] define the minimum service topology on Motherbrain
- [x] specify proof queries and pass criteria
- [x] identify blockers that must be cleared before coding

## Artifacts
- `docs/oln/motherbrain-vertical-slice-plan.md`

## Completion Notes
- Chose the smallest honest vertical slice: 2-page local Wookieepedia sample -> parse -> resolve -> Neo4j -> proof queries.
- Kept the slice local-only on Motherbrain with zero paid APIs and no DTS work.
- Documented repo-reality blockers, including the stubbed Neo4j write path and parser proof drift.
