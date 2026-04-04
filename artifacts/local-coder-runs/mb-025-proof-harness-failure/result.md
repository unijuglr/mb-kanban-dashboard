# Local Coder Proof Run Result

- Run ID: `mb-025-proof-harness-failure`
- Label: failure-case
- Status: **failed**
- Started: 2026-04-04T03:35:02.612Z
- Ended: 2026-04-04T03:35:03.723Z
- Workspace: `artifacts/local-coder-runs/mb-025-proof-harness-failure/workspace`

## Summary

- status: failed
- workspace files: 1
- ollama reachable: false
- openclaw on PATH: yes
- command exit: 7
- validation exit: 0

## Request

Run an intentionally failing bounded command so the harness preserves the failure honestly.

## Command

echo 'about to fail' > artifacts/local-coder-runs/mb-025-proof-harness-failure/workspace/notes.txt; exit 7

## Diagnostics

- openclaw on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/openclaw
- node on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/node
- ollama cli on PATH: /opt/homebrew/bin/ollama
- ollama endpoint: http://127.0.0.1:11434/
- ollama reachable: false
- ollama error: connect ECONNREFUSED 127.0.0.1:11434

## Outputs

- `workspace/notes.txt` (14 bytes, sha256 f73c61cd0787467e8c3dd200c9eb3c4b2a6d4ec20899fd084a0be1e615cdc988)

## Interpretation

- Ollama endpoint http://127.0.0.1:11434/ was unreachable (connect ECONNREFUSED 127.0.0.1:11434).
- Main command exited non-zero (7).

