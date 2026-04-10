# MB Kanban Split Plan

**Owner of this plan:** Adam (with Claude + Sam collaborating)
**Created:** 2026-04-09
**Trigger:** Adam: "I would love for you to break up that app into logical
pieces. Agilitas is something else and should not have been in there, but I
don't want to lose it either. All of the OLN stuff that is in there should
not have been packaged as such, so it all needs to be split out. Especially
the graph viewer, which I wanted for OLN, not as part of that Kanban. Sam
just didn't understand."

## What this plan is — and isn't
This file is a plan. **Claude made no destructive changes to this repo.**
Sam's overnight swarm is still operating here and cutting files out from
under it would collide with its work and violate its truth-maintenance
doctrine. Everything listed below is "should eventually move out," not
"has been moved out."

## The split

### → `~/ai-projects/agilitas/` (new home, created 2026-04-09)
Everything Agilitas-related was copied here as a provenance snapshot:
- `services/agilitas-action-engine/`
- `services/agilitas-ai-core/`
- `services/agilitas-business-engine/`
- `services/agilitas_ingestor/`
- `src/agilitas/`
- `infra/agilitas/`
- `data/agilitas/`
- `docs/agilitas/`
- `scripts/qa_agilitas_pipeline.py`
- `scripts/test_agilitas_ingestor.py`
- `scripts/test_agilitas_redaction.py`
- All `docs/cards/MB-*agilitas*.md` cards → `agilitas/cards-from-mb/`

### → `~/ai-projects/oln/` (new home, created 2026-04-09)
Everything OLN-related was copied here as a provenance snapshot:
- `services/oln_ingestor/`
- `src/oln/`
- `src/graph-explorer/`    ← the crown jewel, Adam wanted this for OLN
- `infra/neo4j/schema.cypher`
- `infra/motherbrain/`
- `motherbrain-pipeline/`
- `data/oln/`
- `docs/oln/`
- `scripts/run_oln_local_ingest.py`
- `scripts/fetch_graph.py`
- OLN-related cards (`MB-027` through `MB-038`, `MB-072`, `MB-075`, `MB-080`,
  `MB-086` through `MB-089`, `MB-093` through `MB-097`) → `oln/cards-from-mb/`
- Matching `PROOF_MB_*.md` files + `PROOF_OLN_FIRST_INGEST.md` →
  `oln/proofs-from-mb/`

### Stays here: the actual MB Kanban Dashboard
- `src/app-data.mjs`, `board-read-model.mjs`, `card-writes.mjs`,
  `decision-models.mjs`, `decision-parser.mjs`, `decision-writes.mjs`,
  `decision-response-*.mjs`, `update-writes.mjs`, `updatesTimeline.js`,
  `metrics-api.mjs`
- `src/hellathis/` (MB-041, separate project but small — flag for Adam)
- `scripts/dev-server.mjs` and all the `scripts/prove-mb-*.mjs` proofs
- `docs/cards/` minus Agilitas/OLN cards
- `docs/decisions/`, `docs/updates/`
- `mb_tasks.json`, `mb_metrics.json`, `mb_metrics_backfill_report.json`
- `data/demo/`
- Root-level `PROOF_MB_*.md` files for Kanban-core tasks

## Card ID collisions to resolve

`mb_tasks.json` uses `MB-NNN` for everything, across all three logical
projects. There is at least one known collision:

- **MB-050** — both "agilitas-evaluation-suite" card AND Kanban "status
  write path" feature claim this ID. `docs/cards/` has only one file;
  the README claims the status write path. Possibly Sam reused the ID
  when the Agilitas card was deprecated. Needs audit.
- **MB-052** — similar pattern (agilitas-ui-adaptation vs. Kanban
  create-card endpoint). Needs audit.
- **MB-053** — similar pattern (agilitas-observability-costs vs. Kanban
  create-decision endpoint). Needs audit.

After the split:
- Agilitas cards should be renumbered `AG-NNN` in the Agilitas repo.
- OLN cards should be renumbered `OLN-NNN` in the OLN repo.
- `MB-NNN` stays reserved for actual MB Kanban Dashboard work.
- Provenance files in `cards-from-mb/` keep their original `MB-NNN` names.

## Also still here but probably shouldn't be
- `src/hellathis/` and `docs/cards/MB-041-hellathis-relaunch.md` — Claude
  has no idea what hellathis is. Looks like a third independent project.
  Flag for Adam on return.

## What Sam needs to know
Before any destructive cleanup happens in this repo:
1. Sam must be told about the split (by Adam, in whatever channel Sam
   reads from — likely a new decision log entry in `docs/decisions/`).
2. Sam's next cron pass should acknowledge the split in
   `MB_SAM_RUNTIME.md`.
3. Sam should stop writing new Agilitas or OLN work to this repo.
4. Sam (not Claude) should do the eventual delete-from-here pass, so
   it's integrated with Sam's branch / proof / truth-maintenance loop.

## What Claude will NOT do without Adam's explicit instruction
- Delete any file from this repo
- Modify `mb_tasks.json`
- Modify `docs/cards/MB-*.md`
- Touch any `feat/mb-*` branches
- Run any `scripts/prove-mb-*.mjs`
- Assume any card/task state from Sam's logs is stale
