# PROOF_MB_082

## Goal
Make the Decisions UI actionable from a direct URL and durably capture human responses.

## What changed
- Added actionable decision-response controls to the decision detail surface in `scripts/dev-server.mjs`.
- Added durable response persistence in `src/decision-response-writes.mjs`.
- Extended the board read model in `src/board-read-model.mjs` to expose parsed option lists and saved responses.
- Added API write path: `POST /api/decisions/:id/respond`.
- Added persisted proof artifact: `docs/decisions/responses/DEC-001.responses.json`.

## UX delivered
From `/decisions?selected=dec-001`, the detail panel now shows:
- `Yes / Approve`
- `No / Reject`
- option chooser when structured options exist
- always-available notes / nuance textarea
- responder field
- response history list showing saved durable responses

The dedicated route `/decisions/dec-001` now shows the same response controls.

## Durable persistence proof
Response saved to:
- `docs/decisions/responses/DEC-001.responses.json`

Recorded proof response:
- decision: `DEC-001`
- outcome: `approve`
- selected option: `Option B`
- responder: `MB-082 proof`
- notes: `Local proof response for MB-082.`

## Local verification
### Static/runtime checks
- `node --check scripts/dev-server.mjs`
- `node --input-type=module -e "import('./src/board-read-model.mjs')..."`

### Live server verification
Used a clean local instance on port `4191`.

Verified via HTTP fetch that `/decisions?selected=dec-001` contains:
- `Yes / Approve`
- `No / Reject`
- `Notes / nuance (always available)`
- `data-decision-response-form`
- `Choose one of the recorded options`

Verified API write:
- `POST http://127.0.0.1:4191/api/decisions/dec-001/respond`
- returned `201`
- response payload included the newly persisted response and refreshed decision data

Verified dedicated route:
- `/decisions/dec-001` contains the actionable controls and the saved proof response text

## Files touched
- `scripts/dev-server.mjs`
- `src/board-read-model.mjs`
- `src/decision-response-writes.mjs`
- `docs/cards/MB-082-decisions-ui-actionable-approval-controls-and-response-capture.md`
- `docs/decisions/responses/DEC-001.responses.json`
- `mb_tasks.json`
- `PROOF_MB_082.md`
