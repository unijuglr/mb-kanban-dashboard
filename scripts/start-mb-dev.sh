#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-4187}"
HOST="${HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}"
HEALTH_URL="${BASE_URL}/health"
LOG="${MB_DEV_LOG:-/tmp/mb-kanban-dashboard.log}"
PIDFILE="${MB_DEV_PIDFILE:-/tmp/mb-kanban-dashboard.pid}"
STARTUP_WAIT_SECONDS="${MB_DEV_STARTUP_WAIT_SECONDS:-15}"

health_json() {
  curl -fsS "$HEALTH_URL" 2>/dev/null || true
}

health_app() {
  local body
  body="$(health_json)"
  if [[ -z "$body" ]]; then
    return 1
  fi
  python3 - <<'PY' "$body"
import json, sys
try:
    payload = json.loads(sys.argv[1])
except Exception:
    raise SystemExit(1)
raise SystemExit(0 if payload.get('app') == 'mb-kanban-dashboard' else 1)
PY
}

port_in_use() {
  python3 - <<'PY' "$HOST" "$PORT"
import socket, sys
host = sys.argv[1]
port = int(sys.argv[2])
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.settimeout(0.4)
    raise SystemExit(0 if sock.connect_ex((host, port)) == 0 else 1)
PY
}

cleanup_stale_pidfile() {
  if [[ ! -f "$PIDFILE" ]]; then
    return 0
  fi

  local old_pid
  old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -z "$old_pid" ]]; then
    echo "removing empty pidfile: $PIDFILE"
    rm -f "$PIDFILE"
    return 0
  fi

  if kill -0 "$old_pid" 2>/dev/null; then
    return 0
  fi

  echo "removing stale pidfile: $PIDFILE (pid $old_pid is not running)"
  rm -f "$PIDFILE"
}

wait_for_ready() {
  local deadline=$((SECONDS + STARTUP_WAIT_SECONDS))
  while (( SECONDS < deadline )); do
    if health_app; then
      return 0
    fi
    sleep 1
  done
  return 1
}

cd "$ROOT"
cleanup_stale_pidfile

if [[ -f "$PIDFILE" ]]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    if health_app; then
      echo "already running pid=$OLD_PID url=$BASE_URL log=$LOG"
      exit 0
    fi
    echo "pidfile points to live pid=$OLD_PID but $HEALTH_URL is not healthy; refusing to start a second server"
    exit 1
  fi
fi

if port_in_use; then
  if health_app; then
    existing_pid="$(pgrep -f "node .*scripts/dev-server\.mjs" | head -n 1 || true)"
    if [[ -n "$existing_pid" ]]; then
      echo "$existing_pid" > "$PIDFILE"
      echo "port $PORT already serves mb-kanban-dashboard; refreshed pidfile with pid=$existing_pid"
    else
      echo "port $PORT already serves mb-kanban-dashboard; pid could not be determined"
    fi
    echo "ready url=$BASE_URL log=$LOG"
    exit 0
  fi
  echo "port $PORT is already in use by a different process; refusing to start"
  echo "hint: run scripts/check-mb-dev.sh for a clearer diagnosis"
  exit 1
fi

nohup env PORT="$PORT" HOST="$HOST" MB_ROOT="$ROOT" node scripts/dev-server.mjs >> "$LOG" 2>&1 < /dev/null &
NEW_PID=$!
echo "$NEW_PID" > "$PIDFILE"

if wait_for_ready; then
  echo "started pid=$NEW_PID url=$BASE_URL health=$HEALTH_URL log=$LOG"
  exit 0
fi

echo "server failed readiness check within ${STARTUP_WAIT_SECONDS}s; see log=$LOG"
if ! kill -0 "$NEW_PID" 2>/dev/null; then
  echo "process pid=$NEW_PID exited during startup"
fi
exit 1
