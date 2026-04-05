# PROOF_MB_096.md

## Claim
MB-096 ships deterministic adaptive expansion and explicit intent modes on the live proof-backed `/graph` route without introducing live Neo4j or paid-service dependencies.

## Executable proof
```bash
node scripts/prove-mb-096.mjs
```

## What it verifies
- `/graph` exposes the four intent modes: `facts`, `story`, `relationships`, `debug`
- `/api/graph?intent=...` returns an `adaptive` ranking block derived from committed proof artifacts
- intent modes produce deterministic ranking/edge-emphasis differences
- shared graph state restores persisted `intentMode`
- MB-096 remains in the proof-artifact tranche only; no live Neo4j behavior is claimed

## Regression stack re-run
```bash
node scripts/prove-mb-089.mjs
node scripts/prove-mb-094.mjs
node scripts/prove-mb-095.mjs
node scripts/prove-mb-096.mjs
```

## Last verified
2026-04-04 on branch `feat/mb-096-graph-explorer-intent-modes`.
