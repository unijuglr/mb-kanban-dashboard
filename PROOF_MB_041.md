# PROOF MB-041: HellaThis Relaunch Vision & Architecture

## Task Overview
MB-041 involves defining the relaunch vision for HellaThis, specifically pivoting from a file-centric search to an entity-centric fact graph search.

## Results

### 1. Relaunch Vision Document
Created at `docs/hellathis/relaunch-vision.md`.
- Defined "Facts vs Files" search philosophy.
- Outlined the entity-centric pivot.
- Mapped the search flow: Query -> OLID Resolution -> Entity Fact Graph (OLN) -> Ranked Results.

### 2. Search API Schema Mockup
Created at `src/hellathis/search-api/response-schema.json`.
- Defined a JSON schema for the HellaThis Search API.
- Includes support for OLIDs, entity types (PERSON, PRODUCT, etc.), facts with predicates and values, confidence scores, and provenance (sources).

### 3. Task Tracking
Updated `mb_tasks.json` to include task `MB-041-HellaThis` (to avoid conflict with existing MB-041) as `in_progress` assigned to `Prime Sam (Subagent)`.

## Git History
Work committed to branch `feat/mb-041-hellathis-vision`.
