# MB-077 — Agilitas: fix local demo transcript and Ollama endpoint alignment

Status: Done
Priority: P0 critical
Project: Agilitas Solutions
Owner: Coder-1
Created: 2026-04-02
Last Updated: 2026-04-02

## Result
Replaced the invalid retail demo input with a checked-in synthetic transcript and aligned the local demo path so direct Motherbrain execution defaults to `127.0.0.1:11434`, while laptop-tunnel runs remain supported via `OLLAMA_HOST=http://127.0.0.1:11435`.

## Objective
Fix the broken local Agilitas demo inputs and endpoint assumptions so the local demo path is real and executable.

## Why It Matters
The planning tranche surfaced two concrete blockers: the retail demo transcript appears invalid and the Ollama endpoint assumptions may be mismatched.

## Scope
- validate and repair `data/demo/transcript_retail.txt`
- align Ollama endpoint assumptions in the local stack
- verify the demo input path is usable

## Out of Scope
- full pipeline redesign
- cloud paths

## Steps
- [x] inspect and repair the retail transcript input
- [x] verify local Ollama endpoint expectations across code/docs
- [x] update the minimum required code/docs for consistency
- [x] generate proof of successful local input + endpoint validation

## Artifacts
- `data/demo/transcript_retail.txt`
- `services/agilitas-ai-core/llm_client.py`
- `PROOF_MB_077.md`
