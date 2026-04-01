# MB-053 — Agilitas: Engineering: Observability & Token-Cost Controls

Status: Ready
Priority: P2 medium
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Implement centralized logging and cost-tracking for all Agilitas LLM and cloud service calls.

## Why It Matters
Adam's constraint: Minimize cost. Token usage monitoring (especially on GCP/Gemini) ensures no budget overruns.

## Scope
- Token counting middleware (Tiktoken/GCP native).
- Cost dashboard per project/client.
- Alerts for high-spend thresholds.

## Steps
- [ ] Implement `services/agilitas-common/cost-logger.py`.
- [ ] Log token counts to local DB (Motherbrain) or Cloud Logging (GCP).
- [ ] Create simple JSON report of usage per extraction run.

## Artifacts
- `services/agilitas-common/cost-logger.py`
- `docs/agilitas/cost-monitoring.md`
