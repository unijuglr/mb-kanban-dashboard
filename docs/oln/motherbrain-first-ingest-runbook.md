# OLN Motherbrain First Ingest Runbook

Last Updated: 2026-04-02
Owner: Prime Sam
Related cards: MB-072, MB-075

## Purpose
This runbook is the exact operator path for the **first honest local OLN ingest on Motherbrain**.

Goal: ingest the 2-page sample corpus into local Neo4j and verify the result with proof queries.

Constraints:
- local-only
- zero paid APIs
- zero DTS work
- smallest runnable path only

## Scope of this run
### Corpus
- `data/oln/samples/wookieepedia-test.xml`

### Expected primary entities
- Luke Skywalker
- Tatooine

### Expected result
A local Neo4j graph populated with at least those nodes plus link-derived references.

## Preflight
Run these checks on Motherbrain before touching the ingest.

### 1. Confirm repo and sample file exist
```bash
cd /path/to/mb-kanban-dashboard
ls data/oln/samples/wookieepedia-test.xml
```
Pass condition: file exists.

### 2. Confirm Docker is available
```bash
docker --version
docker compose version
```
Pass condition: both commands succeed.

### 3. Confirm actual Motherbrain storage mount
Pick the real mount before starting services. The repo currently contains conflicting references:
- `/Volumes/hellastuff/oln`
- `/Volumes/hellastuff 1/...`

Check what really exists:
```bash
ls /Volumes
ls '/Volumes/hellastuff' 2>/dev/null
ls '/Volumes/hellastuff 1' 2>/dev/null
```
Pass condition: one intended volume path exists and is writable.

### 4. Confirm or repair compose path assumptions
Inspect:
```bash
sed -n '1,220p' infra/motherbrain/docker-compose.yaml
sed -n '1,220p' infra/motherbrain/setup.sh
```
Pass condition: compose and setup script point at the same storage root you will actually use.

### 5. Confirm Neo4j ports are free or acceptable
```bash
lsof -i :7474
lsof -i :7687
```
Pass condition: ports are free, or the listener is the intended Neo4j instance.

## Startup sequence

### 1. Initialize host directories if needed
```bash
bash infra/motherbrain/setup.sh
```
If the storage root in `setup.sh` is wrong, fix that before running it.

### 2. Start Neo4j stack
From repo root:
```bash
docker compose -f infra/motherbrain/docker-compose.yaml up -d neo4j
```
Optional, not required for first ingest:
```bash
docker compose -f infra/motherbrain/docker-compose.yaml up -d temporal temporal-postgresql temporal-ui
```

### 3. Wait for Neo4j readiness
```bash
docker logs oln-neo4j --tail 100
```
Pass condition: logs indicate Neo4j is started and accepting connections.

### 4. Apply schema
Preferred if `cypher-shell` is available inside the container:
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher
```
Pass condition: constraint/index statements apply without fatal error.

## Ingest execution

## Current repo reality
The repo does **not** yet contain a trustworthy first-ingest command that writes real data to Neo4j. Existing pieces are close, but not fully wired:
- parser exists
- resolver exists
- Neo4j client is currently a stub
- `scripts/simulate_ingestion.py` is simulation only

So the first real ingest should be run only after a direct local ingest command/script exists.

## Required ingest command contract
The command must do all of the following:
1. parse `data/oln/samples/wookieepedia-test.xml`
2. emit 2 primary entities
3. resolve stable OLIDs locally
4. upsert nodes into Neo4j
5. create `MENTIONS` edges
6. exit non-zero on write failure
7. print counts for pages, nodes, and edges written

A reasonable target command shape is:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```

If the coder implements a differently named command, this runbook should be updated to match the actual entrypoint.

## Expected ingest summary
A successful run should print something roughly like:
- primary pages parsed: 2
- entity nodes merged: >= 2
- mentions relationships merged: >= 1
- failures: 0

## Verification
Run these immediately after ingest.

### 1. Check total entity count
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH (e:Entity) RETURN count(e) AS entity_count;"
```
Pass condition: `entity_count >= 2`

### 2. Check Luke Skywalker node
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH (e:Entity {title: 'Luke Skywalker'}) RETURN e.olid, e.title, e.type, e.source, e.franchise;"
```
Pass condition: one row returned.

### 3. Check Tatooine node
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH (e:Entity {title: 'Tatooine'}) RETURN e.olid, e.title, e.type;"
```
Pass condition: one row returned.

### 4. Check Luke -> Tatooine relationship
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) RETURN count(r) AS rel_count;"
```
Pass condition: `rel_count >= 1`

### 5. Check total MENTIONS relationships
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count;"
```
Pass condition: `mentions_count >= 1`

### 6. Check rerun idempotence
Run the ingest command a second time, then re-run the counts above.

Pass condition:
- node identity remains stable via unique `olid`
- rerun does not produce duplicate primary entities
- any count growth is explainable by newly materialized link references, not duplicate page nodes

## Evidence to save
For the first successful run, capture and commit or attach:
- ingest command used
- stdout/stderr from ingest command
- output of all five proof queries
- any updated local cache file such as `data/oln/resolution_cache.json`
- note of actual Motherbrain storage root used

## Failure handling

### Failure: Docker or Neo4j will not start
Check:
```bash
docker ps -a
docker logs oln-neo4j --tail 200
```
Likely causes:
- wrong storage mount path
- permissions on `/Volumes/.../oln`
- port collision

### Failure: Schema load fails
Check whether Neo4j already has the constraint/index. `IF NOT EXISTS` should make reruns safe, so repeated failure usually means auth or connectivity is wrong.

### Failure: Parser emits nothing
Check the sample file path and parser entrypoint. The current parser class is `FranchiseParser`, not `WookieepediaParser`.

### Failure: Nodes do not appear in Neo4j
Most likely cause: the write path is still stubbed. Do not paper over this with simulation output.

### Failure: Relationship query returns zero
Check whether link-derived entities are being normalized into nodes before edge creation.

## Rollback / cleanup
If the run poisoned the graph and you need to reset the tiny test slice:
```bash
docker exec -i oln-neo4j cypher-shell -u neo4j -p password \
  "MATCH (n:Entity) DETACH DELETE n;"
```
Use with care. This is acceptable only for the local sample graph.

## Done criteria for MB-075
MB-075 is done when a coder can run this runbook on Motherbrain and produce:
- a real local Neo4j graph,
- successful proof query output,
- evidence of stable rerun behavior,
- no paid services,
- no cloud dependencies,
- no DTS work.

If any step still relies on simulation, MB-075 is not done yet. That is the whole point of writing the runbook this way.