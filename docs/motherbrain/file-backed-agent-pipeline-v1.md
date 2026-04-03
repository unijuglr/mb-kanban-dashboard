# Motherbrain File-Backed Agent Pipeline v1

Date: 2026-04-03  
Task: MB-026  
Status: design artifact ready for implementation

## Goal

Provide a durable, auditable planner → coder → QA → devops pipeline that does not depend on the embedded OpenClaw local coder being trustworthy.

## Design Principles

- filesystem is the queue and audit log
- every stage transition is explicit
- every task carries its own validation contract
- hangs are failures with artifacts, not invisible losses
- runners may be swapped later without changing the task format

## Directory Layout

```text
motherbrain-pipeline/
  inbox/
  claimed/
  qa/
  integrate/
  done/
  failed/
  logs/
  templates/
```

## Task Lifecycle

1. Planner writes task JSON to `inbox/`
2. Coder runner atomically moves it to `claimed/`
3. Coder writes outputs and a run manifest under `logs/<task-id>/`
4. If coder self-check passes, task moves to `qa/`
5. QA runner validates outputs against the declared contract
6. If QA passes and no integration work remains, move task to `done/`
7. Otherwise move to `integrate/` or `failed/`

## Task Schema v1

```json
{
  "schema_version": 1,
  "id": "mb-026-example-001",
  "created_at": "2026-04-03T21:00:00Z",
  "project": "mb-kanban-dashboard",
  "card": "MB-026",
  "stage": "coder",
  "status": "queued",
  "working_dir": "/absolute/path/to/repo",
  "prompt_file": "templates/mb-026-example-001-prompt.md",
  "expected_outputs": [
    "src/example.js",
    "PROOF_EXAMPLE.md"
  ],
  "validation": {
    "command": "npm test -- --runInBand",
    "timeout_seconds": 120,
    "must_create": [
      "src/example.js"
    ]
  },
  "handoff": {
    "qa_required": true,
    "devops_required": false
  },
  "attempt": 0,
  "max_attempts": 2,
  "artifacts_dir": "logs/mb-026-example-001",
  "notes": []
}
```

## Minimum Manifest Contract

Each runner writes `logs/<task-id>/manifest.json`:

```json
{
  "task_id": "mb-026-example-001",
  "runner": "coder",
  "started_at": "2026-04-03T21:05:00Z",
  "ended_at": "2026-04-03T21:07:00Z",
  "command": "openclaw agent --local ...",
  "exit_code": 0,
  "outputs": [
    {
      "path": "src/example.js",
      "sha256": "..."
    }
  ],
  "validation": {
    "command": "npm test -- --runInBand",
    "exit_code": 0
  },
  "result": "passed"
}
```

## Failure Classification

Use one of these stable failure tags:
- `launch_failure`
- `routing_reject`
- `tool_execution_failure`
- `hang_timeout`
- `missing_outputs`
- `validation_failure`
- `human_intervention_required`

## First Safe Pilot

Run the pipeline against a bounded repo task that:
- writes 1-2 small files
- uses a validation command under 2 minutes
- has a deterministic pass/fail contract
- does not require paid services or external side effects

## Exit Criteria for MB-026

MB-026 should only be called done when:
- queue directories exist in-repo or on the declared Motherbrain path
- schema is committed
- at least one coder → QA task passes with saved manifests
- at least one failed run is also captured honestly to prove the failure path is durable

## Non-Goals

- distributed scheduler
- web UI for queue control
- autonomous retry storms
- any success claim without preserved manifests
