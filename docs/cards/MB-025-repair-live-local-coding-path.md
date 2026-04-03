# MB-025 — Repair live model-mediated local coding path

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

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
- [ ] inspect logs/output for the failed live proof invocation
- [ ] identify exact failure mode of current `--local` path
- [ ] adjust invocation/model/routing strategy as needed
- [ ] rerun live proof until validated artifacts are produced
- [ ] document the working pattern or the blocking defect

## Blockers
- None currently, beyond the system being broken in the exact place we care about.

## Artifacts
- `docs/motherbrain/local-coder-reliability-status-2026-04-03.md`
- `docs/updates/2026-03-30-now-proof-failure.md`

## Update Log
- 2026-04-03 — Repointed the failure-update artifact to its real current-tree path under `docs/updates/` and kept the card open until a fresh bounded run captures full logs and output manifests.
- 2026-03-30 — Card created after a live proof task hung and produced no files in the target directory.
