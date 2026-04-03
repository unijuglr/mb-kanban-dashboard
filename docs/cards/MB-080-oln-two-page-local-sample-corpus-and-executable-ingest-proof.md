# MB-080 — OLN: create 2-page local sample corpus and executable ingest proof

Status: Blocked
Priority: P0 critical
Project: OLN
Owner: Prime Sam
Created: 2026-04-02
Last Updated: 2026-04-03

## Objective
Keep the bounded 2-page OLN sample/proof work durably documented in the current tree without pretending the executable proof is still current-tree valid.

## Why It Matters
MB-080 sits between repo-side proof prep and the live Motherbrain ingest proof. Right now the repo history contains MB-080 proof artifacts, but the current tree lost those files and MB-079 has since regressed. Treating MB-080 as ready would be fake-ready backlog shape.

## Scope
- preserve the canonical 2-page sample corpus reference
- record where the prior MB-080 proof artifacts live in reachable git history
- state clearly why MB-080 is blocked in the current tree
- point to the real next step instead of re-claiming stale proof completion

## Out of Scope
- restoring old proof artifacts as if they were still validated
- live Neo4j boot or ingest proof on Motherbrain
- DTS work

## Current Reality
Historical MB-080 proof work exists in reachable repo history:
- `76f0ce8` — added `scripts/prove-mb-080.py`, `PROOF_MB_080.md`, and the original MB-080 card
- `a6ba36f` — updated `mb_tasks.json`
- `9b3ee58` — recorded MB-080 runtime/proof completion

Those artifacts were authored before the 2026-04-03 MB-079 regression was captured. Because MB-079's current-tree proof contract is now broken, MB-080 should not be treated as executable/current until MB-079 is repaired and the MB-080 proof path is revalidated honestly.

## Blockers
- current tree is missing the old `scripts/prove-mb-080.py` and `PROOF_MB_080.md` artifacts
- MB-079 proof drift means the underlying local Neo4j write-path QA is not currently trustworthy
- MB-088 still requires a live Neo4j host, which remains blocked by MB-087 host runtime failure

## Durable Artifacts
- `data/oln/samples/wookieepedia-test.xml`
- `docs/cards/MB-080-oln-two-page-local-sample-corpus-and-executable-ingest-proof.md`
- `docs/oln/neo4j-motherbrain-live-proof-2026-04-03.md`

## Next Real Step
1. Repair and rerun `python3 scripts/prove-mb-079.py` on the current tree.
2. Recreate or revalidate the MB-080 executable proof against the repaired MB-079 contract.
3. Only then proceed to MB-087/MB-088 live Neo4j boot and ingest proof.

## Done Looks Like
The current tree again contains a truthful MB-080 proof path, and it has been rerun after the MB-079 proof contract is repaired rather than inherited from stale branch history.
