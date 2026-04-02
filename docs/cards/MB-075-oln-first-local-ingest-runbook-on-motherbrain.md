# MB-075 — OLN: first local ingest runbook on Motherbrain

Status: Done
Priority: P1 high
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Write the exact runbook for the first OLN local ingest on Motherbrain so coders can execute against a bounded target.

## Why It Matters
A dev system is only real if someone can run it in a repeatable way.

## Scope
- preflight checks
- startup sequence
- ingest command path
- validation queries
- expected artifacts/logs

## Out of Scope
- ongoing ops automation
- large-scale scheduling

## Steps
- [x] define preflight checks
- [x] define startup and run sequence
- [x] define verification steps
- [x] define rollback/failure notes

## Artifacts
- `docs/oln/motherbrain-first-ingest-runbook.md`

## Completion Notes
- Wrote an operator-style runbook for the first honest local OLN ingest on Motherbrain.
- Included explicit preflight, startup, schema load, proof queries, rerun/idempotence checks, and cleanup steps.
- Called out the current gap between simulated ingest artifacts and a real Neo4j write path so execution does not rely on fiction.
