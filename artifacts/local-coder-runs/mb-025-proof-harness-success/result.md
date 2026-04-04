# Local Coder Proof Run Result

- Run ID: `mb-025-proof-harness-success`
- Label: success-case
- Status: **success**
- Started: 2026-04-04T03:35:01.219Z
- Ended: 2026-04-04T03:35:02.549Z
- Workspace: `artifacts/local-coder-runs/mb-025-proof-harness-success/workspace`

## Summary

- status: success
- workspace files: 1
- ollama reachable: false
- openclaw on PATH: yes
- command exit: 0
- validation exit: 0

## Request

Create a tiny proof workspace, write a file, and validate its contents.

## Command

cat <<'EOF' > artifacts/local-coder-runs/mb-025-proof-harness-success/workspace/hello.txt
proof ok
EOF

## Diagnostics

- openclaw on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/openclaw
- node on PATH: /Users/adamgoldband/.nvm/versions/node/v22.22.0/bin/node
- ollama cli on PATH: /opt/homebrew/bin/ollama
- ollama endpoint: http://127.0.0.1:11434/
- ollama reachable: false
- ollama error: connect ECONNREFUSED 127.0.0.1:11434

## Outputs

- `workspace/hello.txt` (9 bytes, sha256 86a34175cd63f43caba0b6405bb11efb28474f1bf6b24818db95703b8670895d)

## Interpretation

- Ollama endpoint http://127.0.0.1:11434/ was unreachable (connect ECONNREFUSED 127.0.0.1:11434).

