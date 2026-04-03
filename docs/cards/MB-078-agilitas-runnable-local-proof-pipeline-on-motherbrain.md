# MB-078 — Agilitas: runnable local proof pipeline on Motherbrain

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: Coder-2
Created: 2026-04-03
Last Updated: 2026-04-03

## Objective
Implement the smallest durable, executable local proof pipeline for Agilitas on Motherbrain: transcript in, local redaction, local extraction request, deterministic scoring, action recommendation, and a saved proof artifact.

## Why It Matters
The plan and demo docs were already in place, but MB-078 was the point where paperwork had to become an actually runnable proof path.

## Scope
- one command to run the proof pipeline
- plain-text transcript wrapper into normalized shape
- local PII redaction before extraction
- honest extraction behavior when Ollama is unavailable
- durable JSON proof artifact
- checked-in proof documentation

## Out of Scope
- DTS work
- paid APIs
- Docker stack orchestration
- UI work

## Steps
- [x] inspect existing Agilitas scripts/services/proofs
- [x] implement the minimal local proof runner in `scripts/qa_agilitas_pipeline.py`
- [x] write `docs/agilitas/motherbrain-local-proof-output.json`
- [x] capture proof in `PROOF_MB_078.md`
- [x] update durable task state in `mb_tasks.json`

## Artifacts
- `scripts/qa_agilitas_pipeline.py`
- `docs/agilitas/motherbrain-local-proof-output.json`
- `PROOF_MB_078.md`

## Notes
The 2026-04-03 proof run completed end-to-end, but live Ollama at `127.0.0.1:11434` was unavailable. The pipeline recorded `providerUsed: deterministic-fallback` and preserved the connection failure in the output artifact rather than faking a live-model pass.
