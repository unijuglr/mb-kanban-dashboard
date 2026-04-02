# MB-086 — OLN: Neo4j Motherbrain path selection and startup hardening

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02
Completed: 2026-04-02

## Objective
Remove the repo-side ambiguity that prevents the first honest Motherbrain Neo4j boot: make the storage root selectable and the setup/startup path deterministic.

## Why It Matters
The next OLN blocker is not design. It is whether Neo4j can actually start against the real Motherbrain volume without hand-editing compose files mid-run.

## Scope
- parameterize the Motherbrain OLN storage root
- auto-detect the two known volume variants in setup
- provide one obvious env-file pattern for operators

## Out of Scope
- proving the live Motherbrain boot itself
- running the ingest
- Temporal work

## Steps
- [x] parameterize `infra/motherbrain/docker-compose.yaml` with `OLN_BASE_VOLUME`
- [x] update `infra/motherbrain/setup.sh` to auto-detect the common Motherbrain volume roots
- [x] add `infra/motherbrain/oln.env.example`
- [x] document the execution tranche this unblocks

## Artifacts
- `infra/motherbrain/docker-compose.yaml`
- `infra/motherbrain/setup.sh`
- `infra/motherbrain/oln.env.example`
- `docs/oln/neo4j-motherbrain-execution-tranche-2026-04-02.md`

## Outcome
Repo-side startup ambiguity is reduced enough that the next operator can focus on the real host proof: bring up Neo4j on Motherbrain, apply schema, and run the 2-page ingest.

## Update Log
- 2026-04-02 — Implemented env-selectable volume mounts and setup auto-detection to unblock the first local Neo4j boot.
