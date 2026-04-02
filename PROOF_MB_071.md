# PROOF_MB_071 — Board render recovery + decisions action flow

Date: 2026-04-02
Owner: MB-Sam

## What was fixed
- `/board` now renders project swimlanes and card tiles server-side before any client JS runs.
- `/board` summary data now includes `readyCount` again.
- `/decisions` now has an action-triggered decision flow:
  - quick-start buttons (`Approve an approach`, `Reject an option`, `Record a tradeoff`)
  - blank decision action
  - "Record follow-up decision" and "Use as template" from the detail panel
  - post-create refresh selects the new decision and confirms it was recorded
- Decision JSON embedding now escapes `<` correctly for the inline bootstrap payload.

## Local verification
Verified on the local dev server with zero external spend.

### GET checks
- `GET /board` returned server-rendered swimlanes and visible card content (including `MB-048`).
- `GET /decisions` returned the new `Make a decision now` action panel and starter buttons.

### Write-path verification
Against a temp repo copy via `MB_ROOT`:
- `POST /api/decisions` successfully created `DEC-004`
- `GET /decisions` then showed `DEC-004` in the rendered page

## Files changed
- `scripts/dev-server.mjs`
- `src/board-read-model.mjs`

## Notes
This fix prioritizes reliability over polish: if client-side behavior flakes, the board still shows cards immediately instead of presenting an empty shell.
