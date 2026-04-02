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

## Current Status (2026-04-01 19:40 PT)
- Wave 1 functionality complete (Board, Metrics, Decisions, Updates, Writes).
- MB-060 (E2E QA) and MB-061 (Cleanup) are functionally complete.
- Branch `sam/mb-wave-20260331-commit` is current and pushed to origin.
- Next primary action: MB-062 (GitHub Push Preparation).

## Next focus
- MB-062
- Wave 2 Planning (Agilitas, HellaThis, Ai-Bitz execution)
