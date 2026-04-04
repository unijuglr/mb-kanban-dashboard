# MB-026 — Build file-backed Motherbrain agent pipeline

Status: Done
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-04

## Objective
Build a file-backed task pipeline on Motherbrain for planner → coder → QA → devops execution using the direct Ollama harness.

## Why It Matters
This becomes the practical replacement for the currently broken OpenClaw embedded local coding path.

## Scope
- task queue layout
- task file format
- role prompts/workflows
- coder/QA/devops handoff pattern
- first project execution using the Kanban UI MVP

## Out of Scope
- full distributed scheduler
- fancy web dashboard for the pipeline itself

## Steps
- [x] define task file schema
- [x] create queue directories on Motherbrain
- [x] create coder runner
- [x] create QA runner
- [ ] create devops/integration runner
- [x] seed first project tasks
- [x] execute first task chain

## Blockers
- No blocker for the scoped MB-026 scaffolding/proof target.
- MB-025 still blocks swapping this deterministic runner over to a live embedded-agent-backed execution path, but that is no longer required for MB-026's file-backed proof contract.

## Artifacts
- `docs/motherbrain/file-backed-agent-pipeline-v1.md`
- `docs/motherbrain/local-coder-reliability-status-2026-04-03.md`
- `scripts/mb_pipeline_runner.mjs`
- `scripts/prove-mb-026.mjs`
- `PROOF_MB_026.md`
- `motherbrain-pipeline/templates/mb-026-safe-proof-prompt.md`
- `motherbrain-pipeline/done/mb-026-safe-proof-task.json`
- `motherbrain-pipeline/failed/mb-026-safe-proof-task-failure.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/coder-manifest.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task/qa-manifest.json`
- `motherbrain-pipeline/logs/mb-026-safe-proof-task-failure/coder-manifest.json`

## Update Log
- 2026-04-04 — Implemented `scripts/mb_pipeline_runner.mjs` plus `scripts/prove-mb-026.mjs`, then captured a real coder→QA success run and a separate durable `missing_outputs` failure run under `motherbrain-pipeline/logs/`.
- 2026-04-03 — Seeded an in-repo pipeline skeleton with queue directories and a non-destructive first pilot task so MB-026 can advance despite MB-025 still being broken.
- 2026-04-03 — Added a current-tree queue/schema design and explicit exit criteria so MB-026 can progress honestly without pretending the embedded local path is already fixed.
- 2026-03-30 — Card created after proving direct Ollama harness can create and validate artifacts on Motherbrain.
