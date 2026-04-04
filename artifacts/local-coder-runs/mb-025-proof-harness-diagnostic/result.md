# Local Coder Proof Run Result

- Run ID: `mb-025-proof-harness-diagnostic`
- Label: diagnostic-case
- Status: **diagnostic-only**
- Started: 2026-04-04T03:35:03.786Z
- Ended: 2026-04-04T03:35:04.533Z
- Workspace: `artifacts/local-coder-runs/mb-025-proof-harness-diagnostic/workspace`

## Summary

- status: diagnostic-only
- workspace files: 0
- ollama reachable: false
- openclaw on PATH: yes

## Request

Capture PATH and Ollama diagnostics only without running a main command.

## Command

(diagnostic-only)

## Diagnostics

- openclaw on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/openclaw
- node on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/node
- ollama cli on PATH: /opt/homebrew/bin/ollama
- ollama endpoint: http://127.0.0.1:11434/
- ollama reachable: false
- ollama error: connect ECONNREFUSED 127.0.0.1:11434

## Outputs

- none

## Interpretation

- Ollama endpoint http://127.0.0.1:11434/ was unreachable (connect ECONNREFUSED 127.0.0.1:11434).
- No main command was executed because the run was explicitly diagnostic-only.

