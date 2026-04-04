# MB-080 — OLN: create 2-page local sample corpus and executable ingest proof

Status: Done
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03
Completion Time: 2026-04-03 22:50 PDT

## Objective
Keep the bounded 2-page OLN sample/proof work durably executable in the current tree, now that MB-079 has been re-verified.

## Why It Matters
MB-080 is the handoff between repo-side OLN ingest proof and the later live Motherbrain Neo4j run. Once MB-079 was repaired, the missing MB-080 proof path needed to be rebuilt on the current tree so downstream work can rely on something real instead of stale branch history.

## Scope
- preserve the canonical 2-page sample corpus reference
- restore a current-tree executable proof script for the bounded repo-side ingest path
- save proof output as a durable committed artifact
- state clearly that live Motherbrain Neo4j proof is still downstream work

## Out of Scope
- pretending historical proof artifacts are sufficient without rerunning them on the current tree
- live Neo4j boot or ingest proof on Motherbrain
- DTS work

## Steps
- [x] Confirm `data/oln/samples/wookieepedia-test.xml` still parses exactly 2 primary pages.
- [x] Confirm the prior MB-080 proof artifacts still exist in reachable git history.
- [x] Restore `scripts/prove-mb-080.py` for the current tree.
- [x] Rerun the bounded repo-side proof against a local Neo4j-compatible fake server.
- [x] Save the observed proof output as a committed artifact.
- [x] Update durable card/task/proof state without claiming live Motherbrain runtime success.

## Current Reality
Historical MB-080 proof work still exists in reachable repo history:
- `76f0ce8` — added the original `scripts/prove-mb-080.py`, `PROOF_MB_080.md`, and card
- `a6ba36f` — updated `mb_tasks.json`
- `9b3ee58` — recorded the earlier runtime/proof completion

That old branch history is no longer the thing that matters. The current tree now again contains a rerun repo-side MB-080 proof path after MB-079 was repaired:
- `scripts/prove-mb-080.py` proves the 2-page corpus and executable ingest contract against a local Neo4j-compatible fake server
- `PROOF_MB_080.md` records the contract and honest scope
- `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json` preserves the observed proof output from this rerun

## Remaining Constraint
- MB-088 still requires a live Neo4j host, which remains separate downstream work under MB-087/MB-088

## Durable Artifacts
- `data/oln/samples/wookieepedia-test.xml`
- `scripts/prove-mb-080.py`
- `PROOF_MB_080.md`
- `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json`
- `docs/cards/MB-080-oln-two-page-local-sample-corpus-and-executable-ingest-proof.md`

## Next Real Step
Proceed to MB-087/MB-088 when a live local Neo4j host is actually available, then rerun the bounded ingest against the real host and save those outputs separately.

## Done Looks Like
The current tree contains a truthful rerun MB-080 proof path for the bounded 2-page corpus, and that proof is explicitly repo-side only rather than pretending Motherbrain runtime proof already happened.

## Update Log
- 2026-04-03 — Confirmed the earlier MB-080 proof artifacts still exist in reachable history (`76f0ce8`, `a6ba36f`, `9b3ee58`) but were not enough to claim current-tree readiness.
- 2026-04-03 — Restored `scripts/prove-mb-080.py`, reran the bounded 2-page repo-side proof, and saved the observed output to `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json`.
- 2026-04-03 — Marked MB-080 done again for repo-side proof only; live Neo4j host proof remains downstream MB-087/MB-088 work.
