# MB-028 — OLN: Ingestion: Wikitext to Graph Parser (Node/Python)

Status: Done
Priority: P1 high
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Build a production-grade Wikitext to Graph parser for Wookieepedia.

## Why It Matters
Wikitext is messy; our parser needs to extract structured relationships, infoboxes, and references into a format suitable for graph insertion and entity resolution.

## Scope
- Incremental extraction of Wookieepedia dumps.
- Structured extraction of infobox data and internal links.
- Handling of "Canon" vs "Legends" data tracks.

## Steps
- [ ] Implement initial Wikitext parser logic for Wookieepedia-specific templates.
- [ ] Create a "raw" storage layer (Firestore or local file) for extracted JSON results.
- [ ] Define the output schema for the "unresolved" graph nodes/edges.

## Blockers
- MB-027 (Architecture)

## Artifacts
- `src/oln/ingestion/parser/`
