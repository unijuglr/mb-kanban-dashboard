# PROOF_MB_022

Task: MB-022  
Date: 2026-04-03  
Branch intent: make gateway-persistence diagnosis materially executable without faking host-runtime completion

## What was completed in-repo

The repo now contains a current-tree, MB-022-specific diagnosis package:

- `docs/motherbrain/gateway-persistence-diagnosis-runbook-2026-04-03.md`
- `scripts/collect-mb-022-persistence-diagnostics.sh`
- updated `docs/cards/MB-022-fix-motherbrain-gateway-persistence.md`
- updated `mb_tasks.json`

## What this proves

It proves the checkout now has:

- a durable runbook for classifying `launchctl bootstrap` / launchd error 125 on Motherbrain
- an explicit failure taxonomy instead of vague "LaunchAgent is broken" folklore
- a safe read-only diagnostics helper for collecting plist / launchctl / unified-log evidence
- an honest completion boundary for what still requires host-runtime verification

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
```

## QA results

### Syntax check
`bash -n` passes for `scripts/collect-mb-022-persistence-diagnostics.sh`.

### Safe local smoke run
The helper script was executed locally against this checkout to confirm that it:
- creates an output bundle
- tolerates missing OpenClaw/launchd-specific state without crashing
- does not attempt bootstrap/bootout/restart operations

That smoke run only verifies the script behavior, not Motherbrain host truth.

## Required host-runtime work still pending

To honestly close MB-022, an operator still needs to run the diagnostics on Motherbrain and then preserve:

- actual plist path and contents
- actual `launchctl bootstrap` stderr/stdout
- matching `log show` excerpts
- classified root cause
- successful persistence verification after restart/relogin/reboot

## Verdict

MB-022 is now **better prepared, not solved**.

That is still useful: the task moved from sparse problem statement to executable diagnosis lane with a repeatable evidence contract.