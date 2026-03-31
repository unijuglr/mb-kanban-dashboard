# PROOF_MB_050

## What changed
- Added guarded status-transition write logic in `src/card-writes.mjs`.
- Added `POST /api/cards/:id/status` to the local server.
- Enforced allowed transitions plus `expectedCurrentStatus` optimistic concurrency checks.
- Proof runs against a temporary copied `docs/` tree so real repo cards are not mutated.

## Proof command
```bash
npm run proof:mb-050
```

## Proof output snapshot
```json
{
  "ok": true,
  "targetCard": "MB-001",
  "before": {
    "status": "Ready",
    "lastUpdated": "2026-03-30"
  },
  "success": {
    "status": 200,
    "body": {
      "previousStatus": "Ready",
      "status": "In Progress",
      "lastUpdated": "2026-03-31"
    }
  },
  "invalid": {
    "status": 409,
    "body": {
      "code": "invalid_transition"
    }
  },
  "stale": {
    "status": 409,
    "body": {
      "code": "stale_status"
    }
  }
}
```

## Expected proof points
- valid `Ready -> In Progress` transition succeeds
- invalid `In Progress -> Done` jump is rejected with `409 invalid_transition`
- stale `expectedCurrentStatus` is rejected with `409 stale_status`
- underlying markdown file in the temp fixture is updated on the valid path
