#!/usr/bin/env bash
set -euo pipefail

# Collect read-only diagnostics for MB-022 (Motherbrain gateway persistence).
# Safe by design: no launchctl bootstrap/bootout, no writes outside the chosen output dir,
# no service restarts, no destructive actions.

OUTPUT_DIR="${1:-artifacts/mb-022/$(date +%Y-%m-%d-%H%M%S)-diagnostics}"
mkdir -p "$OUTPUT_DIR"

log() {
  printf '[mb-022] %s\n' "$*" >&2
}

run_capture() {
  local name="$1"
  shift
  {
    printf '$'
    for arg in "$@"; do
      printf ' %q' "$arg"
    done
    printf '\n\n'
    "$@"
  } >"$OUTPUT_DIR/$name" 2>&1 || true
}

LABEL_GUESS_FILE="$OUTPUT_DIR/label-guess.txt"
PLIST_GUESS_FILE="$OUTPUT_DIR/plist-candidates.txt"

log "Writing diagnostics to $OUTPUT_DIR"

run_capture host.txt uname -a
run_capture sw_vers.txt sw_vers
run_capture whoami.txt whoami
run_capture id.txt id
run_capture pwd.txt pwd
run_capture env-path.txt /bin/sh -c 'printf "%s\n" "$PATH"'
run_capture openclaw-which.txt /bin/sh -c 'command -v openclaw || which openclaw || true'
run_capture openclaw-status.txt /bin/sh -c 'openclaw gateway status || true'
run_capture ports.txt /bin/sh -c 'lsof -nP -iTCP:18789 -sTCP:LISTEN || true'
run_capture processes.txt /bin/sh -c 'pgrep -fal "openclaw.*gateway|gateway.*openclaw" || true'
run_capture launchagents-user.txt /bin/sh -c 'ls -la ~/Library/LaunchAgents || true'
run_capture launchagents-system.txt /bin/sh -c 'ls -la /Library/LaunchAgents || true'
run_capture launchdaemons-system.txt /bin/sh -c 'ls -la /Library/LaunchDaemons || true'
run_capture plist-find.txt /bin/sh -c 'find ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons -maxdepth 1 -type f \( -name "*openclaw*" -o -name "*gateway*" \) 2>/dev/null || true'
run_capture launchctl-gui-print.txt /bin/sh -c 'launchctl print gui/$(id -u) || true'
run_capture log-show.txt /bin/sh -c 'log show --last 15m --style compact --predicate "(process == \"launchd\") OR (eventMessage CONTAINS[c] \"openclaw\") OR (eventMessage CONTAINS[c] \"gateway\")" | tail -n 400 || true'

/bin/sh -c 'find ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons -maxdepth 1 -type f \( -name "*openclaw*" -o -name "*gateway*" \) 2>/dev/null || true' > "$PLIST_GUESS_FILE"

if [[ -s "$PLIST_GUESS_FILE" ]]; then
  while IFS= read -r plist; do
    [[ -n "$plist" ]] || continue
    base="$(basename "$plist")"
    run_capture "plutil-lint-$base.txt" plutil -lint "$plist"
    run_capture "plutil-print-$base.txt" plutil -p "$plist"
    run_capture "stat-$base.txt" stat -f '%N %Su:%Sg %Sp' "$plist"

    label="$(/usr/libexec/PlistBuddy -c 'Print :Label' "$plist" 2>/dev/null || true)"
    if [[ -n "$label" ]]; then
      printf '%s\n' "$plist :: $label" >> "$LABEL_GUESS_FILE"
      run_capture "launchctl-print-label-${base}.txt" /bin/sh -c "launchctl print gui/$(id -u)/$label || true"
    fi
  done < "$PLIST_GUESS_FILE"
fi

cat > "$OUTPUT_DIR/README.txt" <<EOF
MB-022 diagnostics bundle

This bundle is read-only evidence capture for Motherbrain gateway persistence.
It does not modify launchd state, install anything, or restart services.

Suggested next step:
- inspect plist-find.txt and label-guess.txt
- compare plutil output with docs/motherbrain/gateway-persistence-diagnosis-runbook-2026-04-03.md
- if needed, do a separate operator-approved bootstrap reproduction with stderr capture
EOF

log "Done. Review $OUTPUT_DIR/README.txt first."
