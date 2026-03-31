# MB-061 — Review Readiness Notes

Prepared on 2026-03-31 for the repo-cleanup / review path.

## What I checked
- Task graph in `mb_tasks.json`
- Current branch state via `git status`
- README / proof coverage for recent MB-05x work
- Proof sweep for shipped tasks:
  - passing: `proof:mb-011`, `012`, `013`, `021`, `030`, `031`, `032`, `033`, `041`, `042`, `050`, `052`, `053`
  - failing: `proof:mb-020`

## Review blockers / cleanup still needed

### 1) `proof:mb-020` is stale and currently fails
Current failure:
- `npm run proof:mb-020`
- error: `overview route missing expected copy`

Cause:
- `scripts/prove-mb-020.mjs` still asserts the old homepage text `Local read-only surface is live`
- `/` was later upgraded by MB-042 into the real overview/dashboard route

Why it matters for review:
- A proof script that fails on current HEAD makes the branch look broken even though the actual overview route is working and `proof:mb-042` passes.

Recommended cleanup:
- either retarget `proof:mb-020` to shell-level invariants that still exist
- or explicitly retire/replace it if MB-042 supersedes that coverage

### 2) Task gating is ahead of reality in `mb_tasks.json`
Observed state:
- `MB-060` = `ready`
- `MB-061` = `ready`
- `MB-062` = `ready`

But dependency chain says:
- `MB-061` depends on `MB-060`
- `MB-062` depends on `MB-061`

Why it matters for review:
- The task file currently overstates readiness and weakens the handoff / reviewer story.

Recommended cleanup:
- mark `MB-061` and `MB-062` as blocked/pending until MB-060 is actually complete
- or document that these are planning-ready states rather than dependency-satisfied states

### 3) `mb_metrics.json` is a volatile local-management artifact
Observed state during this pass:
- repo had a local modification in `mb_metrics.json`
- diff was management metadata only (`updated_at`, dispatch notes, wave assignment)

Why it matters for review:
- This file will create noisy diffs unless reviewers expect it to churn.

Recommended cleanup:
- decide whether it belongs in reviewable source control
- if yes, treat it as intentional operational state
- if no, move it to ignored/generated status before final review prep

## Good news
The current feature proofs beyond the stale MB-020 script are in decent shape:
- board read path works
- card/decision/update screens work
- metrics API and overview screen work
- guarded card status writes work
- create-card and create-decision flows work

## Suggested MB-061 exit criteria
- stale proof coverage reconciled (`MB-020` vs `MB-042`)
- task-state readiness story cleaned up in `mb_tasks.json`
- volatile artifact policy decided for `mb_metrics.json`
- optional: one short reviewer-facing checklist added to README or PR description
