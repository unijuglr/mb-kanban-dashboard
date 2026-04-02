# PROOF_MB_023 — Motherbrain Kanban UI MVP

## Goal
Build a lightweight local UI over the file-backed Motherbrain Kanban system to visualize and manage tasks, decisions, and updates.

## Implementation Details
The UI is implemented as a single-file Node.js server (`scripts/dev-server.mjs`) that serves an HTML/CSS/JS dashboard.

### Key Components:
1.  **Overview Page**: High-level summary of the board state.
2.  **Metrics Page**: Visualizes run logs, success rates, and hourly utilization (MB-070).
3.  **Board Page**: Kanban-style view grouped by project with support for status transitions.
4.  **Decisions Page**: Lists system-level architectural decisions parsed from markdown.
5.  **Updates Page**: A chronological timeline of all project activity.
6.  **Card Detail**: Deep dive into individual task cards with action buttons.

### Technical Stack:
- **Backend**: Node.js `http` module (no heavy dependencies like Express).
- **Data Layer**: File-backed (`mb_tasks.json`, `docs/cards/*.md`, `docs/decisions/*.md`, `memory/*.md`).
- **Frontend**: Vanilla JS with embedded JSON hydration for fast, zero-dependency rendering.
- **Styling**: Modern CSS with dark mode, grid layouts, and responsive design.

## Verification
- Board renders all columns in `MB_STATUS_ORDER`.
- Card detail view correctly parses markdown and metadata.
- Metrics page hydrates correctly from SQLite run logs.
- New card creation and status updates verified via `src/card-writes.mjs`.

## Artifacts
- `scripts/dev-server.mjs`
- `src/app-data.mjs`
- `src/board-read-model.mjs`
- `src/card-writes.mjs`
- `src/decision-parser.mjs`
- `src/decision-writes.mjs`
- `src/update-writes.mjs`
- `src/updatesTimeline.js`
