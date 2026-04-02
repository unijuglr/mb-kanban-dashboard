# PROOF_MB_092 — Agilitas batch transcript processing service

Date: 2026-04-02
Card: MB-092
Status: PASS

## What changed
- Added `services/agilitas-ingestor/batch_processor.py`.
- Supports processing multiple transcript files in one run.
- Pipeline per file is `normalize -> redact -> extract`.
- Reuses the corrected local Ollama wiring from `services/agilitas-ai-core/llm_client.py`.
- Writes a summary report JSON with aggregate counts plus per-file outputs.

## Supported inputs
- Zoom JSON (`.json`) via `AgilitasNormalizer.normalize_zoom_json`
- Teams VTT (`.vtt`) via `AgilitasNormalizer.normalize_teams_vtt`
- Plain text transcripts (`.txt`, `.md`) via a simple fallback normalizer

## Output contract
The report JSON includes:
- `pipeline`
- `provider`
- `model`
- `ollama_endpoint`
- `transcripts_requested`
- `transcripts_processed`
- `transcripts_failed`
- `results[]` with normalized transcript, redacted transcript, extraction, and status per file

## Validation run
To keep this zero-spend, validation used a tiny local fake Ollama server bound to `127.0.0.1:18080` and pointed the batch processor at it with `OLLAMA_HOST`.

Command run:

```bash
OLLAMA_HOST=http://127.0.0.1:18080 python3 services/agilitas-ingestor/batch_processor.py \
  data/agilitas/samples/zoom-sample.json \
  data/agilitas/samples/teams-sample.vtt \
  data/demo/transcript_retail.txt \
  --output docs/agilitas/mb-092-batch-report.json
```

Observed summary:

```json
{
  "processed": 3,
  "failed": 0,
  "provider": "ollama",
  "ollama_endpoint": "http://127.0.0.1:18080/api/generate"
}
```

## Evidence
- Report output: `docs/agilitas/mb-092-batch-report.json`
- The report shows 3 transcripts processed successfully across JSON, VTT, and TXT inputs.
- The plain-text transcript demonstrates PII redaction before extraction (`jamie@example.com` and `415-555-0188` were replaced in the redacted transcript).

## Files updated
- `services/agilitas-ingestor/batch_processor.py`
- `docs/agilitas/mb-092-batch-report.json`
- `PROOF_MB_092.md`
- `mb_tasks.json`
- `mb_metrics.json`

## Outcome
MB-092 is complete. Agilitas can now batch-process multiple transcripts in a single run using the local Ollama path and produce a machine-readable summary report.
