# Proof Artifact: MB-044 Local Model Bake-off

-   **Benchmark Script**: `scripts/benchmarks/run_benchmark.sh` (executed on Motherbrain)
-   **Prompt Set**: `scripts/benchmarks/prompts.json`
-   **Raw Data**: `docs/eval/benchmark-results.json`
-   **Final Report**: `docs/eval/model-performance-report.md`

## Verification

The benchmarking script successfully executed across three different Ollama models:
1. llama3.2:latest
2. deepseek-coder-v2:16b
3. qwen2.5-coder:14b

Standardized coding and reasoning prompts were used to ensure fair comparison of performance metrics (tokens per second).

Report generated and saved to `docs/eval/model-performance-report.md`.
Raw data preserved in `docs/eval/benchmark-results.json`.

Date: 2026-04-01
Status: COMPLETED
Artifacts verified in /Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard.
