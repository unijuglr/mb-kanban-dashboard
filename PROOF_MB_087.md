# PROOF_MB_087: Neo4j Infrastructure Startup

## Objective
Boot Neo4j on Motherbrain using `docker compose`, verify the container is actually running, and confirm schema readiness.

## Execution Results
- Host: `Motherbrain.local`
- Repo path on host: `/Users/darthg/projects/mb-kanban-dashboard`
- Container: `oln-neo4j`
- Observed status: `Up 15 hours`
- Storage roots observed on host:
  - `/Volumes/hellastuff 1/oln`
  - `/Volumes/hellastuff/oln`

## Verification
Commands used:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
docker exec -i oln-neo4j cypher-shell -u neo4j -p password "SHOW CONSTRAINTS;"
```

Observed evidence:
- `oln-neo4j` is running on Motherbrain.
- `cypher-shell` connects successfully inside the container.
- Schema constraint `entity_olid` exists.

## Status
- [x] Neo4j service is running on Motherbrain.
- [x] Container accepts local Cypher queries.
- [x] Schema readiness verified.

## Evidence Artifact
- `artifacts/oln/mb-087-neo4j-live-boot-2026-04-03.txt`

## Honest Notes
- Earlier proof text understated the verification depth; this version reflects the actual Motherbrain-side checks that were executed.
- Both `/Volumes/hellastuff/oln` and `/Volumes/hellastuff 1/oln` exist on host, so the storage-root choice should stay documented in the OLN runbooks to avoid future operator drift.
