# Motherbrain Local Coder QA Note — 2026-04-03

Scope: MB-024 / MB-025  
Author: Prime Sam  
Intent: backlog truth + rerun readiness only

## What is actually proven

- Historical notes in the current tree show earlier local/direct-Ollama coding evidence existed.
- A fresh bounded embedded-local proof run was captured under `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/`.
- That run is trustworthy as a **failure artifact**:
  - `command.txt` preserves the exact absolute-path invocation.
  - `request.txt` preserves the exact prompt.
  - `agent.log` captures the runtime error text.
  - `manifest.json` honestly records `outputs: []`.
- The current failure boundary is narrower than before:
  - bare `openclaw` launch-by-name is broken in this shell because the NVM bin path is missing from `PATH`
  - once launched by absolute path, the embedded local run still fails because Ollama is unreachable at `127.0.0.1:11434`
  - the agent payload explicitly reports `No API provider registered for api: ollama`

## What is not proven

- No fresh **model-mediated success** exists in the current tree for MB-024.
- No current-tree evidence shows `openclaw agent --local` producing requested files and validated execution output on demand.
- No evidence yet shows whether fixing shell PATH alone is enough; the provider/endpoint registration problem remains open.

## Readiness verdict

- **MB-024:** still open; proof bar not met.
- **MB-025:** still open; failure is better classified, but not repaired.
- These items are ready for another bounded rerun only after the environment checks below pass.

## Pre-rerun checklist

1. `openclaw --help` works by bare command name in the operator shell.
2. Intended Ollama endpoint is reachable from the same shell used for the proof run.
3. The local provider name/config expected by `openclaw agent --local` is present.
4. Target workspace is empty or freshly created before the run.
5. Artifact directory for the rerun is created up front with:
   - `command.txt`
   - `request.txt`
   - `agent.log`
   - `manifest.json`
   - `validation.txt`
   - `result.md`
6. The run is bounded by timeout and uses the same simple write/execute/readback contract.

## Pass / fail gate for the next rerun

Count the rerun as meaningful only if all of the following happen:
- requested source files are written to the target workspace
- the produced code is executed by a bounded validation command
- validation output is saved
- manifest records the produced files
- result note clearly labels the run as one of:
  - model-mediated success
  - deterministic fallback
  - manual repair
  - failure

If any of those are missing, the rerun is still diagnostic evidence, not a success proof.
