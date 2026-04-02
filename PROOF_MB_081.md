# PROOF_MB_081

Task: MB-081 — local dev preflight guardrails and verification clarity

## What changed
- `scripts/start-mb-dev.sh`
  - resolves repo root relative to the script instead of hardcoding a single checkout path
  - cleans up stale pidfiles before launch
  - checks whether the target port is already bound before starting
  - distinguishes between:
    - an already-healthy MB dashboard on the port
    - a foreign process occupying the port
    - a broken pidfile / unhealthy existing process
  - waits for `/health` before declaring startup success
  - passes `PORT`, `HOST`, and `MB_ROOT` into the dev server explicitly
- `scripts/check-mb-dev.sh`
  - now reports root, URL, pidfile state, port state, health metadata, and recent log tail
  - parses `/health` so verification is clearer than a bare `curl`
- `scripts/dev-server.mjs`
  - `/health` now returns `pid`, `host`, `port`, `root`, `startedAt`, and `uptimeMs`
  - server startup log now includes host, pid, and root
  - explicit startup error logging for bind failures
- `README.md`
  - documents `scripts/start-mb-dev.sh` and `scripts/check-mb-dev.sh`

## QA
All commands run from repo root in the isolated worktree.

### 1) Syntax check
```bash
node --check scripts/dev-server.mjs
```
Result: passed with no output.

### 2) Stale pidfile guardrail + successful startup
```bash
TMPDIR="$(mktemp -d)"
PORT=4317
PIDFILE="$TMPDIR/mb.pid"
LOGFILE="$TMPDIR/mb.log"
printf '999999\n' > "$PIDFILE"
PORT="$PORT" MB_DEV_PIDFILE="$PIDFILE" MB_DEV_LOG="$LOGFILE" scripts/start-mb-dev.sh
```
Result:
```text
removing stale pidfile: .../mb.pid (pid 999999 is not running)
started pid=89656 url=http://127.0.0.1:4317 health=http://127.0.0.1:4317/health log=.../mb.log
```

### 3) Verification clarity from the check helper
```bash
PORT="$PORT" MB_DEV_PIDFILE="$PIDFILE" MB_DEV_LOG="$LOGFILE" scripts/check-mb-dev.sh
```
Result:
```text
mb dev check
- root: /Users/adamgoldband/.openclaw/workspace/worktrees/mb-081-dev-preflight-guardrails
- url: http://127.0.0.1:4317
- pidfile: .../mb.pid
- log: .../mb.log
- pidfile: live pid=89656
89656     1 S    00:01 node scripts/dev-server.mjs
- port 4317: LISTENING
- health: OK app=mb-kanban-dashboard pid=89656 startedAt=2026-04-02T17:20:27.602Z uptimeMs=1469
- health root: /Users/adamgoldband/.openclaw/workspace/worktrees/mb-081-dev-preflight-guardrails
- recent log tail:
MB Kanban Dashboard listening on http://127.0.0.1:4317 (pid=89656, root=/Users/adamgoldband/.openclaw/workspace/worktrees/mb-081-dev-preflight-guardrails)
```

### 4) Health endpoint metadata
```bash
curl -fsS "http://127.0.0.1:${PORT}/health"
```
Result:
```json
{
  "ok": true,
  "app": "mb-kanban-dashboard",
  "pid": 89656,
  "host": "127.0.0.1",
  "port": 4317,
  "root": "/Users/adamgoldband/.openclaw/workspace/worktrees/mb-081-dev-preflight-guardrails",
  "startedAt": "2026-04-02T17:20:27.602Z",
  "uptimeMs": 1610,
  "routes": ["/", "/metrics", "/board", "..."]
}
```

### 5) Foreign process port-conflict guardrail
```bash
python3 -m http.server 4318 --bind 127.0.0.1 >/tmp/mb-081-foreign.log 2>&1 &
PORT=4318 MB_DEV_PIDFILE="$TMPDIR/foreign.pid" MB_DEV_LOG="$TMPDIR/foreign-dev.log" scripts/start-mb-dev.sh
```
Result:
```text
port 4318 is already in use by a different process; refusing to start
hint: run scripts/check-mb-dev.sh for a clearer diagnosis
```
Exit status: `1`

## Files changed
- `README.md`
- `scripts/start-mb-dev.sh`
- `scripts/check-mb-dev.sh`
- `scripts/dev-server.mjs`
- `PROOF_MB_081.md`
