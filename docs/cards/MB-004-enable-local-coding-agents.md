# MB-004 — Enable early local coding agents on Motherbrain

Status: Ready
Priority: P0 critical
Owner: Prime Sam
Created: 2026-03-30
Last Updated: 2026-04-03

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
- [ ] run a first validation task locally on Motherbrain with saved artifacts and bounded validation

## Current Findings
- Motherbrain has Node, npm, Python, git, and OpenClaw installed.
- Historical current-tree evidence still supports that manual foreground gateway startup worked with `OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway run --port 18789 --verbose --tailscale off`.
- MB-022 now has fresher host diagnostics showing the LaunchAgent is loaded, but the imported launchd job still carries `OLLAMA_HOST=http://127.0.0.1:11434` while the plist on disk shows `http://127.0.0.1:11435`; persistence is therefore still not honestly verified.
- MB-024/MB-025 now have a preserved bounded proof run showing the absolute-path CLI launches, but the local model-mediated path still produces zero files because bare-command PATH wiring is weak and the embedded local provider cannot reach/register Ollama at `127.0.0.1:11434`.
- Existing local agent sessions and local Ollama-backed models are present, which suggests the environment is viable for early local agent use once the runtime path is repaired.
- Security audit on Motherbrain flags small-model sandbox concerns; we should treat this as a real requirement, not decoration.

## Blockers
- MB-022: persistence is still unresolved; current evidence points to stale launchd/import drift and still needs an operator-approved reload/restart verification on Motherbrain.
- MB-024 / MB-025: there is still no current-tree successful model-mediated local coding proof with validated saved outputs.
- The operator shell still needs a reproducible bare-command `openclaw` path and a confirmed Ollama/provider route before MB-004 can honestly claim a stable bootstrap lane.

## Artifacts
- `docs/updates/2026-03-30-agent-enablement.md`
- `docs/updates/2026-03-30-local-coder-evidence.md`
- `docs/cards/MB-022-fix-motherbrain-gateway-persistence.md`
- `docs/cards/MB-024-prove-local-coder-reliability.md`
- `docs/cards/MB-025-repair-live-local-coding-path.md`

## Update Log
- 2026-04-03 — Rebased the card on current-tree evidence: manual gateway startup remains historically supported, but MB-022 persistence and MB-024/MB-025 local-coder reliability are still the honest blockers.
- 2026-03-30 — Card created as early execution priority.
