# MB-088 — OLN: two-page ingest proof into local Neo4j

Status: Ready
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-02

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
- MB-087 must be completed first

## Artifacts
- `scripts/run_oln_local_ingest.py`
- `docs/oln/motherbrain-first-ingest-runbook.md`

## Done Looks Like
One command produces a real local graph on Motherbrain, proof queries succeed, and the evidence is committed instead of living in someone's scrollback.
