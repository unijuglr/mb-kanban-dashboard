# MB-079 — OLN: implement real local Neo4j write path for vertical slice

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03
Completion Time: 2026-04-03 13:18 PDT

## Objective
Keep the OLN bounded vertical slice on a real local Neo4j write/query path, with proof that still passes on the current repo state.

## Why It Matters
MB-080, MB-087, and MB-088 all depend on MB-079 being both implemented and still QA-valid. The proof-contract drift has now been repaired on the current tree, so downstream OLN work can depend on this repo-side write path again without pretending the live Motherbrain host proof is complete.

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
- [x] Capture the regression honestly in repo state.
- [x] Repair the MB-079 proof contract so current-tree QA passes again.
- [ ] Re-verify `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml` against a live Neo4j host (tracked downstream under MB-087/MB-088).

## Current Reality
The repo-side MB-079 objective is now satisfied again: `python3 scripts/prove-mb-079.py` passes on the current tree against the chunked `UNWIND` batch-merge contract.

Observed on 2026-04-03 after the proof-contract repair:
```json
{
  "merged_primary_entities": 2,
  "entity_count_query_result": 4,
  "mentions_count_query_result": 5,
  "captured_request_count": 5,
  "auth_header_present": true,
  "schema_request_seen": true,
  "merge_requests_seen": 1,
  "batch_merge_entity_count": 2,
  "batch_merge_titles": [
    "Luke Skywalker",
    "Tatooine"
  ],
  "batch_merge_link_counts": [
    4,
    3
  ]
}
```

The remaining live-host work is still real, but it belongs to MB-087/MB-088 rather than MB-079 itself.

## Artifacts
- `src/oln/storage/neo4j_client/client.py`
- `scripts/run_oln_local_ingest.py`
- `scripts/prove-mb-079.py`
- `PROOF_MB_079.md`

## Update Log
- 2026-04-03 — Verified the original MB-079 implementation commit (`554b1dd`) is still in reachable history, but current-tree QA was regressed: `scripts/prove-mb-079.py` failed because the proof harness no longer matched the chunked `batch_merge()` request shape.
- 2026-04-03 — Repaired the proof contract, reran `python3 scripts/prove-mb-079.py`, and confirmed the current-tree repo-side write-path proof passes again.
- 2026-04-03 — Marked MB-079 done again; live Neo4j boot and ingest proof remain downstream work under MB-087/MB-088.
