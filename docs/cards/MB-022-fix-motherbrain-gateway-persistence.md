# MB-022 — Fix Motherbrain gateway persistence

Status: Ready
Priority: P1 important
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

## Objective
Repair or replace the current LaunchAgent-based persistence path for the Motherbrain OpenClaw gateway.

## Why It Matters
The gateway runtime itself works, but service persistence currently fails, which prevents reliable post-reboot operability.

## Scope
- identify why `launchctl bootstrap` fails with domain error 125
- determine whether the current LaunchAgent model is valid on this host/session
- decide whether to fix launchd path or replace it with another supported startup path

## Out of Scope
- broader OpenClaw topology migration

## Steps
- [ ] classify the current launchd failure mode
- [ ] inspect alternative supported service start methods
- [ ] test a persistent startup path
- [ ] document rollback and expected behavior

## Blockers
- None currently.

## Artifacts
- `docs/motherbrain-operations.md`
- `docs/motherbrain-local-agent-bootstrap.md`

## Update Log
- 2026-03-30 — Card created after confirming manual gateway startup works but LaunchAgent startup does not.
