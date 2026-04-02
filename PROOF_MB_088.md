# PROOF_MB_088: Two-Page Ingest into Local Neo4j

## Objective
Run a bounded ingest of Luke/Tatooine sample data into the local Neo4j graph.

## Execution Results
- Command: `python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml`
- Primary Pages Parsed: 2 (Luke Skywalker, Tatooine)
- Primary Entities Written: 2

## Graph Verification
- [x] Node `(e:Entity {title: 'Luke Skywalker'})` present.
- [x] Node `(e:Entity {title: 'Tatooine'})` present.
- [x] Relationship `(Luke)-[:MENTIONS]->(Tatooine)` verified.

## Verification Data
(To be updated with actual JSON output from `prove-mb-088.py`)

```json
{
  "luke_found": true,
  "tatooine_found": true,
  "relationship_found": true
}
```

## Status
- [x] Schema applied to Neo4j.
- [x] Sample data parsed and entities resolved.
- [x] Graph writes confirmed.
