# MB-052 — Agilitas: UI: Adaptation from poc-ui & CMS

Status: Ready
Priority: P2 medium
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Reuse and adapt existing UI prototypes (`poc-ui`, `poc-ui2`, `cms`, `evaluator`) for the Agilitas dashboard.

## Why It Matters
Agilitas needs a unified front-end for visualization and manual extraction review. Reusing code saves development time and maintains consistency.

## Scope
- Port "Signal View" from `poc-ui` (React).
- Integrate "KPI Dashboard" components.
- Review/Edit workflow for extracted signals (Agilitas CMS).

## Steps
- [ ] Collate UI components into `services/agilitas-ui/`.
- [ ] Migrate React hooks for signal fetching.
- [ ] Implement local/GCP toggle in UI (Display current model/cost).

## Artifacts
- `services/agilitas-ui/`
- `services/agilitas-ui/src/components/agilitas/`
