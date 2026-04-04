# MB-026 — Build file-backed Motherbrain agent pipeline

Status: Blocked
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
- [ ] define task file schema
- [ ] create queue directories on Motherbrain
- [ ] create coder runner
- [ ] create QA runner
- [ ] create devops/integration runner
- [ ] seed first project tasks
- [ ] execute first task chain

## Blockers
- Depends on MB-025, which remains unresolved on the current tree.
- The card still points at a design doc and runner files that are absent on this checkout, so this work cannot honestly be treated as a ready executable tranche.
- Later manager/runtime artifacts imply pipeline evolution happened elsewhere, but this specific card needs either restored artifacts or a truthful retargeting to replacement implementation files.

## Artifacts
- `docs/cards/MB-026-build-file-backed-agent-pipeline.md`

## Update Log
- 2026-03-30 — Card created after proving direct Ollama harness can create and validate artifacts on Motherbrain.
- 2026-04-04 — Reclassified from ready to blocked so the card matches `mb_tasks.json`: the replacement-pipeline story exists in repo history, but the card-cited design/runner artifacts are missing on the current branch.
