# PROOF_OLN_FIRST_INGEST.md

## Execution
Date: 2026-04-05
Operator: Prime Sam
Host: Motherbrain

### Command
```bash
cd /Users/darthg/projects/mb-kanban-dashboard
./venv/bin/python scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

### Output
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

### Neo4j Verification (Proof Queries)

#### Luke Skywalker Entity
```
e.olid, e.title, e.type, e.source, e.franchise
"oln-star-wars-luke-skywalker", "Luke Skywalker", "Character", "Wookieepedia", "star_wars"
```

#### Mentions Relationship (Luke -> Tatooine)
```
rel_count
1
```

## Result
Successful first honest local ingest on Motherbrain. MB-075 is complete.
