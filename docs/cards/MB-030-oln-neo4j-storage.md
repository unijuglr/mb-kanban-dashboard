# MB-030 — OLN: Storage: Neo4j Graph Schema & Insertion

Status: Ready
Priority: P1 high
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Design the Neo4j graph schema for Star Wars lore and implement the insertion pipeline.

## Why It Matters
Neo4j is our source of truth for the structured factual knowledge layer. The schema must support complex lore relationships (master-padawan, planet-sector, affiliation-group).

## Scope
- Property Graph Model for Lore (Nodes, Relationships, Properties).
- Performance indexing (indexes on OLID, names).
- Cypher queries for common lookups.

## Steps
- [ ] Define initial Cypher schema script.
- [ ] Implement the insertion logic for resolved OLID nodes and relationships.
- [ ] Test the ingestion of a small slice (e.g., characters from A New Hope).

## Blockers
- MB-029 (Resolution)

## Artifacts
- `infra/neo4j/schema.cypher`
- `src/oln/storage/neo4j-client/`
