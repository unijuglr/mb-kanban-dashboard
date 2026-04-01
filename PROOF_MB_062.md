# PROOF_MB_062 — Kanban Management Upgrade

Status: Done
Owner: Subagent (f40d8a6d)
Date: 2026-04-01

## Capabilities Implemented

### 1. Relative Priority & Sorting
- Updated `board-read-model.mjs` to sort cards within each status column by their `Priority` field (lexicographical sort handles P0-P3 well).
- Updated Board UI to prominently show priority chips.

### 2. Archive/Soft-Delete
- Added `Archive` to the canonical `STATUS_ORDER`.
- Configured safe transitions in `card-writes.mjs` allowing any card to move to `Archive`.
- Filtered `Archive` status out of the main `/board` view to keep it clean, effectively "soft-deleting" cards from the active board.

### 3. Rich Metadata
- Added four new fields to the markdown model:
  - `Assigned Coder`
  - `Start Time`
  - `Estimate`
  - `Completion Time`
- Updated the parser (`board-read-model.mjs`) and the writer (`card-writes.mjs`) to handle these fields.
- Updated the `/cards/:slug` detail view to display this metadata in a dedicated grid.
- Added these fields to the "Create Card" drawer on the board.

### 4. Artifact Provenance & Linking
- Updated the card detail view to parse the `Artifacts` section.
- Implemented a "View History" link for each artifact.
- Since artifacts are local files, the links point to a GitHub search for that filename within the repository, providing a jump to relevant commits/diffs.

## Data Model Changes
The following fields are now parsed and written to card markdown files:
- `Assigned Coder: <text>`
- `Start Time: <text>`
- `Estimate: <text>`
- `Completion Time: <text>`

The `Status` field now accepts `Archive`.

## Verification
- Modified `src/board-read-model.mjs` and `src/card-writes.mjs` successfully.
- Updated `scripts/dev-server.mjs` for UI/API support.
- Verified parser logic supports new fields.

## Artifacts Created/Updated
- `src/board-read-model.mjs`
- `src/card-writes.mjs`
- `scripts/dev-server.mjs`
- `PROOF_MB_062.md`
