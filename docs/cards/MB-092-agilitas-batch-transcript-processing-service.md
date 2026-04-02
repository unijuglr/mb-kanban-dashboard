# MB-092 — Agilitas: Batch transcript processing service

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: Coder-4
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Add a batch transcript processing service that can ingest multiple transcript files, normalize them into the Agilitas schema, and run them through the extraction pipeline in a deterministic local/offline-friendly way.

## Why It Matters
Single-file demos are not enough for local proof or repeatable QA. Agilitas needs a durable batch path that can process mixed transcript inputs and still produce honest, deterministic results when live Ollama is unavailable.

## Scope
- add a Python batch processor under `services/agilitas_ingestor`
- support batch processing of Zoom JSON, Teams VTT, and plain text transcripts
- preserve the existing normalization + extraction pipeline shape
- provide deterministic extraction/fallback behavior for offline-friendly local QA
- emit JSON report artifacts suitable for proof and repeatable validation

## Out of Scope
- DTS work
- Rockler work
- cloud-only or paid-service QA requirements

## Steps
- [x] Inspect existing Agilitas normalizer, extractor, and QA scripts.
- [x] Implement `services/agilitas_ingestor/batch_processor.py`.
- [x] Add deterministic extraction mode/fallback to the extractor for honest offline QA.
- [x] Add MB-092 proof script and generated batch report artifact.
- [x] Update task/runtime artifacts so MB-092 is durable in-repo.

## Artifacts
- `services/agilitas_ingestor/batch_processor.py`
- `services/agilitas-ai-core/extractor.py`
- `scripts/qa_agilitas_pipeline.py`
- `scripts/prove-mb-092.py`
- `docs/agilitas/mb-092-batch-report.json`
- `PROOF_MB_092.md`

## Update Log
- 2026-04-02: Added a file-oriented Agilitas batch processor that normalizes mixed transcript inputs and writes per-file/result summary JSON artifacts.
- 2026-04-02: Extended the extractor with deterministic mode and honest provider fallback so local QA passes offline without pretending Ollama is live.
- 2026-04-02: Verified MB-092 locally against Zoom JSON, Teams VTT, and plain-text sample transcripts.
