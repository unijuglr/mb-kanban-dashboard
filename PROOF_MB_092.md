# PROOF_MB_092

## Summary
Implemented MB-092 by adding an Agilitas batch transcript processing service that runs multiple transcript files through the existing normalization + extraction pipeline, with a deterministic offline-friendly extraction mode for honest local QA.

## What changed
- `services/agilitas_ingestor/batch_processor.py`
  - adds `AgilitasBatchProcessor` for multi-file runs
  - supports directory or file inputs
  - normalizes Zoom JSON, Teams VTT, and plain text transcript files
  - optionally writes per-file output JSON plus a batch summary report
- `services/agilitas-ai-core/extractor.py`
  - adds deterministic extraction mode
  - adds honest fallback when live provider calls fail
  - preserves the 7-dimension output contract for local/offline proof
- `scripts/qa_agilitas_pipeline.py`
  - now verifies the deterministic/offline contract directly
  - truthfully reports when Ollama is unavailable and fallback was used
- `scripts/prove-mb-092.py`
  - fixture-based proof that processes three transcript formats and writes `docs/agilitas/mb-092-batch-report.json`

## QA
### Command
```bash
python3 -m py_compile services/agilitas_ingestor/batch_processor.py services/agilitas-ai-core/extractor.py scripts/qa_agilitas_pipeline.py scripts/prove-mb-092.py
```
### Result
Passed with no output.

### Command
```bash
python3 scripts/qa_agilitas_pipeline.py
```
### Result
- Deterministic extraction returned all 7 required dimensions.
- No raw `John Doe` or `123-456-7890` leaked into the extraction output.
- Live Ollama was unavailable on `127.0.0.1:11434`, and the script verified the deterministic fallback path honestly instead of claiming live success.

### Command
```bash
python3 scripts/prove-mb-092.py
```
### Result
```json
{
  "ok": true,
  "reportPath": "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard/docs/agilitas/mb-092-batch-report.json",
  "formats": [
    "plain_text",
    "teams_vtt",
    "zoom_json"
  ],
  "resultCounts": {
    "total": 3,
    "ok": 3,
    "error": 0
  }
}
```

## Verification notes
- MB-092 proof is deterministic and local/offline-friendly by default.
- The proof exercises mixed input types, not just plain text.
- The generated report is committed as a durable artifact at `docs/agilitas/mb-092-batch-report.json`.
- This proof does **not** claim live-model semantic accuracy when Ollama is down; it claims contract integrity and reproducible batch behavior.
