# PROOF_MB_077 — Agilitas local demo transcript + Ollama endpoint alignment

Date: 2026-04-02
Card: MB-077
Status: PASS

## What changed
- Replaced `data/demo/transcript_retail.txt` with a real checked-in synthetic retail transcript.
- Updated `services/agilitas-ai-core/llm_client.py` so the local demo path defaults to Motherbrain-local Ollama on `http://127.0.0.1:11434`.
- Kept laptop tunnel support by honoring `OLLAMA_HOST`, e.g. `OLLAMA_HOST=http://127.0.0.1:11435`.
- Updated related docs/scripts so the direct-host path, tunnel override, and container path are no longer conflated.

## Why this was necessary
The previous `data/demo/transcript_retail.txt` was not a transcript at all. It contained this runtime failure text instead:

```text
Ollama Error: 404 Client Error: Not Found for url: http://127.0.0.1:11435/api/generate
```

That made the local demo path dishonest: the checked-in demo input was just a captured failure.

## Current local-path contract
- **Direct Motherbrain host execution:** default to `http://127.0.0.1:11434`
- **Adam laptop via SSH tunnel:** set `OLLAMA_HOST=http://127.0.0.1:11435`
- **Containerized compose path:** `http://host.docker.internal:11434`

## Validation
### 1) Transcript file is now a real synthetic input
Path: `data/demo/transcript_retail.txt`

The file now contains a plain-text retail onboarding/support transcript with:
- onboarding pain points
- frustration / effort cues
- a competitor mention
- improvement suggestions
- explicit PII tokens for later redaction proof

### 2) Endpoint defaults and override behavior were verified
Command run:

```bash
python3 - <<'PY'
import os, importlib.util, pathlib
path = pathlib.Path('services/agilitas-ai-core/llm_client.py')
spec = importlib.util.spec_from_file_location('llm_client', path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
Client = mod.AgilitasLLMClient

os.environ.pop('OLLAMA_HOST', None)
client_default = Client()
print('DEFAULT_HOST=', client_default.ollama_host)
print('DEFAULT_ENDPOINT=', client_default.ollama_endpoint)

os.environ['OLLAMA_HOST'] = 'http://127.0.0.1:11435/'
client_tunnel = Client()
print('TUNNEL_HOST=', client_tunnel.ollama_host)
print('TUNNEL_ENDPOINT=', client_tunnel.ollama_endpoint)
PY
```

Observed output:

```text
DEFAULT_HOST= http://127.0.0.1:11434
DEFAULT_ENDPOINT= http://127.0.0.1:11434/api/generate
TUNNEL_HOST= http://127.0.0.1:11435
TUNNEL_ENDPOINT= http://127.0.0.1:11435/api/generate
```

## Files updated
- `data/demo/transcript_retail.txt`
- `services/agilitas-ai-core/llm_client.py`
- `scripts/test_llm_client.py`
- `scripts/generate_demo_data.py`
- `docs/agilitas/motherbrain-local-stack-plan.md`
- `docs/motherbrain/dev-readiness-checklist.md`
- `docs/cards/MB-077-agilitas-fix-local-demo-transcript-and-ollama-endpoint-alignment.md`
- `mb_tasks.json`

## Outcome
MB-077 is complete. The local Agilitas demo path now has:
- an honest checked-in transcript input
- a sane default for Motherbrain-local Ollama
- an explicit tunnel override for laptop runs
- docs that describe the three execution contexts without pretending they are the same thing
