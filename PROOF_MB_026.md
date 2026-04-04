# PROOF_MB_026.md

Task: MB-026  
Date: 2026-04-03/04  
Branch proof command: `node scripts/prove-mb-026.mjs`

## What was proved

A minimal file-backed Motherbrain pipeline runner now executes a seeded safe proof task through:
- coder claim/execution
- durable manifest/log capture
- QA validation
- final move to `done/`

A second deliberately failing task also proves the failure lane is durable and classified honestly.

## Commands run

```bash
node scripts/prove-mb-026.mjs
npm run proof:mb-026
```

## Pass artifacts

- `scripts/mb_pipeline_runner.mjs`
- `scripts/prove-mb-026.mjs`
- `motherbrain-pipeline/done/mb-026-safe-proof-task.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/coder-manifest.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/qa-manifest.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/workspace/notes.txt`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/workspace/result.json`

Pass summary:
- coder runner wrote `notes.txt` and `result.json`
- validation command succeeded
- QA reran validation successfully
- task ended in `motherbrain-pipeline/done/`

## Failure artifacts

- `motherbrain-pipeline/failed/mb-026-safe-proof-task-failure.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task-failure/coder-manifest.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task-failure/task-final.json`

Failure summary:
- deterministic coder intentionally did **not** create `missing.txt`
- validation command still ran and preserved output
- manifest classified the run as `missing_outputs`
- task ended in `motherbrain-pipeline/failed/`

## Limits / honest caveats

- This is scaffolding, not a live LLM-backed repo-edit pipeline.
- The current coder executor is intentionally deterministic for the safe proof prompt and for simple `execution.write_files` tasks.
- Devops/integration stage is still not implemented.
- MB-025 remains relevant for future model-backed execution, but MB-026 itself now has a real file-backed proof path with durable success and failure artifacts.
