# MB-038 — OLN: Scale: Franchise Generalization (beyond Star Wars)

Status: Done
Priority: P3 low
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Generalize the OLN pipeline to handle non-Star Wars lore (e.g., Star Trek, MCU).

## Why It Matters
OLN's ultimate vision is to be the "structured factual knowledge layer for fictional universes," not just one. We need to ensure our parser and resolution logic are franchise-agnostic.

## Scope
- Abstracting franchise-specific Wikitext templates from the core parser.
- OLID generation for non-Star Wars entities.
- Generalizing the Neo4j schema for lore-generic properties.

## Steps
- [ ] Create a "generic lore" configuration for the ingestion pipeline.
- [ ] Implement a prototype ingestion for a small Star Trek sample.
- [ ] Review schema for commonalities (characters, places, organizations).

## Blockers
- MB-034 (Ingestion)

## Artifacts
- `src/oln/ingestion/franchise-config/`
- `docs/oln/franchise-agnostic-design.md`
