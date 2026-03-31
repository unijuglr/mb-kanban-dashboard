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

## Initial focus
- MB-010
- MB-011
- MB-012
- then MB-021
