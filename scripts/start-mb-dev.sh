#!/bin/bash
set -euo pipefail

ROOT="/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
PORT="${PORT:-4187}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/health"
LOG="${LOG:-/tmp/mb-kanban-dashboard.log}"
PIDFILE="${PIDFILE:-/tmp/mb-kanban-dashboard.pid}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-20}"

cd "$ROOT"

pid_is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

find_dashboard_pids() {
  ps -ax -o pid=,command= | awk '
    $2 == "node" && $3 == "scripts/dev-server.mjs" {
      print $1
    }
  '
}

print_process() {
  local pid="$1"
  ps -p "$pid" -o pid=,ppid=,stat=,command= 2>/dev/null || true
}

health_ok() {
  local body
  body="$(curl -fsS "$URL" 2>/dev/null || true)"
  [[ -n "$body" ]] && [[ "$body" == *'"ok": true'* ]] && [[ "$body" == *'"app": "mb-kanban-dashboard"'* ]]
}

port_is_open() {
  nc -z "$HOST" "$PORT" >/dev/null 2>&1
}

cleanup_stale_pidfile() {
  if [[ -f "$PIDFILE" ]]; then
    local old_pid
    old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
    if [[ -n "$old_pid" ]] && ! pid_is_running "$old_pid"; then
      echo "removing stale pidfile for dead pid=$old_pid"
      rm -f "$PIDFILE"
    fi
  fi
}

adopt_existing_dashboard_if_healthy() {
  local pids
  pids="$(find_dashboard_pids | tr '\n' ' ' | xargs 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 1
  fi

  local count
  count="$(printf '%s\n' $pids | awk 'NF {count++} END {print count+0}')"
  if [[ "$count" -gt 1 ]]; then
    echo "error: multiple dashboard dev-server processes found; refusing to guess"
    printf '%s\n' $pids | while read -r pid; do
      [[ -n "$pid" ]] && print_process "$pid"
    done
    exit 1
  fi

  local pid
  pid="$pids"
  if health_ok; then
    echo "$pid" > "$PIDFILE"
    echo "dashboard already healthy on $URL (pid=$pid); pidfile synced"
    exit 0
  fi

  echo "dashboard process exists (pid=$pid) but health check failed at $URL"
  print_process "$pid"
  exit 1
}

cleanup_stale_pidfile

if [[ -f "$PIDFILE" ]]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$OLD_PID" ]] && pid_is_running "$OLD_PID"; then
    if health_ok; then
      echo "already running pid=$OLD_PID url=$URL"
      exit 0
    fi
    echo "error: pidfile process is alive but dashboard health check failed"
    print_process "$OLD_PID"
    exit 1
  fi
fi

if find_dashboard_pids | grep -q '.'; then
  adopt_existing_dashboard_if_healthy
fi

if port_is_open; then
  echo "error: port $PORT is already accepting connections, but no healthy dashboard process was detected"
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "health endpoint responded, but it did not identify as mb-kanban-dashboard"
  else
    echo "health endpoint did not respond successfully: $URL"
  fi
  exit 1
fi

nohup node scripts/dev-server.mjs >> "$LOG" 2>&1 < /dev/null &
NEW_PID="$!"
echo "$NEW_PID" > "$PIDFILE"

echo "starting dashboard pid=$NEW_PID port=$PORT log=$LOG"

for _ in $(seq 1 "$STARTUP_TIMEOUT_SECONDS"); do
  if ! pid_is_running "$NEW_PID"; then
    echo "error: dashboard process exited before becoming healthy"
    tail -n 40 "$LOG" 2>/dev/null || true
    rm -f "$PIDFILE"
    exit 1
  fi

  if health_ok; then
    echo "dashboard healthy url=$URL pid=$NEW_PID"
    exit 0
  fi

  sleep 1
done

echo "error: dashboard did not become healthy within ${STARTUP_TIMEOUT_SECONDS}s"
print_process "$NEW_PID"
tail -n 40 "$LOG" 2>/dev/null || true
exit 1
