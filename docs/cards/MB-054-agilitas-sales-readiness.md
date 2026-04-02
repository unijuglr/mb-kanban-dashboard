# MB-054 — Agilitas: Sales: Demo Dataset & Readiness

Status: Done
Priority: P3 low
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Finalize a set of realistic, anonymized demo data for sales presentations and functional readiness.

## Why It Matters
Agilitas needs a "Demo Mode" for potential clients that shows full capabilities (Extraction -> KPI -> Action) on safe data.

## Scope
- Synthetic transcript generation for 3 verticals (Retail, SaaS, Industrial).
- "Perfect" Action Engine responses for demo consistency.
- Pre-populated "Sales KPI" dashboard view.

## Steps
- [ ] Script synthetic transcript generation (Ollama).
- [ ] Load demo data into Agilitas Demo Tenant.
- [ ] Test end-to-end flow from file drop to action generation.

## Artifacts
- `data/demo/`
- `docs/agilitas/demo-guide.md`
