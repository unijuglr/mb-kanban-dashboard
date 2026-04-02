# PROOF_MB_044.md

ID: MB-044
Title: Evaluation: Local Model Bake-off
Status: Verified
Owner: Prime Sam
Date: 2026-04-01

## Verification Steps
1. Configured `scripts/model_bakeoff.py` to target Motherbrain (Mac Studio) models via SSH.
2. Models tested: `llama3.2:latest`, `deepseek-coder-v2:16b`, `qwen2.5-coder:14b`, `deepseek-r1:32b`.
3. Tasks: Logical Reasoning, Python Generation (Fibonacci), Summarization.
4. Execution: `python3 scripts/model_bakeoff.py` from laptop.

## Results Summary
- **llama3.2:latest**: ~91 TPS (Fastest, but failed logical reasoning).
- **deepseek-coder-v2:16b**: ~64 TPS (Balanced).
- **qwen2.5-coder:14b**: ~30 TPS (Good for code).
- **deepseek-r1:32b**: ~27 TPS (Slowest, but highest quality reasoning).

Full report generated at `docs/eval/model-performance-report.md`.

## Artifacts Created
- `docs/eval/model-performance-report.md`
- `scripts/model_bakeoff.py` (Remote-capable version)
