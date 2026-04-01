# MB-033 — OLN: Validation: Data Quality & Factual Consistency

Status: Ready
Priority: P2 medium
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Implement validation logic to ensure lore extraction is accurate and consistent.

## Why It Matters
Lore enthusiasts (like Adam) expect the data to be factual and representative of the source. Factual drift or incorrect parsing would break trust in the Open Lore Network.

## Scope
- Factual consistency checks (e.g., character birth/death dates, parents, affiliations).
- Schema validation for extracted nodes and relationships.
- Human-in-the-loop (HITL) tools for manual review.

## Steps
- [ ] Define factual "sanity checks" for Wookieepedia characters.
- [ ] Implement a basic "validation" stage in the Temporal pipeline.
- [ ] Generate "confidence" scores for extracted facts.

## Blockers
- MB-028 (Parser)

## Artifacts
- `src/oln/validation/lore-validator/`
