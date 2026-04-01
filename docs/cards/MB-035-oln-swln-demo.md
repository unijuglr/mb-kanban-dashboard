# MB-035 — OLN: Demo: Star Wars Lore Network (SWLN) MVP

Status: Ready
Priority: P2 medium
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Build a basic UI (or API) for querying the Star Wars Lore Network.

## Why It Matters
A knowledge layer needs a way to be consumed. This demo proves that the OLID resolution and graph storage work correctly.

## Scope
- Simple character search by name or OLID.
- Relationship traversal (e.g., "Who are the masters of Anakin Skywalker?").
- Displaying canonical vs legends data for a single node.

## Steps
- [ ] Implement a basic Node/Python API (even if local) for Neo4j lookups.
- [ ] Create a "demo script" to showcase complex relationship queries.
- [ ] Document the "API explorer" for lore consumption.

## Blockers
- MB-034 (Ingestion)

## Artifacts
- `src/oln/demo/swln-api/`
- `docs/oln/swln-demo-guide.md`
