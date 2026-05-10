# MB-SAM-003: OLN Temporal Ingestion Refinement (v2)

- **State:** done
- **Owner:** Prime Sam
- **Target:** Motherbrain
- **Depends on:** MB-031, MB-032, MB-079

## Description

Refine the Star Wars Lore Network (OLN) ingestion pipeline by implementing a robust, franchise-agnostic set of Temporal activities and an updated workflow.

## Acceptance Criteria

- [x] Create `activities.py` with `parse_xml_chunk`, `resolve_entities`, and `merge_to_graph`.
- [x] Implement `workflow_v2.py` utilizing the new activities.
- [x] Verify the activity logic path with a proof script.
- [x] Document the proof in `PROOF_MB_SAM_003.md`.

## Notes

- This replaces the early stub workflow with a functional, albeit currently manual, activity-based pipeline.
- Infrastructure for a live Temporal worker remains a downstream ops task.
