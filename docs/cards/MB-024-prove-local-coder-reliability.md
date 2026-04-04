# MB-024 — Prove Motherbrain local coder reliability

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-03

## Objective
Produce repeated, validated evidence that Motherbrain-local coding agents can generate and execute useful code artifacts reliably.

## Why It Matters
Without this, Motherbrain cannot be trusted as a serious agent habitat and the rest of the hive plan rests on sand.

## Scope
- collect evidence from prior local runs
- run fresh proof tasks
- require saved artifacts and validation output
- identify failure modes that prevent trust

## Out of Scope
- full production hardening of all services

## Steps
- [x] collect prior benchmark/log evidence
- [x] produce a fresh controlled proof artifact
- [ ] run at least one model-mediated local coding proof with validated saved outputs
- [x] define standard proof protocol for future coding-agent validation
- [x] decide whether current local coding path is acceptable or needs top-priority repair work

## Current Decision
- Current local coding path is **not acceptable yet** as a trusted system.
- The freshest bounded current-tree proof run produced **zero workspace files** and preserved log/manifest evidence instead of a success claim.
- That run narrows the failure to two concrete environment/runtime issues: bare-command PATH drift and unreachable/unregistered Ollama local-provider wiring.
- Therefore local coder reliability remains a top-priority repair target.

## Blockers
- Current gateway persistence remains broken.
- Live model-mediated proof is currently failing to produce validated artifacts on demand.
- The current operator shell cannot invoke `openclaw` by bare command name.
- The embedded local provider path is failing against `http://127.0.0.1:11434` before generation begins.

## Artifacts
- `docs/motherbrain/local-coder-reliability-status-2026-04-03.md`
- `docs/motherbrain/local-coder-proof-run-2026-04-03.md`
- `docs/motherbrain/local-coder-qa-note-2026-04-03.md`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/manifest.json`
- `docs/updates/2026-03-30-local-coder-evidence.md`
- `docs/updates/2026-03-30-agent-enablement.md`

## Update Log
- 2026-04-03 — Added a concise QA note that separates what is actually proven from what remains blocked and records a pre-rerun checklist so future proofs do not get overstated.
- 2026-04-03 — Captured a fresh bounded proof run by invoking the CLI with an absolute path; the run still produced zero outputs, but the saved log/manifest now narrow the failure to missing bare-command PATH wiring plus Ollama/provider unavailability at `127.0.0.1:11434`.
- 2026-04-03 — Added a current-tree reliability status/proof protocol note and explicitly recorded that the card-cited legacy artifacts are missing from this checkout, so live model-mediated proof is still outstanding.
- 2026-03-30 — Card created after confirming partial historical evidence and one fresh controlled proof run.
