# MB-025 — Repair live model-mediated local coding path

Status: Blocked
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-04

## Objective
Fix the current Motherbrain local agent path so a live `openclaw agent --local` coding task produces validated artifacts on demand.

## Why It Matters
This is the real trust test. If the live local coding path cannot produce code now, the rest of the Motherbrain build is standing on lies.

## Scope
- debug hanging `openclaw agent --local` invocation
- identify whether the issue is model/tool support, embedded local mode behavior, gateway interaction, or config/routing
- produce a successful live coding proof with saved artifacts

## Out of Scope
- long-term polish unrelated to the failing proof path

## Steps
- [ ] inspect logs/output for the failed live proof invocation
- [ ] identify exact failure mode of current `--local` path
- [ ] adjust invocation/model/routing strategy as needed
- [ ] rerun live proof until validated artifacts are produced
- [ ] document the working pattern or the blocking defect

## Blockers
- MB-024 has not yet produced a validated, repeatable local-coder proof on the current tree.
- The direct Ollama + executor harness is the practical workaround, but it does not prove the native `openclaw --local` path is healthy.
- The older evidence docs cited by this card are absent on the current checkout, so the repair path cannot honestly be treated as ready-now implementation work.

## Artifacts
- `docs/cards/MB-025-repair-live-local-coding-path.md`

## Update Log
- 2026-03-30 — Card created after a live proof task hung and produced no files in the target directory.
- 2026-04-04 — Reclassified from ready to blocked so the card matches `mb_tasks.json`: the defect is still real, but the current branch does not contain the proof assets needed to claim an executable repair tranche.
