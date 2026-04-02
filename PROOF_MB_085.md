# PROOF_MB_085

## What changed
- Added file-backed decision response persistence in `data/decision-responses.json` via `src/decision-response-store.mjs`.
- Wired decision responses into the decision API so each decision now exposes `latestResponse` and `responseHistory`.
- Added obvious approve/reject action controls, option selection, notes, save handling, and visible response history on both:
  - `/decisions?selected=dec-001`
  - `/decisions/dec-001`
- Added regression proof script: `scripts/prove-mb-085.mjs`.

## Verified behavior
### Fixture proof
Ran:
```bash
node --check scripts/dev-server.mjs
node scripts/prove-mb-085.mjs
```
Result:
- response controls rendered on both target routes
- approve/reject + option + notes persisted
- refresh returned saved history
- API returned latest response + full history

### Live verification on port 4187
Verified against the real running app after restarting the local dev server from this repo:
- `http://127.0.0.1:4187/decisions?selected=dec-001` rendered `decision-response-form`
- `http://127.0.0.1:4187/decisions/dec-001` rendered `decision-response-form`
- `POST /api/decisions/dec-001/responses` returned `201`
- saved note `live port 4187 verification` appeared after refresh on both routes
- `GET /api/decisions/dec-001` returned `latestResponse.action = "approve"` and `responseHistory.length = 1`

## Live persistence artifact
Current live persistence file:
- `data/decision-responses.json`

Current recorded live verification entry:
- decision: `dec-001`
- action: `approve`
- option: `Option B`
- note: `live port 4187 verification`

## Conclusion
MB-085 is working end-to-end on the actual operator routes, with real persistence and refresh-safe response history.
