# MB-088 — OLN: two-page ingest proof into local Neo4j

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03

## Objective
Run the bounded 2-page OLN ingest into the live Motherbrain Neo4j instance and capture proof artifacts.

## Why It Matters
This is the actual graph proof. Without this, we still do not know whether Luke and Tatooine can make it from sample XML into a local graph honestly.

## Scope
- run the sample ingest against local Neo4j
- verify Luke, Tatooine, node count, and edge count
- rerun once for idempotence evidence
- save command output and query results

## Out of Scope
- full dump ingestion
- ontology expansion
- Temporal orchestration
- DTS work

## Steps
- [ ] run `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml`
- [ ] verify `MATCH (e:Entity) RETURN count(e)` is >= 2
- [ ] verify Luke Skywalker node exists
- [ ] verify Tatooine node exists
- [ ] verify at least one `MENTIONS` relationship exists from Luke Skywalker
- [ ] rerun the ingest once and verify unique `olid` identity holds
- [ ] save proof output under a committed evidence artifact

## Blockers
- none for the completed proof run; follow-up reproducibility work remains for Python dependency bootstrap on Motherbrain

## Artifacts
- `scripts/run_oln_local_ingest.py`
- `docs/oln/motherbrain-first-ingest-runbook.md`

## Done Looks Like
One command produces a real local graph on Motherbrain, proof queries succeed, and the evidence is committed instead of living in someone's scrollback.

## Completion Notes (2026-04-03)
- Executed the live ingest on Motherbrain against the running `oln-neo4j` container.
- Verified Luke Skywalker, Tatooine, and a Luke→Tatooine `MENTIONS` relationship.
- Re-ran the ingest and confirmed stable counts (`entity_count=9`, `mentions_count=7`).
- Saved raw proof output to `artifacts/oln/mb-088-live-ingest-proof-2026-04-03.txt`.
- See `PROOF_MB_088.md` for the finalized proof summary.
