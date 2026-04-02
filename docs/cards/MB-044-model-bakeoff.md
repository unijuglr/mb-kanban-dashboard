# MB-044 — Evaluation: Local Model Bake-off

Status: Done
Priority: P3 low
Project: Model Bake-off
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Establish a formal, reproducible benchmark for local model performance on Motherbrain.

## Why It Matters
Enables objective decisions on which models to use for coding vs. reasoning vs. ingestion.

## Scope
- Benchmarking inference speed and accuracy on Motherbrain's Mac Studio.
- Testing latest models (DeepSeek-V3, Llama 3.1/3.2, etc.) for local tasks.
- Comparative cost-to-performance analysis (local vs. cloud).

## Steps
- [ ] Define standardized prompt sets for benchmark testing.
- [ ] Implement an automated "bake-off" script for Ollama.
- [ ] Publish model performance results for Samiverse internal use.

## Artifacts
- `src/benchmarks/model-bake-off/`
- `docs/eval/model-performance-report.md`
