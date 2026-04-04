# MB-079 — OLN: implement real local Neo4j write path for vertical slice

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-04

## Objective
Keep the OLN bounded vertical slice on a real local Neo4j write/query path, with executable proof that still passes on the current repo state.

## Why It Matters
MB-080, MB-087, and MB-088 depend on MB-079 being both implemented and QA-valid. This card is about the real write-path implementation and proof contract, not about whether the local Neo4j environment is currently booted.

## Scope
- preserve the real HTTP Neo4j transactional write path
- keep the bounded ingest entrypoint runnable
- keep the executable proof aligned with the current `Neo4jClient` contract
- capture durable state honestly

## Out of Scope
- DTS work
- claiming live Neo4j proof is complete when Neo4j is unavailable
- large-scale ingest tuning beyond the bounded proof contract

## Steps
- [x] Confirm the real Neo4j write/query implementation is present on the current repo state.
- [x] Re-run `python3 scripts/prove-mb-079.py` on the reconciled branch.
- [x] Verify the proof harness matches the current chunked `batch_merge()` contract.
- [x] Re-run `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml` and capture the honest environment result.
- [x] Update durable state and proof docs.

## Evidence
- `python3 scripts/prove-mb-079.py` passes on the reconciled branch.
- `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml` attempts a real Neo4j write and fails honestly with connection refused when local Neo4j is unavailable.

## Notes
MB-079 is complete because the implementation and executable proof contract are in place and verified.

Live Neo4j boot and live two-page ingest proof remain downstream environment work on:
- MB-087 — first live Neo4j boot on Motherbrain
- MB-088 — two-page ingest proof into local Neo4j

## Update Log
- 2026-04-04 — Reconciled MB-079 onto a clean branch from `origin/main`, re-ran the proof harness successfully, and confirmed the live ingest path still fails honestly when `127.0.0.1:7474` is unavailable.
