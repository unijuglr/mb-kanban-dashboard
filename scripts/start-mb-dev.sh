#!/bin/bash
set -euo pipefail
ROOT="/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
LOG="/tmp/mb-kanban-dashboard.log"
PIDFILE="/tmp/mb-kanban-dashboard.pid"
cd "$ROOT"
if [[ -f "$PIDFILE" ]]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "already running pid=$OLD_PID"
    exit 0
  fi
fi
nohup node scripts/dev-server.mjs >> "$LOG" 2>&1 < /dev/null &
echo $! > "$PIDFILE"
echo "started pid=$(cat "$PIDFILE") log=$LOG"
