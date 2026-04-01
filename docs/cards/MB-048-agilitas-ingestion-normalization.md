# MB-048 — Agilitas: Ingestion: Transcript Normalization Pipeline

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Standardize raw transcript input (JSON/TXT/VTT) into the Agilitas "Unified Fragment Schema" for downstream processing.

## Why It Matters
Input sources vary (Zoom, Teams, Otter). Normalization ensures consistent speaker identification, timestamping, and metadata before extraction.

## Scope
- Parsers for common transcript formats.
- Metadata attachment (Date, Participant IDs, Customer Segment).
- Fragmenting strategy for context preservation in large transcripts.

## Steps
- [ ] Create `services/agilitas-ingestor/`
- [ ] Map Zoom/Teams JSON schemas to Agilitas format.
- [ ] Implement deduplication and sequence verification.

## Artifacts
- `docs/agilitas/unified-schema.json`
- `services/agilitas-ingestor/`
