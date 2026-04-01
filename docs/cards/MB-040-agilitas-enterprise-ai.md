# MB-040 — Agilitas: Engineering: Deterministic Scoring & Business Logic

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Implement the "Deterministic Layer" between AI Extraction and the Action Engine to calculate financial KPIs and map business outcomes.

## Why It Matters
"Intuition is not a strategy." We must strictly separate semantic AI extraction from financial math (Revenue Loss, Churn Prob, NPS Proxy) to ensure reproducibility and executive trust.

## Scope
- Deterministic calculation formulas for: Churn Probability, Revenue Loss (LTV * Churn), NPS Proxy, CSAT, Effort.
- Rule-based mapping of triggers for "Inner Loop" and "Outer Loop" resolutions.
- Escalation logic based on "Brand Promise" priority multipliers.
- Porting existing .NET logic for these calculations into the new platform architecture.

## Steps
- [ ] Port the .NET `SentimentAnalyzer` and logic to a centralized Business Engine.
- [ ] Implement the threshold-based mapping for Workflow Triggers.
- [ ] Connect computed Revenue Loss metrics to the executive reporting dashboard data layer.
- [ ] Validate deterministic consistency: same signals must yield identical financial outputs every time.

## Artifacts
- `services/agilitas-business-engine/`
- `docs/agilitas/kpi-formulas.md`
