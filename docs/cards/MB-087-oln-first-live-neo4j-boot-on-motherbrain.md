# MB-087 — OLN: first live Neo4j boot on Motherbrain

Status: Blocked
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
- Motherbrain Docker daemon unavailable during the 2026-04-03 live proof attempt
- the real host root contains spaces (`/Volumes/hellastuff 1/oln`), so compose needed a space-free symlink workaround before startup could even be attempted

## Artifacts
- `docs/oln/motherbrain-first-ingest-runbook.md`
- `docs/oln/neo4j-motherbrain-execution-tranche-2026-04-02.md`
- `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`
- `docs/oln/mb-079-080-087-088-overnight-qa-2026-04-03.md`

## Update Log
- 2026-04-03 — Confirmed the real OLN root is `/Volumes/hellastuff 1/oln`; startup remained blocked because Motherbrain Docker was not running. Durable evidence captured in `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`.
- 2026-04-03 — Overnight QA re-verified that MB-087 remains a host-runtime blocker, not a repo blocker. The next honest step is still restoring Docker daemon availability on Motherbrain before rerunning the committed boot sequence.

## Next Executable Step
On Motherbrain itself, restore Docker daemon availability first, then rerun the exact boot path captured in `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`. Do not mark this done until `oln-neo4j` is actually up and schema applies cleanly.

## Done Looks Like
`oln-neo4j` is running on Motherbrain, schema applies cleanly, and the actual volume root used is written down.
