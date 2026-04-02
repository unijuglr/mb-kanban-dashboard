# MB-082 — Decisions UI: actionable approval controls and response capture

Status: Done
Priority: P0 critical
Project: Motherbrain
Owner: Coder-1
Created: 2026-04-02
Last Updated: 2026-04-02
Completion Time: 2026-04-02 10:43 PDT

## Objective
Make the Decisions interface genuinely actionable by adding explicit decision-response controls: yes/no, multiple choice where applicable, and freeform human notes.

## Why It Matters
A decision log that only displays decisions without an obvious way to make them is operationally weak. The UI should support fast approvals, rejections, option selection, and nuanced human guidance.

## Scope
- add explicit human-response controls in the decision detail surface
- support binary approval/rejection
- support multiple-choice decisions where options are present
- always allow freeform notes / "2 cents"
- persist the response in the decision record in a simple, durable way

## Out of Scope
- enterprise auth
- multi-user workflow complexity
- polished workflow engine beyond the needed operator path

## Steps
- [x] inspect current decision data model and UI
- [x] add actionable controls to decision detail
- [x] persist decision response and notes through the existing write path or a minimal new one
- [x] verify the UX is obvious from a direct decision URL
- [x] document proof

## Artifacts
- `scripts/dev-server.mjs`
- `docs/decisions/`
- `PROOF_MB_082.md`
