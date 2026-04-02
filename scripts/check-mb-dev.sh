#!/bin/bash
set -euo pipefail

PORT="${PORT:-4187}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/health"
PIDFILE="${PIDFILE:-/tmp/mb-kanban-dashboard.pid}"

pid_is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

find_dashboard_pids() {
  ps -ax -o pid=,command= | awk '
    $2 == "node" && $3 == "scripts/dev-server.mjs" {
      print $1 "\t" substr($0, index($0, $2))
    }
  '
}

health_body="$(curl -fsS "$URL" 2>/dev/null || true)"
health_ok=false
if [[ -n "$health_body" ]] && [[ "$health_body" == *'"ok": true'* ]] && [[ "$health_body" == *'"app": "mb-kanban-dashboard"'* ]]; then
  health_ok=true
fi

if [[ -f "$PIDFILE" ]]; then
  pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if pid_is_running "$pid"; then
    echo "PIDFILE: live pid=$pid"
    ps -p "$pid" -o pid=,ppid=,stat=,command=
  else
    echo "PIDFILE: stale pid=${pid:-unknown}"
  fi
else
  echo "PIDFILE: missing"
fi

echo "PROCESSES:"
if ! find_dashboard_pids; then
  echo "none"
fi

echo "PORT ${PORT}:"
if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
  echo "open"
else
  echo "closed"
fi

echo "HEALTH ${URL}:"
if [[ "$health_ok" == true ]]; then
  echo "$health_body"
  echo "STATUS: ok"
  exit 0
fi

echo "unhealthy"
if [[ -n "$health_body" ]]; then
  echo "$health_body"
fi
exit 1
