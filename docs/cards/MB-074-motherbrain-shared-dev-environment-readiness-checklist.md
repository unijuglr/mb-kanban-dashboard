# MB-074 — Motherbrain: shared dev environment readiness checklist

Status: Done
Priority: P1 high
Project: Motherbrain
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02
Completed: 2026-04-02

## Objective
Create one shared readiness checklist for the OLN and Agilitas dev environments on Motherbrain.

## Why It Matters
Both workstreams depend on the same underlying machine reality: storage, Docker/service health, model access, paths, and persistence.

## Scope
- Docker and service readiness
- storage paths and mounts
- local model/runtime access
- logging, health checks, and known blockers

## Out of Scope
- implementing all fixes
- production security hardening

## Steps
- [x] inventory shared dependencies
- [x] identify current blockers and risk level
- [x] define a minimal readiness checklist for coder handoff
- [x] note what is optional vs required for first local dev runs

## Artifacts
- `docs/motherbrain/dev-readiness-checklist.md`

## Outcome
Created a concise shared Motherbrain dev-readiness checklist covering Docker, storage, model access, logs, healthchecks, and immediate blockers for both OLN and Agilitas.
