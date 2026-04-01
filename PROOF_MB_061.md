# PROOF_MB_061: Decisions UX Refresh

## Objective
Mirror the Board UX improvements (project swimlanes, drawer-based creation, project drill-in) onto the Decisions screen.

## Changes
1.  **Project Field**: Added `project` field to Decisions end-to-end (parsing, writing, API, and UI). Defaulted to `Motherbrain` for existing records.
2.  **Decisions UI**:
    -   Replaced inline 'Create new decision' panel with a right-edge drawer toggled by a vertical tab/handle.
    -   Grouped decisions by Project using swimlanes on the `/decisions` screen.
    -   Added a dedicated project drill-in route at `/decisions/projects/:projectName`.
    -   Preserved existing inspection/detail functionality.
3.  **API/Routing**:
    -   Updated `/api/decisions` and related shapes to include `project`.
    -   Added server-side routing for the new project-specific decision view.

## Verification
-   `dev-server.mjs` contains `drawer-handle` with "CREATE NEW DECISION".
-   `dev-server.mjs` contains `decisions-swimlanes` container for project grouping.
-   `decision-parser.mjs` and `decision-writes.mjs` updated to handle `Project:` field in markdown.
-   Project drill-in route `/decisions/projects/` registered in health check and server router.

## Commits
-   [MB-061] Mirror board UX improvements onto Decisions screen.
