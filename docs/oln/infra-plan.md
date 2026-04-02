# OLN Infrastructure Plan: Motherbrain (Mac Studio) Setup

## Deployment Environment
- **Host**: `motherbrain.local` (10.0.0.69)
- **User**: `darthg`
- **Volume**: `/Volumes/hellastuff 1` (RAID)
- **Log Path**: `/Volumes/external-logs/oln`

## Services (Proposed)
1. **Neo4j**: Graph database for OLN entity/relation storage.
2. **Temporal**: Workflow orchestration for reliable ingestion.
3. **Redis**: Cache for the resolver and ingestion queue.

## Path Layout
- `/Volumes/hellastuff 1/oln/neo4j/data`
- `/Volumes/hellastuff 1/oln/neo4j/logs`
- `/Volumes/hellastuff 1/oln/temporal/data`
- `/Volumes/hellastuff 1/oln/temporal/logs`
- `/Volumes/hellastuff 1/oln/redis/data`

## Configuration
Use `docker-compose` to manage services. 
Ensure non-root user `darthg` has permissions or is in the `docker` group on Motherbrain.

## Next Steps
- [ ] Create `docker-compose.yaml` for services.
- [ ] Implement `setup.sh` to initialize directories on `/Volumes/hellastuff 1`.
- [ ] Verify connectivity from Laptop to Motherbrain services.
