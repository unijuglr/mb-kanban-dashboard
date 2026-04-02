# MB-051 — Agilitas: Deployment: Motherbrain Local Environment Setup

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Set up the Agilitas Platform services as a cohesive local stack on Motherbrain.

## Why It Matters
Local development and cost-free execution require Agilitas to run fully on Motherbrain. This handles data sovereignty and testing without cloud spend.

## Scope
- Docker Compose for Agilitas Core, Business, and UI.
- Ollama service integration (Motherbrain's GPU access).
- Local persistent storage (Postgres/Neo4j) on Motherbrain volumes.

## Steps
- [ ] Write `projects/agilitas/docker-compose.yml`.
- [ ] Configure Motherbrain network access (Gateway).
- [ ] Implement Motherbrain-specific environment configs (Model URLs, Local DB).

## Artifacts
- `projects/agilitas/docker-compose.yml`
- `docs/agilitas/motherbrain-setup.md`
