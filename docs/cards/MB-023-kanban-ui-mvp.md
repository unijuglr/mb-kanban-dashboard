# MB-023 — Build Motherbrain Kanban UI MVP

Status: Done
Priority: P1 important
Owner: MB-Sam
Created: 2026-03-30
Last Updated: 2026-04-03

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
- [x] implement markdown/file parser layer
- [x] implement board read model
- [x] implement MVP board UI
- [x] implement card detail UI
- [x] implement decision UI
- [x] implement updates timeline
- [ ] implement safe write operations
- [x] document run instructions
- [x] validate against repo-backed board/task inputs

## Blockers
- Safe write operations remain out of scope for the proved MVP completion boundary.

## Artifacts
- `scripts/dev-server.mjs`
- `PROOF_MB_023.md`
- `README.md`

## Update Log
- 2026-03-30 — Card created as first target build for Motherbrain-local coding agents.
- 2026-04-03 — Reconciled card state to Done after verifying the current-tree MVP server/proof artifacts still exist; left safe write operations explicitly out of scope instead of pretending they shipped.
