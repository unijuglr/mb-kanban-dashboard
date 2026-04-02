# MB-080 — OLN: create 2-page local sample corpus and executable ingest proof

Status: Done
Priority: P0 critical
Project: OLN
Owner: Coder-4
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Lock the bounded OLN vertical slice to a real 2-page local corpus and provide an executable proof command that validates the ingest path honestly.

## Why It Matters
Before the live Motherbrain graph proof, the repo needs one stable sample corpus and one repeatable proof command that shows what is implemented versus what is still environment-blocked.

## Scope
- confirm the local 2-page Wookieepedia sample corpus
- provide an executable MB-080 proof script
- validate parse titles and ingest behavior through a local Neo4j-compatible contract test
- attempt a live local Neo4j probe and report success or blockage honestly
- capture proof in committed markdown

## Out of Scope
- booting Neo4j on Motherbrain
- marking the live graph proof complete without a reachable database
- DTS or Rockler work

## Steps
- [x] confirm `data/oln/samples/wookieepedia-test.xml` contains exactly 2 primary pages
- [x] add `scripts/prove-mb-080.py`
- [x] verify parse output includes `Luke Skywalker` and `Tatooine`
- [x] verify offline executable proof covers schema + merge + proof-query contract
- [x] attempt live local Neo4j probe and report real result
- [x] commit proof markdown

## Artifacts
- `data/oln/samples/wookieepedia-test.xml`
- `scripts/prove-mb-080.py`
- `PROOF_MB_080.md`

## Notes
This card is done for repo-side proof preparation only. The follow-on live graph proof remains MB-088 and depends on a reachable local Neo4j instance.

## Done Looks Like
Another operator can run one command, see the 2-page corpus parsed, see the ingest/write/query contract exercised locally, and also see whether live Neo4j is actually reachable instead of being told a comforting lie.
