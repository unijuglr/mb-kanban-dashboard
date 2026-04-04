# MB-087 — OLN: first live Neo4j boot on Motherbrain

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03

## Objective
Actually start the local Neo4j container on Motherbrain against the chosen OLN storage root and verify that it accepts connections.

## Why It Matters
Until Neo4j is live on Motherbrain, the OLN graph proof is still mostly paperwork.

## Scope
- choose and record the real Motherbrain volume root
- run setup
- start only Neo4j
- verify logs, auth, and schema application

## Out of Scope
- full OLN ingest proof
- Temporal startup
- larger platform hardening

## Steps
- [ ] confirm whether Motherbrain should use `/Volumes/hellastuff/oln` or `/Volumes/hellastuff 1/oln`
- [ ] create `infra/motherbrain/oln.env` from the example if override is needed
- [ ] run `bash infra/motherbrain/setup.sh`
- [ ] run `docker compose --env-file infra/motherbrain/oln.env -f infra/motherbrain/docker-compose.yaml up -d neo4j`
- [ ] verify `oln-neo4j` logs show readiness
- [ ] apply `infra/neo4j/schema.cypher` successfully

## Blockers
- access to Motherbrain host
- Docker/compose health on Motherbrain
- writable selected volume root

## Artifacts
- `docs/oln/motherbrain-first-ingest-runbook.md`
- `docs/oln/neo4j-motherbrain-execution-tranche-2026-04-02.md`

## Done Looks Like
`oln-neo4j` is running on Motherbrain, schema applies cleanly, and the actual volume root used is written down.

## Completion Notes (2026-04-03)
- `oln-neo4j` was verified running on Motherbrain.
- `cypher-shell` connectivity succeeded inside the container.
- Schema readiness was confirmed via the `entity_olid` constraint.
- Raw execution notes were saved to `artifacts/oln/mb-087-neo4j-live-boot-2026-04-03.txt`.
- See `PROOF_MB_087.md` for the finalized proof summary.
