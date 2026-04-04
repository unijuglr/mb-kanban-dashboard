# PROOF_MB_022

Task: MB-022  
Date: 2026-04-03  
Branch intent: make gateway-persistence diagnosis materially executable without faking host-runtime completion

## What was completed in-repo

The repo now contains a current-tree, MB-022-specific diagnosis package:

- `docs/motherbrain/gateway-persistence-diagnosis-runbook-2026-04-03.md`
- `docs/motherbrain/gateway-persistence-findings-2026-04-03.md`
- `scripts/collect-mb-022-persistence-diagnostics.sh`
- updated `docs/cards/MB-022-fix-motherbrain-gateway-persistence.md`
- updated `mb_tasks.json`

## What this proves

It proves the checkout now has:

- a durable runbook for classifying `launchctl bootstrap` / launchd error 125 on Motherbrain
- a host-diagnostics findings note from a fresh read-only capture on the current machine
- an explicit failure taxonomy instead of vague "LaunchAgent is broken" folklore
- a safer read-only diagnostics helper for collecting plist / launchctl / unified-log evidence without leaving API keys unredacted in committed summaries
- an honest completion boundary for what still requires host-runtime verification

It also proves one new concrete finding from the fresh read-only capture:

- the loaded `launchctl` job environment currently shows `OLLAMA_HOST=http://127.0.0.1:11434`
- the plist on disk currently shows `OLLAMA_HOST=http://127.0.0.1:11435`

That mismatch is consistent with stale imported launchd state or restart/bootstrap drift.

## What this does not prove

It does **not** prove that Motherbrain persistence is fixed.

No claim is made here that:
- the actual Motherbrain plist was validated on-host
- `launchctl bootstrap` was re-run successfully on Motherbrain
- the gateway now survives reboot/login/logout transitions
- the chosen persistence model should remain a LaunchAgent instead of another startup path

## Commands run for repo-side QA

```bash
bash -n scripts/collect-mb-022-persistence-diagnostics.sh
./scripts/collect-mb-022-persistence-diagnostics.sh artifacts/mb-022/local-smoke
./scripts/collect-mb-022-persistence-diagnostics.sh artifacts/mb-022/recheck
```

## QA results

### Syntax check
`bash -n` passes for `scripts/collect-mb-022-persistence-diagnostics.sh`.

### Safe local smoke run
The helper script was executed locally against this checkout to confirm that it:
- creates an output bundle
- tolerates missing OpenClaw/launchd-specific state without crashing
- does not attempt bootstrap/bootout/restart operations
- now redacts sensitive API-key fields from the saved plist/launchctl captures before those files are reviewed or summarized

That smoke run only verifies the script behavior, not Motherbrain host truth.

### Read-only host findings summary
The fresh `artifacts/mb-022/recheck/` bundle confirmed:
- `~/Library/LaunchAgents/ai.openclaw.gateway.plist` exists and passes `plutil -lint`
- `launchctl print gui/$(id -u)/ai.openclaw.gateway` reports the job is running
- the loaded job environment disagrees with the plist on disk about `OLLAMA_HOST` (`11434` loaded vs `11435` on disk)

That is real evidence, but not yet a persistence fix.

## Required host-runtime work still pending

To honestly close MB-022, an operator still needs to run the diagnostics on Motherbrain and then preserve:

- actual plist path and contents
- actual `launchctl bootstrap` stderr/stdout
- matching `log show` excerpts
- classified root cause
- successful persistence verification after restart/relogin/reboot

## Verdict

MB-022 is now **better evidenced, not solved**.

That is still useful: the task moved from sparse problem statement to executable diagnosis lane with a repeatable evidence contract and one concrete launchd/plist drift finding.
