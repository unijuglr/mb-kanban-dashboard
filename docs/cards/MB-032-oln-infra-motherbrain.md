# MB-032 — OLN: Infrastructure: Motherbrain (Mac Studio) Setup

Status: Done
Priority: P1 high
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Configure the production-ready ingestion infrastructure on Motherbrain (Mac Studio).

## Why It Matters
Motherbrain has the compute and storage (31TB hellastuff) to handle large-scale lore datasets. We need consistent Node/Python/Docker environments.

## Scope
- Docker setup for Neo4j and Temporal on Motherbrain.
- Node.js and Python environment management (NVM/Conda).
- Ensuring high-speed storage access for Wookieepedia dumps.

## Steps
- [ ] Implement `docker-compose.yaml` for local Motherbrain development services.
- [ ] Configure volume mounts for Neo4j and Temporal on /Volumes/hellastuff.
- [ ] Set up basic logging (to /Volumes/external-logs).

## Blockers
- MB-001 (Architecture)

## Artifacts
- `infra/motherbrain/docker-compose.yaml`
- `infra/motherbrain/setup.sh`
