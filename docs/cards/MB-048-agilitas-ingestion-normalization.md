# MB-048 — Agilitas: Ingestion: Transcript Normalization Pipeline

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: MB-Sam
Created: 2026-03-31
Last Updated: 2026-04-02

## Objective
Standardize raw meeting transcripts from different sources (Zoom JSON, Microsoft Teams VTT) into a canonical Agilitas schema for downstream AI processing.

## Why It Matters
Agilitas clients use various platforms for customer calls. The AI engine requires a consistent format (`TranscriptData`) to perform sentiment analysis, pain point extraction, and business scoring accurately.

## Scope
- Normalization of Zoom JSON transcripts (including host/participant roles).
- Parsing and normalization of Microsoft Teams VTT files.
- Implementation of the `AgilitasNormalizer` service.

## Steps
- [x] Define canonical `TranscriptData` schema in TypeScript and Python.
- [x] Implement Zoom-specific normalization logic.
- [x] Implement Teams-specific VTT parsing logic.
- [x] Create and run `scripts/test_agilitas_ingestor.py` to verify accuracy.
- [x] Ensure 100% schema compliance for both formats.

## Artifacts
- `services/agilitas_ingestor/normalizer.py`
- `scripts/test_agilitas_ingestor.py`
- `data/agilitas/samples/` (Zoom/Teams samples)
- `PROOF_MB_048.md`
