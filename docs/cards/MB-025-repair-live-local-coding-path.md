# MB-025 — Repair live model-mediated local coding path

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-03

## Objective
Fix the current Motherbrain local agent path so a live `openclaw agent --local` coding task produces validated artifacts on demand.

## Why It Matters
This is the real trust test. If the live local coding path cannot produce code now, the rest of the Motherbrain build is standing on lies.

## Scope
- debug hanging `openclaw agent --local` invocation
- identify whether the issue is model/tool support, embedded local mode behavior, gateway interaction, or config/routing
- produce a successful live coding proof with saved artifacts

## Out of Scope
- long-term polish unrelated to the failing proof path

## Steps
- [x] inspect logs/output for the failed live proof invocation
- [x] identify exact failure mode of current `--local` path
- [ ] adjust invocation/model/routing strategy as needed
- [ ] rerun live proof until validated artifacts are produced
- [x] document the working pattern or the blocking defect

## Blockers
- Bare `openclaw` is not invocable in this shell because the NVM bin directory is absent from `PATH`.
- A fresh bounded absolute-path run still fails because Ollama is unreachable at `http://127.0.0.1:11434` and the embedded local agent reports `No API provider registered for api: ollama`.

## Artifacts
- `docs/motherbrain/local-coder-reliability-status-2026-04-03.md`
- `docs/motherbrain/local-coder-proof-run-2026-04-03.md`
- `docs/motherbrain/local-coder-qa-note-2026-04-03.md`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/command.txt`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/agent.log`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/manifest.json`
- `docs/updates/2026-03-30-now-proof-failure.md`

## Update Log
- 2026-04-03 — Added a concise QA/rerun note so the next proof attempt has explicit environment gates and cannot be misread as success unless files plus validation output are actually produced.
- 2026-04-03 — Reproduced the failure with a bounded absolute-path CLI invocation and preserved full log/manifest artifacts; this narrowed the breakage to shell launch-path drift plus unreachable/unregistered Ollama local-provider wiring.
- 2026-04-03 — Repointed the failure-update artifact to its real current-tree path under `docs/updates/` and kept the card open until a fresh bounded run captures full logs and output manifests.
- 2026-03-30 — Card created after a live proof task hung and produced no files in the target directory.
