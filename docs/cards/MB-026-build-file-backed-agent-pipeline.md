# MB-026 — Build file-backed Motherbrain agent pipeline

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-03

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
- [ ] create coder runner
- [ ] create QA runner
- [ ] create devops/integration runner
- [x] seed first project tasks
- [ ] execute first task chain

## Blockers
- MB-025 still blocks a live embedded-agent-backed runner, so the next safe progress is queue seeding plus tiny deterministic pilots before real repo-edit tasks.

## Artifacts
- `docs/motherbrain/file-backed-agent-pipeline-v1.md`
- `docs/motherbrain/local-coder-reliability-status-2026-04-03.md`
- `motherbrain-pipeline/inbox/mb-026-safe-proof-task.json`
- `motherbrain-pipeline/templates/mb-026-safe-proof-prompt.md`
- queue directories under `motherbrain-pipeline/`

## Update Log
- 2026-04-03 — Seeded an in-repo pipeline skeleton with queue directories and a non-destructive first pilot task so MB-026 can advance despite MB-025 still being broken.
- 2026-04-03 — Added a current-tree queue/schema design and explicit exit criteria so MB-026 can progress honestly without pretending the embedded local path is already fixed.
- 2026-03-30 — Card created after proving direct Ollama harness can create and validate artifacts on Motherbrain.
