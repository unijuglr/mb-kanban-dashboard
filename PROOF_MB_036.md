# PROOF_MB_036 — Incremental Updates & Delta Ingestion

## Status: Verified ✅
Date: 2026-04-02
Owner: MB-Sam
Project: Motherbrain

## Proof of Implementation
The `DeltaParser` successfully handles incremental updates from Wikitext XML dumps by tracking revision IDs and timestamps.

### Verification Run
Executed `PYTHONPATH=. python3 scripts/prove-mb-036.py` which performed the following:
1.  **Phase 1: Initial Ingestion (v1)** — Ingested "Luke Skywalker" (rev 1001) and "Han Solo" (rev 1002).
2.  **Phase 2: Incremental Ingestion (v2)** — Re-ingested "Luke Skywalker" because rev 1003 > 1001. Ingested "Leia Organa" (new). Skipped "Han Solo" because rev 1002 == 1002.

### Results
```
--- Phase 1: Initial Ingestion (v1) ---
Ingested 2 entities.
 - Luke Skywalker (rev 1001)
 - Han Solo (rev 1002)
State after v1: 2 pages tracked.

--- Phase 2: Incremental Ingestion (v2) ---
Ingested 2 entities (deltas).
 - Luke Skywalker (rev 1003)
 - Leia Organa (rev 1004)

✅ PASS: Luke and Leia ingested, Han skipped as expected.
```

### Artifacts
- `services/oln_ingestor/delta_parser.py`: The core delta logic.
- `scripts/prove-mb-036.py`: Automated verification script.
- `services/oln_ingestor/test_wiki_v1.xml` & `v2.xml`: Test data for simulation.
- `services/oln_ingestor/test_state.json`: Local persistence for revision tracking.
