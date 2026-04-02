# MB-031 — OLN: Orchestration: Temporal Worker for Ingestion Pipeline

Status: Done
Priority: P2 medium
Project: OLN
Owner: Prime Sam
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Use Temporal to orchestrate the multi-stage ingestion and resolution pipeline.

## Why It Matters
Lore ingestion is long-running and error-prone. Temporal provides the resilience and retries needed to handle large-scale Wikitext parsing and graph updates.

## Scope
- Workflow definition (Ingest -> Parse -> Resolve -> Store).
- Error handling and retry policies.
- Tracking ingestion progress for Star Wars / Wookieepedia.

## Steps
- [ ] Implement a basic Temporal Workflow for a single Wikipedia page ingestion.
- [ ] Implement a batch workflow for processing full Wookieepedia dumps.
- [ ] Create a "monitor" interface (even if CLI) for pipeline health.

## Blockers
- MB-027 (Architecture)

## Artifacts
- `src/oln/orchestration/temporal/`
- `infra/temporal/worker-config.yaml`
