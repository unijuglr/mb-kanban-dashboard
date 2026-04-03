# PROOF_MB_079 — OLN real local Neo4j write path for vertical slice

## What changed
Implemented the remaining OLN Neo4j stub as a real networked write/query path for the bounded Motherbrain vertical slice.

### Files
- `src/oln/storage/neo4j_client/client.py`
- `src/oln/demo/swln-api/api.py`
- `scripts/run_oln_local_ingest.py`
- `scripts/prove-mb-079.py`

## Implementation summary
### 1. Real Neo4j write path
`Neo4jClient` now:
- talks to Neo4j over the HTTP transactional endpoint (`/db/<database>/tx/commit`)
- uses Basic Auth
- creates schema with `IF NOT EXISTS`
- executes real Cypher for:
  - connectivity checks
  - schema creation
  - entity upserts
  - `MENTIONS` edge creation
  - proof queries

### 2. Bounded ingest entrypoint
Added:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

This path:
1. parses the local sample XML
2. resolves stable OLIDs through `OLIDManager`
3. writes primary entities into Neo4j
4. materializes linked entities as graph nodes
5. creates `MENTIONS` relationships
6. exits non-zero on write/connectivity failure
7. prints a JSON summary

### 3. Demo API now honors live graph when available
`SWLNApi` now attempts live Neo4j query mode first and only falls back to simulation if connectivity fails.

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
- the OLN client is no longer a print-only stub
- the client performs authenticated HTTP calls to a Neo4j-compatible transactional endpoint
- schema creation statements are sent
- the current chunked `UNWIND $entities` batch merge Cypher is sent, not the old per-entity merge shape
- the batch payload includes the two parsed primary entities and their normalized link sets
- proof query Cypher is sent and parsed back into rows

### B. Live local ingest attempt
Command:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

Observed result:
- failed non-zero, as intended, because local Neo4j was not reachable at `http://127.0.0.1:7474`
- error ended at:
```text
RuntimeError: Neo4j connection failed for http://127.0.0.1:7474/db/neo4j/tx/commit: <urlopen error [Errno 61] Connection refused>
```

What this proves:
- the path is now attempting a real local Neo4j write
- the command no longer papers over missing infrastructure with simulation output
- failure mode is honest and operator-visible, matching the runbook requirement

## Proof-query support
The implemented client supports the runbook query class directly via `client.query(...)`, including:
- `MATCH (e:Entity) RETURN count(e) AS entity_count`
- `MATCH (e:Entity {title: 'Luke Skywalker'}) ...`
- `MATCH (e:Entity {title: 'Tatooine'}) ...`
- `MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) ...`
- `MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count`

## Honest status
Implementation is done, and the executable current-tree proof is passing again.

Live end-to-end proof against a running local Neo4j instance is still environment-blocked on this machine because Neo4j/Docker was not available during execution:
- Docker daemon unavailable
- `127.0.0.1:7474` refused connection

That remaining host/runtime gap is tracked under MB-087 and MB-088. MB-079 itself is now safe to treat as done again because its repo-side proof contract has been repaired and rerun honestly.

## Next operator step on a machine with Neo4j running
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```
Then run the MB-075 proof queries from `docs/oln/motherbrain-first-ingest-runbook.md`.
