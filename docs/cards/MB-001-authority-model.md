# MB-001 — Decide Motherbrain authority model

Status: Done
Priority: P0 critical
Owner: Adam + Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

## Objective
Decide canonical roles of laptop vs Motherbrain for gateway, workspace, durable memory, and compute.

## Why It Matters
Without this, the system keeps split-brain tendencies and architectural ambiguity.

## Scope
- laptop control-plane role
- Motherbrain backend role
- authoritative workspace/storage direction
- authoritative memory direction

## Out of Scope
- final service migration execution

## Steps
- [ ] document current split-brain state
- [ ] propose recommended authority model
- [ ] record decision in decision log
- [ ] map follow-up tasks created by the decision

## Blockers
- Needs explicit decision.

## Artifacts
- `docs/motherbrain-architecture.md`
- future decision record

## Update Log
- 2026-03-30 — Card created from initial audit.
