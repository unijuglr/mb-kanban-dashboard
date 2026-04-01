# MB-027 — OLN: Architecture: High-level System Design & Data Flow

Status: Ready
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Finalize the high-level architecture for the Open Lore Network (OLN) ingestion and resolution pipeline on Motherbrain.

## Why It Matters
A structured knowledge layer for fictional universes requires a robust, scalable pipeline. We need to move from "prototype extraction" to a "production ingestor" that handles incremental updates and entity resolution correctly.

## Scope
- Define data flow from MediaWiki (Wikitext) to Neo4j/Firestore.
- Map out the roles of Temporal (orchestration), Node/Python (extraction/parsing), and Neo4j (graph storage).
- Specify how OLID (Open Lore ID) generation fits into the flow.

## Steps
- [ ] Create `docs/oln/architecture.md` with system diagram.
- [ ] Define internal API boundaries between extraction and resolution.
- [ ] Review schema requirements for Star Wars / Wookieepedia initial set.

## Artifacts
- `docs/oln/architecture.md`
