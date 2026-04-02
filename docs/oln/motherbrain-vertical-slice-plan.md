# OLN Motherbrain Vertical Slice Plan

Last Updated: 2026-04-02
Owner: Prime Sam
Related cards: MB-072, MB-075

## Decision
The first OLN slice should be the smallest end-to-end path that proves Motherbrain can:
1. read a tiny local lore corpus,
2. extract entity/link structure,
3. resolve deterministic OLIDs,
4. write a minimal graph into local Neo4j, and
5. answer proof queries locally.

That means **2 sample pages, local files only, local services only, zero paid APIs, zero DTS work**.

## Why this slice
The repo already has parser, resolver, schema, and Neo4j client stubs, but the current "full ingestion" evidence is mostly simulated. The right next step is not a bigger architecture doc. It is a bounded slice that can actually be run on Motherbrain and inspected by hand.

## Vertical slice boundary

### Included
- Source corpus: `data/oln/samples/wookieepedia-test.xml`
- Pages in slice:
  - `Luke Skywalker`
  - `Tatooine`
- Parse path: `services/oln_ingestor/parser.py`
- Resolution path: `src/oln/resolution/olid_manager.py`
- Graph target: local Neo4j on Motherbrain
- Proof output: a small graph with nodes and `MENTIONS` relationships queryable through Cypher

### Explicitly excluded
- DTS / Rockler migration work
- full Wookieepedia dump
- Temporal as a hard dependency for first proof
- Firestore / any cloud document store
- paid APIs or hosted LLM calls
- franchise generalization beyond what is needed to run this sample
- production hardening, scheduling, or monitoring polish

## Smallest runnable topology on Motherbrain

### Required for the first proof
- Motherbrain host filesystem
- Python 3 runtime
- Neo4j container from `infra/motherbrain/docker-compose.yaml`

### Optional for this slice
- Temporal and Temporal UI
- Ollama / local LLM parsing
- Redis
- remote laptop access

## Proposed golden path
1. Start Neo4j locally on Motherbrain.
2. Apply `infra/neo4j/schema.cypher`.
3. Parse `data/oln/samples/wookieepedia-test.xml` into 2 entities.
4. Resolve stable OLIDs for both pages and referenced links.
5. Upsert nodes into Neo4j with these minimum properties:
   - `olid`
   - `title`
   - `type`
   - `franchise`
   - `source`
6. Create `MENTIONS` edges from page entity to linked entities.
7. Run proof queries locally and save output.

## Canonical sample corpus
Use only:
- `data/oln/samples/wookieepedia-test.xml`

Expected primary pages:
- Luke Skywalker
- Tatooine

Expected linked entities discovered from page text:
- Human
- Jedi Master
- Galactic Civil War
- Outer Rim Territories
- Arkanis sector
- Outer Rim

## Data model for the first slice

### Node label
- `:Entity`

### Minimum node properties
- `olid`: stable unique ID
- `title`: source page or link text
- `type`: infobox-derived for primary pages, `Reference` fallback for linked entities
- `franchise`: `star_wars`
- `source`: `Wookieepedia`

### Minimum relationship
- `(a:Entity)-[:MENTIONS]->(b:Entity)`

This is intentionally boring. Boring is good here. It is enough to prove the pipeline without inventing more ontology before we have a working path.

## Success criteria
The slice is done when all of the following are true on Motherbrain:

### Parse success
- sample XML parses without network access
- exactly 2 primary page entities are emitted
- emitted titles include `Luke Skywalker` and `Tatooine`

### Resolution success
- each primary page gets a stable OLID
- rerunning resolution does not create a different OLID for the same title
- alias cache persists locally in `data/oln/resolution_cache.json` or a Motherbrain-local equivalent

### Storage success
- Neo4j accepts schema file without errors
- graph contains at least 2 primary page nodes
- graph contains at least 1 `MENTIONS` relationship from `Luke Skywalker`
- rerunning the ingest is idempotent at the node identity level (`olid` uniqueness holds)

### Proof success
The following must be answerable with Cypher and return non-empty results:
1. `Luke Skywalker` node exists
2. `Tatooine` node exists
3. `Luke Skywalker` mentions `Tatooine`
4. total graph node count is >= 2
5. total `MENTIONS` edge count is >= 1

## Proof queries
Assuming Neo4j browser or `cypher-shell`:

```cypher
MATCH (e:Entity {title: 'Luke Skywalker'})
RETURN e.olid, e.title, e.type, e.source, e.franchise;
```

```cypher
MATCH (e:Entity {title: 'Tatooine'})
RETURN e.olid, e.title, e.type;
```

```cypher
MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'})
RETURN type(r) AS rel_type;
```

```cypher
MATCH (e:Entity)
RETURN count(e) AS entity_count;
```

```cypher
MATCH ()-[r:MENTIONS]->()
RETURN count(r) AS mentions_count;
```

## Implementation notes for coders

### Keep the first run deterministic
Do not add model inference to the first slice. The parser already extracts links with regex from the sample XML. Use that. The goal is runnable proof, not semantic perfection.

### Recommended ingest contract
For the first pass, an ingest script should:
- read sample XML
- call `FranchiseParser(..., franchise_key='star_wars')`
- resolve each page title through `OLIDManager`
- normalize linked entities into synthetic `Entity` nodes if needed
- merge nodes and `MENTIONS` edges into Neo4j
- print a short run summary

### Important repo reality
Current OLN components are not fully aligned:
- `scripts/prove-mb-028.py` imports `WookieepediaParser`, but the actual parser class is `FranchiseParser`
- current Neo4j client is a stub and does not execute real Cypher yet
- current MB-034 proof is simulation, not a real Motherbrain graph write

Treat MB-072 as the plan that closes those gaps with the smallest possible scope.

## Known blockers / risks
1. **Neo4j writer is stubbed**  
   A real write path must exist before this slice can be honestly marked proven.

2. **Path mismatch in infrastructure docs**  
   Current infra docs mention both `/Volumes/hellastuff` and `/Volumes/hellastuff 1`. Pick one real Motherbrain path before execution.

3. **Parser proof drift**  
   Existing proof script references an old parser name.

4. **Temporal temptation**  
   Temporal is useful later, but making it mandatory now increases moving parts without improving proof quality.

## Recommended execution order
1. Confirm Motherbrain storage path and Neo4j container startup.
2. Implement or repair the direct Neo4j write path.
3. Build one local ingest command for the 2-page XML file.
4. Run proof queries.
5. Save run output and query results as evidence.
6. Only after that, decide whether to reintroduce Temporal for orchestration.

## Definition of done for MB-072
MB-072 is done when this plan is implemented enough that another person can point to one command, one sample corpus, one local graph, and five proof queries that all succeed on Motherbrain with no cloud dependencies and no paid services.