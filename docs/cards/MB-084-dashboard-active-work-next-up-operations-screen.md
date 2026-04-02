# MB-084 — Dashboard: active work / next-up operations screen

Status: Done
Priority: P0 critical
Project: Motherbrain
Owner: Coder-6
Created: 2026-04-02
Last Updated: 2026-04-02

## Objective
Add an operations screen (preferably `/`) that shows accurate up-to-the-minute active work, who is doing it, estimated completion timing, and queued-next work by agent.

## Why It Matters
Adam needs a truthful command view of what the swarm is actively doing and what each agent is expected to pick up next.

## Scope
- active work section
- by-agent ownership / role
- ETA or rough time-to-next-meaningful-update
- next-up queue section by agent
- make it useful as an operator control view

## Out of Scope
- fake real-time if no data exists
- enterprise project management complexity

## Steps
- [x] define minimum live data model for active work and queued-next
- [x] render active work clearly on the dashboard home screen
- [x] render next-up by agent below it
- [x] ensure operator view is honest about confidence / freshness
- [x] document proof

## Artifacts
- `scripts/dev-server.mjs`
- `src/metrics-api.mjs`
- `PROOF_MB_084.md`

## Update Log
- 2026-04-02 — Replaced the generic `/` overview with an operator-first dashboard showing active work, per-agent next-up queue, freshness labels, confidence notes, and explicit fallback to inferred local run-log data when no cards are marked in progress.
