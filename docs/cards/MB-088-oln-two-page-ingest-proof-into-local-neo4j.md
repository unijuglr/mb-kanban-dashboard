# MB-088 — OLN: two-page ingest proof into local Neo4j

Status: Blocked
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
- MB-087 remained blocked on 2026-04-03 because Motherbrain Docker was unavailable
- without a live Neo4j instance, schema apply, ingest, proof queries, and idempotence rerun could not proceed honestly

## Artifacts
- `scripts/run_oln_local_ingest.py`
- `docs/oln/motherbrain-first-ingest-runbook.md`
- `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`
- `docs/oln/mb-079-080-087-088-overnight-qa-2026-04-03.md`

## Update Log
- 2026-04-03 — Live ingest proof could not proceed because MB-087 failed at host startup. Durable blocker evidence and rerun instructions captured in `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`.
- 2026-04-03 — Overnight QA confirmed the ingest entrypoint still fails honestly when Neo4j is unreachable, which is the right non-simulated behavior while MB-087 remains blocked.

## Next Executable Step
After MB-087 is genuinely cleared on a live Motherbrain host, run `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml` twice, then capture Luke / Tatooine / node-count / relationship-count query outputs as committed evidence.

## Done Looks Like
One command produces a real local graph on Motherbrain, proof queries succeed, and the evidence is committed instead of living in someone's scrollback.
