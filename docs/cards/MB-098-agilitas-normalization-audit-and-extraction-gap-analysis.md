# MB-098 — Agilitas: Normalization audit and extraction gap analysis

Status: Done
Priority: P1 high
Project: Agilitas
Owner: Prime Sam
Created: 2026-05-10
Last Updated: 2026-05-10

## Objective
Audit the current Agilitas normalization and extraction pipeline against a multi-format sample set (Zoom JSON, Teams VTT) to identify semantic extraction gaps when using deterministic fallbacks.

## Why It Matters
Reliable extraction across diverse meeting formats is the core value of Agilitas. We need to know where the deterministic fallback is too thin before we scale to live Ollama or remote LLM passes.

## Scope
- Run the batch processor against `data/agilitas/samples/`.
- Produce a structured audit report comparing Teams vs Zoom normalization quality.
- Record extraction confidence levels for deterministic mode.
- Document specific semantic gaps (e.g., missing pain points in VTT).

## Out of Scope
- Fixes for identified gaps (this is an audit task).
- Live Ollama testing (already covered by MB-092 fallback logic).

## Steps
- [x] Execute `services/agilitas_ingestor/batch_processor.py` against standard samples.
- [x] Capture `artifacts/agilitas-audit-report.json`.
- [x] Review normalization parity between Zoom and Teams formats.
- [x] Document extraction results and deterministic behavior gaps.

## Artifacts
- `artifacts/agilitas-audit-report.json`
- `artifacts/agilitas-normalization-audit/`

## Completion Notes (2026-05-10)
- Audit report generated with 2/2 successful normalizations for Zoom and Teams samples.
- Identified gap: Zoom format correctly extracted a pain point ("dashboard"), but Teams VTT extraction returned empty pain points despite similar negative sentiment.
- Normalization quality is stable: both formats produced valid `fullTranscript` and `customerTranscript` fields.
- Deterministic fallback remains reliable for sentiment/emotion classification but is too conservative for entity/pain-point extraction from VTT without better regex or live LLM context.

