# MB-Sam Runtime

## Mission
Operate the MB workstream without requiring Prime Sam to manually decide every next step.

## Inputs
- `mb_tasks.json`
- `docs/metrics-baseline.md`
- repo working tree
- proof files

## Required loop
1. read task state
2. identify ready tasks whose dependencies are done
3. assign only unowned/ready work
4. require artifact + proof for completion
5. update task state
6. recommend next work

## Completion rule
A task is not done unless:
- artifact exists
- proof file exists
- task state updated

## Current Status (2026-04-02 03:00 PT)
- Wave 1 functionality complete (Board, Metrics, Decisions, Updates, Writes).
- MB-060 (E2E QA) and MB-061 (Cleanup) are functionally complete.
- MB-062 (GitHub Push Prep) completed.
- MB-063 (Agilitas Containerization) completed; merged to `feat/mb-032-oln-infra-re-verify`.
- Wave 2 OLN/Agilitas core components (Resolution, Neo4j, Parser) re-verified with new tests.
- Re-verified MB-032 (Decisions UI) and MB-030 (Neo4j OLN) with standalone proofs.
- Next primary action: Wave 2 Infrastructure Deployment (MB-032) on Motherbrain.

## Next focus
- MB-032 (Infrastructure Motherbrain)
- Wave 2 Planning (Agilitas, HellaThis, Ai-Bitz execution)
