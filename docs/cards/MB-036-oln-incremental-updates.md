# MB-036 — OLN: Scale: Incremental Updates & Delta Ingestion

Status: Done
Priority: P3 low
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Support incremental Wikitext updates without re-ingesting the full dataset.

## Why It Matters
Lore changes. Wookieepedia is updated daily. Our pipeline must be able to process "diffs" to keep the knowledge layer fresh and up-to-date.

## Scope
- Tracking "last-updated" state for all Wikitext pages.
- Resolving deltas and updating Neo4j nodes/relationships.
- Handling of "tombstoning" or merging of previously existing nodes.

## Steps
- [x] Implement a "delta" parser for Wookieepedia's incremental XML dumps.
- [ ] Update the Temporal pipeline to support "UpdateNode" operations.
- [x] Implement a tracking layer for page revision history (local state JSON for now).

## Blockers
- MB-034 (Ingestion)

## Artifacts
- `src/oln/ingestion/delta-manager/` (local: `services/oln_ingestor/delta_parser.py`)
- `PROOF_MB_036.md`
