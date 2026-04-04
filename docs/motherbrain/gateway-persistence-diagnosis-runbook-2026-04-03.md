# Motherbrain gateway persistence diagnosis runbook — 2026-04-03

Task: MB-022  
Host target: Motherbrain (macOS / launchd)  
Scope: diagnose why OpenClaw gateway persistence fails, especially `launchctl bootstrap` / domain error 125  
Safety: read-only / non-destructive by default

## Why this exists

The repo already contains evidence that the OpenClaw gateway can run manually on Motherbrain:

```bash
OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway run --port 18789 --verbose --tailscale off
```

What is **not** yet proved is reboot-safe persistence. Existing task/card notes say LaunchAgent-managed startup is broken and `launchctl bootstrap` returns domain error 125, but the checkout previously lacked a durable current-tree runbook for reproducing and classifying that failure.

This document fixes that gap. It does **not** pretend the host runtime was repaired.

## Known facts from current-tree evidence

- `docs/updates/2026-03-30-agent-enablement.md` records a successful manual foreground gateway run on Motherbrain.
- `docs/cards/MB-004-enable-local-coding-agents.md` records that LaunchAgent-managed gateway reachability on `127.0.0.1:18789` was broken at the time of observation.
- `docs/cards/MB-022-fix-motherbrain-gateway-persistence.md` scopes the remaining work as launchd failure classification plus deciding whether LaunchAgent is the right persistence path.
- `MB_SAM_RUNTIME.md` explicitly notes that the earlier artifact `docs/motherbrain-local-agent-bootstrap.md` is missing from this checkout and should not be treated as proof.

## What launchd error 125 usually means in practice

For `launchctl bootstrap`, error 125 is not a friendly diagnosis. On macOS, treat it as a **load/bootstrap failure that still requires log-level classification**.

For this task, the likely buckets are:

1. **Wrong launch domain**
   - using `gui/<uid>` from a non-GUI context
   - trying to bootstrap a per-user agent into the wrong domain
2. **Bad plist or unreadable plist**
   - malformed XML
   - missing required keys
   - file permissions or ownership problems
3. **Bad executable path / PATH assumptions**
   - `openclaw` not on launchd PATH
   - shell-only env vars not available under launchd
   - referenced working directory does not exist
4. **Process exits immediately**
   - unsupported flags
   - missing env vars
   - port collision
   - Bonjour/Tailscale/runtime dependency issue
5. **Session model mismatch**
   - this should be a LaunchDaemon or a different startup mechanism instead of a GUI LaunchAgent

Do not guess which bucket applies. Collect evidence first.

## Tonight's shortest honest path

If the goal is to make progress tonight without breaking anything:

1. Collect diagnostics with the helper script in `scripts/collect-mb-022-persistence-diagnostics.sh`
2. Save the output directory under a dated artifact path
3. Classify the failure into one of the buckets above
4. Only then decide whether to:
   - fix the plist / env / executable path, or
   - abandon LaunchAgent and switch to a different supported persistence model

## Prerequisites

Run these on **Motherbrain itself** unless explicitly noted.

- SSH access to `motherbrain.local`
- the repo checked out on Motherbrain
- ability to run read-only `launchctl`, `plutil`, `log`, `pgrep`, `lsof`, and `openclaw gateway status`

## Evidence collection checklist

### 1) Confirm the manual path is still the known-good baseline

```bash
openclaw gateway status || true
lsof -nP -iTCP:18789 -sTCP:LISTEN || true
pgrep -fal "openclaw.*gateway|gateway.*openclaw" || true
```

If the gateway is already running, write down **how** it is running before touching launchd.

### 2) Identify the candidate plist

Look in the standard per-user and system locations:

```bash
ls -la ~/Library/LaunchAgents || true
ls -la /Library/LaunchAgents || true
ls -la /Library/LaunchDaemons || true
```

Then inspect likely OpenClaw-related entries:

```bash
find ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons \
  -maxdepth 1 -type f \( -name "*openclaw*" -o -name "*gateway*" \) 2>/dev/null
```

Record:
- exact plist path
- `Label`
- whether it lives under LaunchAgents vs LaunchDaemons
- owner/group/mode

### 3) Validate plist syntax before trusting it

```bash
plutil -lint /path/to/file.plist
plutil -p /path/to/file.plist
```

Things to watch for:
- `Program` vs `ProgramArguments`
- hard-coded `openclaw` without absolute path
- missing `WorkingDirectory`
- `EnvironmentVariables` absent even though the manual path required `OPENCLAW_DISABLE_BONJOUR=1`
- stdout/stderr paths pointing to non-existent or unwritable directories

### 4) Inspect the current launchd registration state

For a user agent:

```bash
id -u
launchctl print gui/$(id -u) | grep -i openclaw -A 20 -B 5 || true
launchctl print gui/$(id -u)/<label> || true
```

For a system daemon candidate:

```bash
sudo launchctl print system/<label>
```

Useful signs:
- `state = exited`
- recent non-zero `last exit code`
- missing service entry entirely
- service disabled or not found

### 5) Reproduce the bootstrap failure with captured stderr

For a per-user LaunchAgent:

```bash
launchctl bootout gui/$(id -u)/<label> 2>&1 | tee /tmp/mb-022-bootout.txt || true
launchctl bootstrap gui/$(id -u) /absolute/path/to/file.plist 2>&1 | tee /tmp/mb-022-bootstrap.txt
launchctl kickstart -kp gui/$(id -u)/<label> 2>&1 | tee /tmp/mb-022-kickstart.txt || true
```

For a system daemon candidate:

```bash
sudo launchctl bootout system/<label> 2>&1 | tee /tmp/mb-022-bootout.txt || true
sudo launchctl bootstrap system /absolute/path/to/file.plist 2>&1 | tee /tmp/mb-022-bootstrap.txt
sudo launchctl kickstart -kp system/<label> 2>&1 | tee /tmp/mb-022-kickstart.txt || true
```

Do **not** treat `bootstrap failed: 125` as the diagnosis. It is just the symptom.

### 6) Pull launchd and process logs around the failure window

```bash
log show --last 15m --style compact \
  --predicate '(process == "launchd") OR (eventMessage CONTAINS[c] "openclaw") OR (eventMessage CONTAINS[c] "gateway")' \
  | tail -n 400
```

Also inspect any plist-declared stdout/stderr files if present.

### 7) Verify executable and environment assumptions

The most common launchd footgun is assuming your interactive shell environment exists under launchd. It does not.

Check:

```bash
command -v openclaw || true
which openclaw || true
python3 - <<'PY'
import os, shutil
print('PATH=' + os.environ.get('PATH', ''))
print('openclaw=' + str(shutil.which('openclaw')))
PY
```

If the plist uses `openclaw` without an absolute path, assume that is suspect until disproven.

Also compare the manual known-good invocation requirements:

```bash
OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway run --port 18789 --verbose --tailscale off
```

A persistence config that omits the equivalent environment/arguments is not actually equivalent.

### 8) Check for port conflict or fast-exit conditions

```bash
lsof -nP -iTCP:18789 -sTCP:LISTEN || true
pgrep -fal "openclaw.*gateway|gateway.*openclaw" || true
openclaw gateway status || true
```

If some other process already owns the port, launchd may just be repeatedly failing a process that exits instantly.

## Failure classification matrix

### Class A — plist invalid or unreadable
Evidence:
- `plutil -lint` fails
- permissions/ownership are wrong
- launchctl cannot parse/load plist

Next move:
- repair plist structure, ownership, and file mode
- rerun syntax validation before any bootstrap retry

### Class B — wrong launch domain
Evidence:
- plist is syntactically fine
- `bootstrap gui/<uid>` fails from a context that lacks the expected GUI domain
- service appears valid but is not loadable in the chosen domain

Next move:
- confirm whether Motherbrain needs a per-user GUI LaunchAgent at all
- if not, evaluate LaunchDaemon or another supported startup path

### Class C — executable/env mismatch
Evidence:
- logs show `openclaw` not found, cwd missing, env var missing, or immediate command failure
- manual shell command works, launchd version does not

Next move:
- use absolute executable path
- add explicit `EnvironmentVariables`
- add explicit `WorkingDirectory`
- capture stdout/stderr to durable files

### Class D — runtime starts then dies
Evidence:
- launchd loads the service, but logs show fast exit
- port conflict, dependency issue, or unsupported runtime option

Next move:
- inspect stdout/stderr and unified log output
- compare exact launchd command with the known-good manual command
- fix runtime assumptions before retrying persistence

### Class E — LaunchAgent is the wrong model
Evidence:
- repeated user-session/domain weirdness
- service should survive login/logout differently than LaunchAgent semantics allow
- operational need is host-level background service, not UI-session affinity

Next move:
- document why LaunchAgent is the wrong abstraction
- choose a supported replacement and capture migration/rollback plan

## Recommended minimal plist contract if LaunchAgent remains the plan

Do not copy this blindly. Use it as a validation checklist.

- absolute `ProgramArguments[0]` path to the OpenClaw executable
- explicit args matching the known-good manual invocation
- `EnvironmentVariables.OPENCLAW_DISABLE_BONJOUR=1`
- explicit `WorkingDirectory`
- explicit `StandardOutPath` and `StandardErrorPath`
- label name recorded in docs and commands
- bootstrap/kickstart commands written down exactly

## Recommended artifact set for the real host run

Save under something like:

`artifacts/mb-022/<YYYY-MM-DD-HHMMSS>/`

Include:
- `host.txt` — hostname, user, macOS version, `id -u`
- `service-list.txt` — relevant `launchctl print` output
- `plist.txt` — sanitized `plutil -p` output
- `bootstrap.txt` — exact bootstrap stderr/stdout
- `kickstart.txt` — exact kickstart stderr/stdout
- `log-show.txt` — unified log excerpt
- `gateway-status.txt` — `openclaw gateway status`
- `ports.txt` — `lsof` / `pgrep` snapshot
- `summary.md` — one-page classification + next step

## Go / no-go for calling MB-022 fixed

Do **not** mark MB-022 done until all of the following are true on Motherbrain:

- persistence path survives a reboot or equivalent clean relogin/service restart test
- the service is started by the chosen persistence mechanism, not manually by an operator shell
- `openclaw gateway status` and/or expected listening socket confirms availability after restart
- rollback instructions exist
- logs for the successful run are preserved

## Honest current status

As of this document, the repo now has a concrete diagnosis path and evidence checklist.

What it does **not** have yet:
- the actual Motherbrain plist contents
- the actual `launchctl bootstrap` stderr for the failing host
- a classified root cause
- a proved persistence fix

That is the remaining runtime work.