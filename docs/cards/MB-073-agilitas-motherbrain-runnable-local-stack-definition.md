# MB-073 — Agilitas: Motherbrain runnable local stack definition

Status: Done
Priority: P0 critical
Project: Agilitas Solutions
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Define the first runnable Agilitas local stack on Motherbrain, including transcript input, normalization, redaction, extraction, and a simple output/demo surface.

## Why It Matters
Agilitas is close to demoable, but we need a concrete local-stack target that coders can implement and verify without cloud spend.

## Scope
- define exact local services/processes
- define demo input/output flow
- define success criteria for a first local run
- identify environment requirements and blockers

## Out of Scope
- polished production UI
- cloud deployment
- enterprise hardening

## Steps
- [x] define the minimum runnable local service set
- [x] define the golden-path demo flow
- [x] specify proof artifacts for local execution
- [x] identify Motherbrain dependencies and blockers

## Outcome
Defined the smallest runnable local stack as a single-process local pipeline: normalize -> redact -> extract -> score -> recommend -> write artifact. Documented key blockers, including the current broken retail transcript fixture and Ollama endpoint mismatch risk.

## Artifacts
- `docs/agilitas/motherbrain-local-stack-plan.md`
