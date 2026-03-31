# PROOF_MB_052

## What changed
- Added `createCardFromTemplate()` in `src/card-writes.mjs`.
- Added `POST /api/cards` to the local server.
- Added a board-side create-card form that writes a new markdown card into `docs/cards`.
- New cards are returned through the existing card/board APIs immediately after creation.

## Proof command
```bash
npm run proof:mb-052
```

## Proof output snapshot
```json
{
  "ok": true,
  "created": {
    "status": 201,
    "body": {
      "cardId": "MB-052",
      "slug": "mb-052",
      "filePath": "docs/cards/MB-052-create-new-card-from-template.md",
      "status": "Backlog"
    }
  },
  "duplicate": {
    "status": 409,
    "body": {
      "code": "duplicate_card"
    }
  },
  "invalid": {
    "status": 400,
    "body": {
      "code": "validation_error"
    }
  },
  "boardContainsCreatedCard": true
}
```

## Expected proof points
- valid create request writes a new markdown file in the temp fixture
- created card is immediately readable at `/api/cards/:id`
- created card appears on `/api/board`
- duplicate IDs are rejected with `409 duplicate_card`
- invalid payloads are rejected with `400 validation_error`
