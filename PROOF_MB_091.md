# PROOF_MB_091 — OLN bulk ingestion harness (50+ pages)

## Objective
Build and verify a bulk OLN ingestion harness that can drive 50+ Wookieepedia pages through the existing parser and real Neo4j write path.

## What landed
- Added `scripts/run_bulk_ingest.py`
- Upgraded `src/oln/storage/neo4j_client/client.py` so `batch_merge()` performs chunked `UNWIND` writes instead of one HTTP write per primary entity
- Generated a 60-page Wookieepedia subset corpus at `data/oln/samples/wookieepedia-bulk-subset.xml`
- Saved verification output at:
  - `data/oln/bulk_ingest_summary.json`
  - `data/oln/bulk_ingest_summary_rerun.json`

## Verification command
```bash
python3 scripts/run_bulk_ingest.py \
  --sample data/oln/samples/wookieepedia-bulk-subset.xml \
  --batch-size 20 \
  --summary-out data/oln/bulk_ingest_summary.json
```

## Verification results
### First run
```json
{
  "sample": "data/oln/samples/wookieepedia-bulk-subset.xml",
  "primary_pages_parsed": 60,
  "primary_entities_written": 60,
  "entity_nodes_present": 16012,
  "mentions_relationships_present": 47079,
  "primary_links_processed": 47085,
  "batch_size": 20,
  "batch_count": 3,
  "parse_seconds": 0.1173,
  "write_seconds": 4.0356,
  "total_seconds": 4.4018,
  "primary_entities_per_second": 13.63,
  "failures": 0
}
```

### Rerun / idempotence check
```json
{
  "sample": "data/oln/samples/wookieepedia-bulk-subset.xml",
  "primary_pages_parsed": 60,
  "primary_entities_written": 60,
  "entity_nodes_present": 16012,
  "mentions_relationships_present": 47079,
  "primary_links_processed": 47085,
  "batch_size": 20,
  "batch_count": 3,
  "parse_seconds": 0.1009,
  "write_seconds": 1.181,
  "total_seconds": 1.3903,
  "primary_entities_per_second": 43.15,
  "failures": 0
}
```

## Notes
- Verification used a real local Neo4j container started from the repo's OLN compose stack and the real HTTP transactional write client.
- The 60-page corpus was sourced from live Wookieepedia MediaWiki page content and serialized into a MediaWiki XML subset so the harness runs against dump-compatible input.
- The rerun kept node and relationship counts stable, which is the important idempotence signal here.
