# MB-022 — Fix Motherbrain gateway persistence

Status: Ready
Priority: P1 important
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-04

## Objective
Repair or replace the current LaunchAgent-based persistence path for the Motherbrain OpenClaw gateway.

## Why It Matters
The gateway runtime itself works, but service persistence currently fails, which prevents reliable post-reboot operability.

## Scope
- identify why `launchctl bootstrap` fails with domain error 125
- determine whether the current LaunchAgent model is valid on this host/session
- decide whether to fix launchd path or replace it with another supported startup path
- capture enough evidence that the next operator pass can classify the failure instead of guessing

## Out of Scope
- broader OpenClaw topology migration
- pretending the host-runtime fix happened without Motherbrain proof

## Steps
- [ ] collect a read-only diagnostics bundle on Motherbrain with `scripts/collect-mb-022-persistence-diagnostics.sh`
- [ ] classify the current launchd failure mode from plist + `launchctl` + unified-log evidence
- [ ] inspect alternative supported service start methods if LaunchAgent semantics are the mismatch
- [ ] test a persistent startup path on Motherbrain
- [ ] document rollback and expected behavior after the real host-side fix is verified

## Current Findings
- Historical repo evidence still supports that manual foreground gateway startup worked on Motherbrain with:
  - `OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway run --port 18789 --verbose --tailscale off`
- Historical repo evidence also says the LaunchAgent-managed path was broken/unreachable.
- This checkout previously lacked the card-cited bootstrap artifact `docs/motherbrain-local-agent-bootstrap.md`, so old references were not enough to count as current-tree proof.
- A new current-tree diagnosis runbook and safe diagnostics helper now exist, but they do **not** prove the host fix yet.
- Fresh read-only diagnostics on the current host confirmed the LaunchAgent is loaded and running, but the loaded `launchctl` environment still shows `OLLAMA_HOST=http://127.0.0.1:11434` while the plist on disk shows `http://127.0.0.1:11435`.
- That mismatch points to stale imported launchd state or reload/bootstrap drift, not just a missing plist file.

## Blockers
- Need an actual Motherbrain runtime pass to collect the failing plist, `launchctl bootstrap` stderr, and related unified-log evidence.
- Need one operator-approved reload/restart verification to prove whether the loaded job can be made to match the plist on disk and stay healthy across session lifecycle events.

## Artifacts
- `docs/cards/MB-022-fix-motherbrain-gateway-persistence.md`
- `docs/motherbrain/gateway-persistence-diagnosis-runbook-2026-04-03.md`
- `docs/motherbrain/gateway-persistence-findings-2026-04-03.md`
- `scripts/collect-mb-022-persistence-diagnostics.sh`
- `PROOF_MB_022.md`
- `artifacts/mb-022/recheck-sanitized/`
- `docs/updates/2026-03-30-agent-enablement.md`

## Update Log
- 2026-03-30 — Card created after confirming manual gateway startup works but LaunchAgent startup does not.
- 2026-04-03 — Added a current-tree runbook, safe diagnostics helper, and honest proof boundary so MB-022 is executable tonight without faking host-runtime completion.
- 2026-04-03 — Captured a fresh read-only host diagnostics summary and narrowed the failure class to launchd/plist config drift (`11434` loaded vs `11435` on disk) plus shell-path ergonomics issues; task remains open pending an operator-approved reload/restart verification.
- 2026-04-04 — Promoted the redacted `artifacts/mb-022/recheck-sanitized/` bundle as the durable evidence snapshot and ignored the unsafe local-only sibling bundles so overnight work stops leaving raw secret-bearing diagnostics loose in git status.
