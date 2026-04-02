# PROOF_MB_044: Model Bake-off Implementation

## Status: VERIFIED
Date: 2026-04-01
Model: Llama 3.2, DeepSeek Coder V2, Qwen 2.5 Coder
Host: Motherbrain

## Verification Steps
1. Created `scripts/model_bakeoff.py` to automate benchmarking.
2. Defined standard tasks: Logical Reasoning, Python Generation, and Summarization.
3. Executed bake-off on Motherbrain via SSH/SCP.
4. Generated performance report in `docs/eval/model-performance-report.md`.

## Key Findings
- **llama3.2:latest** (2B) is the speed champion at **~178 tok/s**.
- **deepseek-coder-v2:16b** performs strongly at **~146 tok/s**.
- **qwen2.5-coder:14b** is significantly slower at **~55 tok/s** on current hardware.
- All tested models correctly solved the logic puzzle ("Sally has 1 sister").

## Artifacts
- Script: `scripts/model_bakeoff.py`
- Report: `docs/eval/model-performance-report.md`
