#!/bin/bash
set -euo pipefail
PIDFILE="/tmp/mb-kanban-dashboard.pid"
if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE")"
  ps -p "$PID" -o pid=,stat=,command= || true
else
  echo "no pidfile"
fi
curl -sf http://127.0.0.1:4187/health && echo
