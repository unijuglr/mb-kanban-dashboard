# PROOF_MB_092 — Agilitas batch transcript processing service

## Scope
Repo-side proof for MB-092 on the current tree. Non-DTS only.

## Branch
- `feat/mb-092-proof-refresh`

## Commands Run
```bash
python3 scripts/prove-mb-092.py
python3 scripts/qa_agilitas_pipeline.py
python3 scripts/test_agilitas_redaction.py
python3 scripts/test_agilitas_ingestor.py
```

## Results
- `python3 scripts/prove-mb-092.py` passed and refreshed `docs/agilitas/mb-092-batch-report.json`.
- Batch proof covered mixed transcript inputs:
  - Zoom JSON
  - Teams VTT
  - plain text
- Result counts: `total=3`, `ok=3`, `error=0`.
- `python3 scripts/qa_agilitas_pipeline.py` passed and refreshed `docs/agilitas/motherbrain-local-proof-output.json`.
- `python3 scripts/test_agilitas_redaction.py` passed.
- `python3 scripts/test_agilitas_ingestor.py` passed.

## Truthful Runtime Notes
- Live Ollama at `127.0.0.1:11434` was unavailable during the MB-078 proof rerun; the output artifact records honest deterministic fallback instead of pretending a live-model pass.
- MB-092 remains valid as a local/offline-friendly batch processing path.

## Durable Artifacts
- `services/agilitas_ingestor/batch_processor.py`
- `scripts/prove-mb-092.py`
- `docs/agilitas/mb-092-batch-report.json`
- `docs/cards/MB-092-agilitas-batch-transcript-processing-service.md`
- `docs/agilitas/motherbrain-local-proof-output.json`

## Verdict
MB-092 is re-verified on the current repo state with executable proof and durable artifacts.
