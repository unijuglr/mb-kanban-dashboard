# PROOF_MB_079 — OLN real local Neo4j write path for vertical slice

## What changed
Reconciled MB-079 onto the current repo state and re-verified that the OLN Neo4j client still uses a real HTTP write/query path instead of simulation.

### Files
- `src/oln/storage/neo4j_client/client.py`
- `src/oln/demo/swln-api/api.py`
- `scripts/run_oln_local_ingest.py`
- `scripts/prove-mb-079.py`
- `docs/cards/MB-079-oln-real-local-neo4j-write-path-for-vertical-slice.md`

## Implementation summary
### 1. Real Neo4j write path remains intact
`Neo4jClient`:
- talks to Neo4j over the HTTP transactional endpoint (`/db/<database>/tx/commit`)
- uses Basic Auth
- creates schema with `IF NOT EXISTS`
- executes real Cypher for connectivity checks, schema creation, entity upserts, `MENTIONS` edges, and proof queries

### 2. Bounded ingest entrypoint remains honest
The bounded local ingest path is still:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

This path parses the sample XML, resolves OLIDs, attempts real Neo4j writes, and exits non-zero when Neo4j is unavailable instead of fabricating success.

### 3. Proof harness matches the current batch-merge contract
`scripts/prove-mb-079.py` now validates the current chunked `UNWIND $entities` merge shape and confirms the expected payload contents for the two-page sample.

## Evidence
### A. Executable contract proof for the real write path
Command:
```bash
python3 scripts/prove-mb-079.py
```

Observed output:
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

What this proves:
- the OLN client is not a print-only stub
- the client performs authenticated HTTP calls to a Neo4j-compatible transactional endpoint
- schema creation statements are sent
- the current chunked `UNWIND $entities` batch-merge Cypher is sent and parsed correctly
- the payload contains the two parsed primary entities and their normalized link sets
- proof-query Cypher is sent and parsed back into rows

### B. Live local ingest attempt
Command:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

Observed result:
- exited non-zero because local Neo4j was not reachable at `http://127.0.0.1:7474`
- error ended at:
```text
RuntimeError: Neo4j connection failed for http://127.0.0.1:7474/db/neo4j/tx/commit: <urlopen error [Errno 61] Connection refused>
```

What this proves:
- the path is attempting a real local Neo4j write
- the command no longer papers over missing infrastructure with simulation output
- the failure mode is honest and operator-visible

## Honest status
MB-079 is done as an implementation/proof-contract card.

The remaining live-environment work is downstream:
- **MB-087**: bring up live local Neo4j on Motherbrain
- **MB-088**: run the two-page ingest and capture real graph proof

Those cards remain blocked by environment/runtime availability, not by missing MB-079 code.
