# OLN Neo4j on Motherbrain — Execution Tranche (2026-04-02)

Owner: Prime Sam  
Goal: get the smallest honest OLN graph proof running locally on Motherbrain with zero spend.

## Current truth
- The bounded ingest entrypoint already exists: `scripts/run_oln_local_ingest.py`
- The direct Neo4j HTTP client already exists: `src/oln/storage/neo4j_client/client.py`
- The sample corpus and runbook already exist.
- The immediate blocker is not architecture anymore.
- The immediate blocker is **Motherbrain-local service reality**: pick the real storage root, boot Neo4j cleanly, then run the 2-page ingest and save proof output.

## Smallest practical execution tranche

### Tranche 1 — make Neo4j startup deterministic on Motherbrain
1. choose actual storage root on Motherbrain (`/Volumes/hellastuff` vs `/Volumes/hellastuff 1`)
2. export `OLN_BASE_VOLUME` if needed
3. run `bash infra/motherbrain/setup.sh`
4. start only Neo4j:
   ```bash
   docker compose --env-file infra/motherbrain/oln.env -f infra/motherbrain/docker-compose.yaml up -d neo4j
   ```
5. confirm logs and schema apply

### Tranche 2 — run the 2-page ingest
1. apply schema:
   ```bash
   docker exec -i oln-neo4j cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher
   ```
2. run ingest:
   ```bash
   python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
   ```
3. verify Luke, Tatooine, node count, edge count

### Tranche 3 — save proof artifacts
1. save ingest stdout/stderr
2. save proof query output
3. record actual `OLN_BASE_VOLUME` used on Motherbrain
4. rerun ingest once for idempotence evidence

## Why this is the next right move
- It avoids Temporal entirely.
- It avoids full-dump ingestion entirely.
- It uses the repo's existing sample data and real write path.
- It gets to a truthful graph proof faster than any broader platform work.

## Immediate blockers still remaining after this repo update
1. somebody must run the Neo4j startup on Motherbrain itself
2. actual writable mount must be confirmed on the host
3. proof artifacts still need to be captured from a live Motherbrain run

## Repo-side unblock landed in this tranche
- `infra/motherbrain/docker-compose.yaml` now supports `OLN_BASE_VOLUME`
- `infra/motherbrain/setup.sh` now auto-detects the common Motherbrain volume roots and prints what it chose
- `infra/motherbrain/oln.env.example` now gives the operator one obvious env file starting point

This is deliberately boring infra glue. Boring infra glue is what gets the graph on screen.
