# PROOF_MB_088: Two-Page Ingest into Local Neo4j

## Objective
Run the bounded Luke/Tatooine ingest against the live Motherbrain Neo4j instance, verify the graph contents, and rerun once for idempotence evidence.

## Execution Environment
- Host: `Motherbrain.local`
- Repo path on host: `/Users/darthg/projects/mb-kanban-dashboard`
- Python runtime used for proof: `/tmp/mb-oln-proof/bin/python`
- Reason for venv: base Motherbrain Python did not have `PyYAML`, which the parser imports.

## Run 1
Command:
```bash
/tmp/mb-oln-proof/bin/python scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

Observed output:
```json
{
  "sample": "data/oln/samples/wookieepedia-test.xml",
  "primary_pages_parsed": 2,
  "entity_nodes_present": 9,
  "mentions_relationships_present": 7,
  "primary_entities_written": 2,
  "failures": 0
}
```

## Graph Verification
Proof command:
```bash
/tmp/mb-oln-proof/bin/python scripts/prove-mb-088.py
```

Observed output:
```json
{
  "luke_found": true,
  "tatooine_found": true,
  "relationship_found": true,
  "luke_data": {
    "olid": "oln-star-wars-luke-skywalker",
    "labels": ["Entity"]
  },
  "tatooine_data": {
    "olid": "OLID:Tatooine",
    "labels": ["Entity"]
  }
}
```

Additional `cypher-shell` verification:
- `MATCH (e:Entity) RETURN count(e)` → `9`
- Luke row present as `oln-star-wars-luke-skywalker / Character / Wookieepedia / star_wars`
- Tatooine rows present as:
  - `OLID:Tatooine / LinkedEntity`
  - `oln-star-wars-tatooine / Planet`
- `MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) RETURN count(r)` → `1`
- `MATCH ()-[r:MENTIONS]->() RETURN count(r)` → `7`

## Run 2 (Idempotence Check)
Repeated command:
```bash
/tmp/mb-oln-proof/bin/python scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

Observed output remained:
```json
{
  "sample": "data/oln/samples/wookieepedia-test.xml",
  "primary_pages_parsed": 2,
  "entity_nodes_present": 9,
  "mentions_relationships_present": 7,
  "primary_entities_written": 2,
  "failures": 0
}
```

Post-rerun checks:
- `entity_count = 9`
- `mentions_count = 7`
- `luke_count = 1`
- `tatooine_count = 2`

## Status
- [x] Schema applied and queryable on live Motherbrain Neo4j.
- [x] Two-page sample ingest succeeded against the live graph.
- [x] Luke Skywalker node verified.
- [x] Tatooine node verified.
- [x] `MENTIONS` relationship verified.
- [x] Rerun stayed stable on counts.

## Evidence Artifact
- `artifacts/oln/mb-088-live-ingest-proof-2026-04-03.txt`

## Honest Notes
- The live graph proof is real and passed.
- The host Python environment still needs a durable dependency bootstrap path for `PyYAML`; the proof used a temporary venv to avoid mutating the system Python.
- There are two `Tatooine` nodes with distinct OLIDs/types. That did not break the bounded proof or rerun stability, but it is worth follow-up cleanup if canonicalization matters.
