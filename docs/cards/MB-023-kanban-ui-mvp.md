# MB-023 — Build Motherbrain Kanban UI MVP

Status: Done
Priority: P1 important
Owner: Motherbrain local coding agents
Created: 2026-03-30
Last Updated: 2026-04-04

## Objective
Build a lightweight local UI over the file-backed Motherbrain Kanban system.

## Why It Matters
This is both a useful tool and an early proving ground for Motherbrain-local coding agents.

## Scope
- board view
- card detail view
- decision list/detail view
- updates timeline
- limited safe editing for status/update log operations

## Out of Scope
- multi-user auth
- fancy collaboration features
- hidden DB-backed state
- full arbitrary markdown editing

## Steps
- [ ] implement markdown/file parser layer
- [ ] implement board read model
- [ ] implement MVP board UI
- [ ] implement card detail UI
- [ ] implement decision UI
- [ ] implement updates timeline
- [ ] implement safe write operations
- [ ] document run instructions
- [ ] validate against real Motherbrain Kanban files

## Blockers
- Depends on having a working local coding-agent execution path on Motherbrain.

## Artifacts
- `docs/motherbrain-kanban-ui-spec.md`
- future UI project files

## Update Log
- 2026-03-30 — Card created as first target build for Motherbrain-local coding agents.
- 2026-04-04 — Reconciled card status with durable task/proof reality; MB-023 has long been complete in `mb_tasks.json` and `PROOF_MB_023.md`, so the card no longer advertises `Ready`.
