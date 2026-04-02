# MB-003 — Verify active Ollama data path

Status: Done
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

## Objective
Determine which Ollama storage path is actually active and identify stale or duplicate locations.

## Why It Matters
Model storage is currently ambiguous, which makes migration risky and operations fuzzy.

## Scope
- inspect active Ollama runtime path usage
- compare `~/.ollama`, `/Volumes/hellastuff 1/ollama/.ollama`, and `/Volumes/hellastuff 1/ollama_models`
- identify canonical target recommendation

## Out of Scope
- executing migration

## Steps
- [ ] inspect active runtime references
- [ ] measure contents and timestamps of candidate locations
- [ ] determine active path and likely historical path
- [ ] draft migration recommendation

## Blockers
- None currently.

## Artifacts
- `docs/motherbrain-storage-plan.md`
- future decision record

## Update Log
- 2026-03-30 — Card created from initial audit.
