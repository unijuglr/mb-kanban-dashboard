# PROOF_MB_044.md - Evaluation: Local Model Bake-off

Status: Verified
Date: 2026-04-02
Model: google/gemini-3-flash-preview (Orchestrator) / Motherbrain Local Models

## Execution Log
1. Validated `scripts/model_bakeoff.py` configuration.
2. Established SSH tunnel to Motherbrain for local inference access.
3. Ran `python3 scripts/model_bakeoff.py`.
4. Verified generated report at `docs/eval/model-performance-report.md`.

## Proof Artifacts
- [x] `scripts/model_bakeoff.py` (Script updated and tested)
- [x] `docs/eval/model-performance-report.md` (Generated benchmark results)

## Results Summary
- **Fastest Inference:** `llama3.2:latest` (~180 TPS)
- **Balanced Performance:** `deepseek-coder-v2:16b` (~147 TPS)
- **High Reasoning (Slow):** `deepseek-r1:32b` (~27 TPS)

## QA Verification
The script successfully queried the Motherbrain Ollama instance via the local tunnel and produced a formatted markdown report with average, max, and min TPS per model. All tested models responded with valid logic and code.
