# MB-081 — Motherbrain: preflight and stale-process guardrails for local dev

Status: Done
Priority: P1 high
Project: Motherbrain
Owner: Coder-5
Created: 2026-04-02
Last Updated: 2026-04-02
Completed: 2026-04-02

## Objective
Reduce time waste from stale local dev processes, port conflicts, and unreliable dashboard restarts.

## Why It Matters
We have already lost too much time to stale port/process state. This should become a guardrailed workflow.

## Scope
- improve preflight checks
- improve dev server restart/start behavior
- make verification easier and more reliable

## Out of Scope
- full production deployment
- unrelated infra cleanup

## Steps
- [x] inspect current local dev scripts
- [x] add stale-process/port conflict guardrails
- [x] improve verification output for operator confidence
- [x] document proof

## Artifacts
- `scripts/check-mb-dev.sh`
- `scripts/start-mb-dev.sh`
- `PROOF_MB_081.md`
