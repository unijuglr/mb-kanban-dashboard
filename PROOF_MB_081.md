# PROOF_MB_081

## Summary
MB-081 added practical local-dev guardrails for the MB dashboard so startup now handles stale pidfiles, refuses misleading duplicate starts, detects foreign listeners on the dashboard port, and waits for a real health signal before declaring success.

## Files changed
- `scripts/start-mb-dev.sh`
- `scripts/check-mb-dev.sh`
- `docs/cards/MB-081-motherbrain-preflight-and-stale-process-guardrails-for-local-dev.md`
- `mb_tasks.json`

## Guardrails added
### `scripts/start-mb-dev.sh`
- cleans up stale pidfiles when the recorded PID is dead
- detects an already-running healthy dashboard and syncs the pidfile instead of spawning duplicates
- fails loudly if the pidfile process exists but is unhealthy
- fails loudly if the target port is already accepting connections but `/health` is not the MB dashboard
- waits up to `STARTUP_TIMEOUT_SECONDS` for `/health` to report `{"ok": true, "app": "mb-kanban-dashboard"}`
- prints process and log context on startup failure
- supports `PORT`, `HOST`, `PIDFILE`, `LOG`, and `STARTUP_TIMEOUT_SECONDS` overrides for safer testing/ops

### `scripts/check-mb-dev.sh`
- reports pidfile state as live / stale / missing
- lists matching dashboard processes
- reports whether the dashboard port is open
- validates `/health` is the MB dashboard and exits non-zero if unhealthy

## Verification
### 1) Syntax validation
```bash
bash -n scripts/start-mb-dev.sh
bash -n scripts/check-mb-dev.sh
```
Result: passed.

### 2) Healthy running dashboard remains stable
```bash
scripts/start-mb-dev.sh
scripts/check-mb-dev.sh
```
Observed result:
- startup reported `already running pid=82143 url=http://127.0.0.1:4187/health`
- check reported live pidfile, one matching `node scripts/dev-server.mjs` process, open port 4187, and healthy MB dashboard JSON

### 3) Stale pidfile is cleaned up and replaced with the real process
```bash
echo 999999 > /tmp/mb-kanban-dashboard-test-stale.pid
PIDFILE=/tmp/mb-kanban-dashboard-test-stale.pid scripts/start-mb-dev.sh
cat /tmp/mb-kanban-dashboard-test-stale.pid
```
Observed result:
- script printed `removing stale pidfile for dead pid=999999`
- script adopted the existing healthy dashboard
- pidfile was rewritten to the live dashboard PID (`82143` during test)

### 4) Foreign listener on port 4187 blocks startup
Verification flow:
- stopped the live dashboard process
- bound a fake listener with `python3 -m http.server 4187`
- ran `scripts/start-mb-dev.sh`
- removed the fake listener
- restarted the real dashboard and re-ran `scripts/check-mb-dev.sh`

Observed conflict result:
```text
conflict_exit=1
removing stale pidfile for dead pid=82143
error: port 4187 is already accepting connections, but no healthy dashboard process was detected
health endpoint did not respond successfully: http://127.0.0.1:4187/health
```

Observed recovery result:
- dashboard restarted successfully as pid `88624`
- `scripts/check-mb-dev.sh` returned healthy status afterward

## Final state
- MB dashboard dev server restored and healthy on `http://127.0.0.1:4187/health`
- MB-081 card marked done in both `docs/cards/...` and `mb_tasks.json`
