# MB-004 — Enable early local coding agents on Motherbrain

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-03-30

## Objective
Get a minimal, stable local coding-agent environment working on Motherbrain so it can help build the rest of the system.

## Why It Matters
This creates compounding leverage early and aligns with the goal of Motherbrain becoming a real agent home.

## Scope
- decide execution model for local coding agents
- ensure workspace access on Motherbrain
- verify model/tool availability needed for coding tasks
- define safe initial operating pattern

## Out of Scope
- full autonomous hive behavior
- advanced retrieval or graph memory

## Steps
- [ ] define agent execution model
- [ ] ensure shared workspace conventions exist
- [x] verify coding-capable model/tool path
- [ ] create initial bootstrap/run instructions
- [ ] run a first validation task locally on Motherbrain

## Current Findings
- Motherbrain has Node, npm, Python, git, and OpenClaw installed.
- Motherbrain `openclaw status` works, but the LaunchAgent-managed local gateway is currently unreachable on `127.0.0.1:18789`.
- Manual foreground startup works successfully with `OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway run --port 18789 --verbose --tailscale off`.
- Existing local agent sessions and local Ollama-backed models are present, which suggests the environment is viable for early local agent use.
- Security audit on Motherbrain flags small-model sandbox concerns; we should treat this as a real requirement, not decoration.

## Blockers
- Depends on enough environment clarity to avoid building on sand.

## Artifacts
- future bootstrap doc
- future runbook
- future decision record

## Update Log
- 2026-03-30 — Card created as early execution priority.
