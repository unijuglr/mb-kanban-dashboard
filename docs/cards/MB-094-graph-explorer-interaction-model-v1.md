# MB-094 — Graph Explorer interaction model v1

Status: Done
Priority: P0 critical
Project: OLN
Owner: Coder-2
Created: 2026-04-04
Last Updated: 2026-04-04

## Objective
Upgrade the live `/graph` route from a basic proof viewer into the first real explorer interaction model: grouped results, clear click semantics, defined navigation behavior, and visible relationship/path highlighting.

## Why It Matters
The graph route needs to behave like an explorer, not just render circles. Search-first exploration and trustworthy click behavior are the minimum viable interaction layer for validating OLN graph usefulness.

## Scope
- Group search results into entity / relationship / path buckets.
- Single click selects, inspects, and focuses the graph state.
- Double click navigates to a defined destination.
- Basic relationship and path highlighting.
- Proof on the live `/graph` route using existing proof-artifact data.

## Out of Scope
- DTS / MB-043 work.
- Paid services.
- Graph editing.
- New backend data sources beyond the committed OLN proof artifacts.

## Steps
- [x] Upgrade the live `/graph` screen interaction model.
- [x] Add grouped search result sections.
- [x] Wire single-click selection to inspector + focus behavior.
- [x] Define and ship double-click deep-link navigation.
- [x] Highlight relationships and basic paths.
- [x] Add repeatable QA proof.

## Artifacts
- `scripts/dev-server.mjs`
- `scripts/prove-mb-094.mjs`
- `PROOF_MB_094.md`
- `README.md`

## Completion Notes
- Shipped the interaction model directly on the real `/graph` route instead of a fake isolated component.
- Used the existing Luke/Tatooine proof-backed data only.
- Defined double-click navigation as a deep-linkable explorer destination: `/graph?selected=:id`.
- Added grouped entity / relationship / path results and lightweight highlighting behavior for relationship/path inspection.
