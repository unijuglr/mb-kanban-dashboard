# MB-037 — OLN: Analysis: Graph Relationship Density & Quality

Status: Done
Priority: P3 low
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Analyze the ingested Star Wars graph for relationship density, quality, and gaps.

## Why It Matters
A factual knowledge layer needs more than just isolated facts. Relationship density tells us how "connected" our lore is. Finding gaps (e.g., characters without masters/apprentices) helps prioritize source extraction improvements.

## Scope
- Neo4j graph density reports (nodes per relation type).
- Identifying "orphaned" lore (islands of data).
- Validating franchise-wide consistency (e.g., timeline consistency across all media).

## Steps
- [ ] Implement Cypher scripts for "graph health" reports.
- [ ] Analyze the first 1,000 Wookieepedia characters for link density.
- [ ] Generate a "lore quality" report with recommended ingestion improvements.

## Blockers
- MB-030 (Storage)
- MB-034 (Ingestion)

## Artifacts
- `docs/oln/graph-analysis-v1.md`
