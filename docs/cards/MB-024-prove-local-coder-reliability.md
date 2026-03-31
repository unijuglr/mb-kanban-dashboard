# MB-024 — Prove Motherbrain local coder reliability

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

## Objective
Produce repeated, validated evidence that Motherbrain-local coding agents can generate and execute useful code artifacts reliably.

## Why It Matters
Without this, Motherbrain cannot be trusted as a serious agent habitat and the rest of the hive plan rests on sand.

## Scope
- collect evidence from prior local runs
- run fresh proof tasks
- require saved artifacts and validation output
- identify failure modes that prevent trust

## Out of Scope
- full production hardening of all services

## Steps
- [x] collect prior benchmark/log evidence
- [x] produce a fresh controlled proof artifact
- [ ] run at least one model-mediated local coding proof with validated saved outputs
- [ ] define standard proof protocol for future coding-agent validation
- [x] decide whether current local coding path is acceptable or needs top-priority repair work

## Current Decision
- Current local coding path is **not acceptable yet** as a trusted system.
- A live `openclaw agent --local --agent qwen-coder-bakeoff` proof attempt was run against Motherbrain and produced no files in the target directory while the invocation hung.
- Therefore local coder reliability remains a top-priority repair target.

## Blockers
- Current gateway persistence remains broken.
- Live model-mediated proof is currently failing to produce validated artifacts on demand.

## Artifacts
- `docs/motherbrain-local-agent-evidence.md`
- `docs/motherbrain-local-agent-bootstrap.md`

## Update Log
- 2026-03-30 — Card created after confirming partial historical evidence and one fresh controlled proof run.
