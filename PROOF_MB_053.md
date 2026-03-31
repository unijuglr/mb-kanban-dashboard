# PROOF_MB_053

## What changed
- Added `createDecisionFromTemplate()` in `src/decision-writes.mjs`.
- Added `POST /api/decisions` to the local server.
- Added a decisions-side create-decision form that writes a new markdown decision into `docs/decisions`.
- New decisions are returned through the existing decisions API immediately after creation.

## Proof command
```bash
npm run proof:mb-053
```

## Proof output snapshot
```json
{
  "ok": true,
  "created": {
    "status": 201,
    "body": {
      "decisionId": "DEC-004",
      "slug": "dec-004",
      "filePath": "docs/decisions/DEC-004-create-new-decision-from-template.md",
      "status": "Proposed"
    }
  },
  "duplicate": {
    "status": 409,
    "body": {
      "code": "duplicate_decision"
    }
  },
  "invalid": {
    "status": 400,
    "body": {
      "code": "validation_error"
    }
  },
  "decisionsContainsCreatedDecision": true,
  "decisionsPageHasCreateForm": true
}
```

## Expected proof points
- valid create request writes a new markdown file in the temp fixture
- created decision is immediately readable at `/api/decisions/:id`
- created decision appears on `/api/decisions`
- decisions UI exposes the create-decision form
- duplicate IDs are rejected with `409 duplicate_decision`
- invalid payloads are rejected with `400 validation_error`
