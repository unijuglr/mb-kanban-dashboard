# Motherbrain Local Coder Proof Run — 2026-04-03

Task: MB-024 / MB-025  
Author: Prime Sam  
Run ID: `2026-04-03-local-proof-abs-cli`

## Summary

A fresh bounded `openclaw agent --local` proof was executed with full artifact capture.

Result: **failed before any workspace files were produced**.

This run is still useful because it narrows the failure from vague "hangs sometimes" to a concrete launch/runtime condition in the current shell environment:
- invoking `openclaw` by bare command name fails because the NVM bin directory is not on `PATH`
- invoking the CLI by absolute path succeeds
- the embedded local agent run then fails quickly because Ollama is unreachable at `http://127.0.0.1:11434`
- the agent payload reports: `No API provider registered for api: ollama`

## Exact Invocation

See:
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/command.txt`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/request.txt`

## Preserved Artifacts

- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/agent.log`
- `artifacts/local-coder-runs/2026-04-03-local-proof-abs-cli/manifest.json`

## Observed Output

Key lines from the captured agent log:

```text
Ollama could not be reached at http://127.0.0.1:11434.
No API provider registered for api: ollama
```

The run returned JSON metadata naming provider `ollama-motherbrain` and model `qwen2.5-coder:14b`, but no generated files were written under the target workspace.

## Failure Classification

Primary classification: `launch_failure`

Secondary runtime classification once launched by absolute path: `routing_reject`

Why:
- the shell environment could not launch `openclaw` by name, which is a real launch-path defect for reproducible operator usage
- once launched by absolute path, the embedded local run could not reach/configure Ollama, so model-mediated work never began

## Validation Result

- target workspace existed
- target workspace remained empty
- no requested files (`solve.py`, `output.txt`, `README.md`) were created
- manifest captured zero outputs honestly

## What This Proves

- MB-024 is still **not** complete; there is still no successful current-tree model-mediated proof run
- MB-025 has a fresher, narrower failure boundary than before
- the next repair step is not guesswork; it is environment/runtime repair around the Ollama-backed local provider path

## Next Repair Steps

1. ensure the operator shell can invoke `openclaw` directly without an absolute path
2. verify the intended Ollama endpoint for local embedded runs and whether `127.0.0.1:11434` should instead route through the existing Motherbrain tunnel on `127.0.0.1:11435`
3. confirm the local provider registration/config expected by `openclaw agent --local`
4. rerun the same bounded proof contract after endpoint/provider repair

## Concise Rerun Protocol

Before rerunning, require all of the following:

1. `openclaw --help` succeeds by bare command name in the same shell that will run the proof.
2. The intended Ollama endpoint is reachable from that shell.
3. The target workspace starts empty.
4. The rerun artifact directory is pre-created and will contain at least:
   - `command.txt`
   - `request.txt`
   - `agent.log`
   - `manifest.json`
   - `validation.txt`
   - `result.md`

Count the rerun as success only if requested files are written, bounded validation is executed and saved, and the result note labels the run as model-mediated success rather than fallback/manual repair/failure.
