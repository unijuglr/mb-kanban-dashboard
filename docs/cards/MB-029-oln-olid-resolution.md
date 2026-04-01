# MB-029 — OLN: Resolution: OLID Generation & Entity Linking

Status: Ready
Priority: P1 high
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Design and implement the OLID (Open Lore ID) system for consistent entity resolution across different wikis or franchises.

## Why It Matters
Entities (like "Luke Skywalker") can appear across multiple sources. OLID provides the canonical, stable identifier to link everything back to a single graph node while preserving source metadata.

## Scope
- Algorithm for generating and managing stable OLIDs.
- Resolution logic (name normalization, alias mapping).
- Conflict resolution (is "Ben Kenobi" the same as "Obi-Wan Kenobi"?).

## Steps
- [ ] Define the OLID format (e.g., `oln-sw-12345`).
- [ ] Implement initial resolution engine with fuzzy matching and alias support.
- [ ] Create a "source map" to track which Wikitext pages contributed to an OLID.

## Blockers
- MB-028 (Parser)

## Artifacts
- `docs/oln/olid-specification.md`
- `src/oln/resolution/olid-manager/`
