#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-4187}"
HOST="${HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}"
HEALTH_URL="${BASE_URL}/health"
PIDFILE="${MB_DEV_PIDFILE:-/tmp/mb-kanban-dashboard.pid}"
LOG="${MB_DEV_LOG:-/tmp/mb-kanban-dashboard.log}"

say() {
  printf '%s\n' "$*"
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

health_json() {
  curl -fsS "$HEALTH_URL" 2>/dev/null || true
}

json_field() {
  local body="$1"
  local field="$2"
  python3 - <<'PY' "$body" "$field"
import json, sys
payload = json.loads(sys.argv[1])
value = payload.get(sys.argv[2], '')
if isinstance(value, (dict, list)):
    print(json.dumps(value))
else:
    print(value)
PY
}

say "mb dev check"
say "- root: $ROOT"
say "- url: $BASE_URL"
say "- pidfile: $PIDFILE"
say "- log: $LOG"

PID=""
if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    say "- pidfile: live pid=$PID"
    ps -p "$PID" -o pid=,ppid=,stat=,etime=,command= || true
  elif [[ -n "$PID" ]]; then
    say "- pidfile: stale pid=$PID"
  else
    say "- pidfile: present but empty"
  fi
else
  say "- pidfile: missing"
fi

if port_in_use; then
  say "- port $PORT: LISTENING"
else
  say "- port $PORT: not listening"
fi

BODY="$(health_json)"
if [[ -n "$BODY" ]]; then
  APP="$(json_field "$BODY" app 2>/dev/null || true)"
  STARTED_AT="$(json_field "$BODY" startedAt 2>/dev/null || true)"
  UPTIME_MS="$(json_field "$BODY" uptimeMs 2>/dev/null || true)"
  SERVER_PID="$(json_field "$BODY" pid 2>/dev/null || true)"
  SERVER_ROOT="$(json_field "$BODY" root 2>/dev/null || true)"
  say "- health: OK app=$APP pid=$SERVER_PID startedAt=$STARTED_AT uptimeMs=$UPTIME_MS"
  say "- health root: $SERVER_ROOT"
else
  say "- health: no valid response from $HEALTH_URL"
fi

if [[ -f "$LOG" ]]; then
  say "- recent log tail:"
  tail -n 20 "$LOG" || true
else
  say "- recent log tail: log file missing"
fi
