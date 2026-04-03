# MB-079 — OLN: implement real local Neo4j write path for vertical slice

Status: Blocked
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03

## Objective
Keep the OLN bounded vertical slice on a real local Neo4j write/query path, with proof that still passes on the current repo state.

## Why It Matters
MB-080, MB-087, and MB-088 all depend on MB-079 being both implemented and still QA-valid. Right now the repo history contains the MB-079 implementation, but the current proof contract is broken after later `batch_merge` changes.

## Scope
- preserve the real HTTP Neo4j transactional write path
- keep the bounded ingest entrypoint runnable
- keep the executable proof aligned with the current `Neo4jClient` contract
- capture the regression honestly in durable task/card state

## Out of Scope
- DTS work
- pretending live Neo4j proof is complete when Docker/Neo4j is unavailable
- large-scale ingest tuning beyond the bounded proof contract

## Steps
- [x] Confirm the original MB-079 implementation commit exists in reachable repo history.
- [x] Re-run `python3 scripts/prove-mb-079.py` on the current tree.
- [x] Capture the current regression honestly in repo state.
- [ ] Repair the MB-079 proof contract so current-tree QA passes again.
- [ ] Re-verify `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml` against a live Neo4j host.

## Current Blocker
`python3 scripts/prove-mb-079.py` currently fails on the current tree because `Neo4jClient.batch_merge()` was later rewritten to use chunked `UNWIND` writes and now returns `merged_entities`, while the fake proof handler still only recognizes the older per-entity `MERGE (e:Entity {olid: $olid})` request shape.

Observed on 2026-04-03:
```text
{
  "merged_primary_entities": 0,
  "entity_count_query_result": 4,
  "mentions_count_query_result": 5,
  "captured_request_count": 5,
  "auth_header_present": true,
  "schema_request_seen": true,
  "merge_requests_seen": 0
}
AssertionError
```

## Artifacts
- `src/oln/storage/neo4j_client/client.py`
- `scripts/run_oln_local_ingest.py`
- `scripts/prove-mb-079.py`
- `PROOF_MB_079.md`

## Update Log
- 2026-04-03 — Verified the original MB-079 implementation commit (`554b1dd`) is still in reachable history, but current-tree QA is regressed: `scripts/prove-mb-079.py` fails because the proof harness no longer matches the chunked `batch_merge()` request shape.
- 2026-04-03 — Marked MB-079 blocked until the proof contract is repaired and rerun honestly.
