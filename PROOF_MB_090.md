# PROOF_MB_090

## Summary
Implemented MB-090 with a surgical Decisions UI/runtime fix:
- added typed decision classification in `src/decision-models.mjs`
- refactored the actionable Decisions UI to render by type (`binary`, `multiple-choice`, `nuanced`)
- kept notes available for every decision type
- removed the broken mixed response-store/runtime path from `scripts/dev-server.mjs`
- kept `/api/decisions/:id/responses` working by translating legacy payload fields into the current file-backed response writer

## What changed
- `src/decision-models.mjs`
  - adds `classifyDecisionType(decision)`
  - adds `latestDecisionResponse(decision)`
- `scripts/dev-server.mjs`
  - imports/uses decision classification
  - exposes `decisionType`, `latestResponse`, and `responseHistory` in decision API responses
  - renders typed controls on `/decisions` and `/decisions/:id`
  - stops referencing the stale in-memory/store-envelope path
  - fixes legacy `/responses` handler to call the real file-backed response writer correctly
- `scripts/prove-mb-090.mjs`
  - fixture-based proof covering typed UI rendering and direct-route DEC-001 response persistence

## QA
### Command
```bash
node --check scripts/dev-server.mjs && node --check scripts/prove-mb-090.mjs
```
### Result
Passed with no output.

### Command
```bash
node scripts/prove-mb-090.mjs
```
### Result
```json
{
  "ok": true,
  "checkedRoutes": [
    "/decisions/dec-001",
    "/api/decisions/dec-001",
    "POST /api/decisions/dec-001/respond"
  ],
  "latestResponse": {
    "id": "dec-001-resp-3",
    "decisionId": "DEC-001",
    "decisionSlug": "dec-001",
    "createdAt": "2026-04-02T22:24:43.157Z",
    "responder": "MB-090 proof",
    "outcome": null,
    "selectedOption": "Option B",
    "notes": "MB-090 proof: direct-route typed response saved successfully."
  },
  "decisionType": {
    "key": "multiple-choice",
    "label": "Multiple choice",
    "options": [
      "Option A",
      "Option B",
      "Option C"
    ],
    "allowsBinary": false,
    "allowsOptionSelection": true,
    "notesAlwaysAvailable": true
  },
  "responseFile": "/var/folders/wt/yx4sr_2x1ygdm13773pjtz0r0000gn/T/mb-090-ITuheP/docs/decisions/responses/DEC-001.responses.json"
}
```

## Verification notes
- DEC-001 now renders as `Multiple choice`, not as a binary approve/reject decision.
- Notes remain available on the direct route.
- The intended direct route submission path (`POST /api/decisions/dec-001/respond`) persisted a response and was visible again after refresh.
- Proof runs against a temp fixture copy of `docs/` so repo decision history was not polluted by QA.
- The older `scripts/prove-mb-085.mjs` expectations are now stale because it asserts the pre-MB-090 binary/detail-form shape for DEC-001.

## Honesty check
This proof validates the actual route + API flow locally through the app server. It does not claim browser-click QA beyond what the route/API test exercised.
