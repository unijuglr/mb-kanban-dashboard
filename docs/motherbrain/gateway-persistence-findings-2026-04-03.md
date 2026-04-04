# MB-022 host diagnostics findings — 2026-04-03

## Scope

This note summarizes the read-only MB-022 host diagnostics run captured from the current Mac host using `scripts/collect-mb-022-persistence-diagnostics.sh`.

It is intentionally a summary, not a raw artifact dump, because the raw plist/launchctl output can contain environment secrets and should stay local unless redacted first.

## Commands run

```bash
bash -n scripts/collect-mb-022-persistence-diagnostics.sh
./scripts/collect-mb-022-persistence-diagnostics.sh artifacts/mb-022/recheck
```

## Durable findings

1. **The user LaunchAgent is present and currently loaded.**
   - Plist path found: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
   - `plutil -lint` passes.
   - `launchctl print gui/$(id -u)/ai.openclaw.gateway` reports the job is running.

2. **The loaded job environment does not match the plist on disk.**
   - Plist on disk advertises `OLLAMA_HOST=http://127.0.0.1:11435`.
   - `launchctl print` for the loaded service shows `OLLAMA_HOST=http://127.0.0.1:11434`.
   - That strongly suggests stale imported launchd state or a restart/bootstrap mismatch rather than a simple missing plist.

3. **Bare-command shell ergonomics are still weak.**
   - `openclaw` is not found by a plain `/bin/sh` capture.
   - `lsof` was also missing from the plain shell path until the diagnostics helper was hardened to fall back to `/usr/sbin/lsof`.
   - This does not prove the LaunchAgent itself is broken, but it does explain why shell-based repro steps can disagree with launchd behavior.

4. **This pass did not reproduce the historical `launchctl bootstrap` error 125.**
   - No destructive `bootout/bootstrap/restart` action was taken.
   - So the old failure is still not retired honestly; we now just have a better hypothesis and evidence package.

## QA verdict

- **Proved:** the service exists, is loaded, and has config drift between on-disk plist and imported launchd environment.
- **Not yet proved:** reboot/login persistence, clean bootstrap behavior, or the exact root cause of the earlier error-125 path.

## Recommended next step

Do one operator-approved restart/reload pass on the target host and capture:

- pre-restart `launchctl print gui/$(id -u)/ai.openclaw.gateway`
- exact `launchctl bootout/bootstrap` stderr/stdout
- post-restart `launchctl print ...`
- post-restart confirmation that the loaded `OLLAMA_HOST` matches the plist on disk

If the loaded env still sticks to `11434` after a clean reload, the persistence issue is configuration generation/import drift. If it flips to `11435` and stays healthy, the task becomes reboot/relogin verification instead of diagnosis.
