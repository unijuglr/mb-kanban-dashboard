# PROOF_MB_077

Date: 2026-04-02
Branch: `feat/mb-077-agilitas-local-demo-alignment`

## Scope
Implemented the minimum needed to make MB-077 real for the Agilitas local demo path:
- repaired the broken retail transcript fixture
- aligned Ollama endpoint handling in `AgilitasLLMClient`
- updated the Motherbrain local demo doc to match the working fixture + endpoint contract

Excluded DTS / Rockler content entirely.

## Files Changed
- `data/demo/transcript_retail.txt`
- `services/agilitas-ai-core/llm_client.py`
- `docs/agilitas/motherbrain-demo-flow.md`
- `PROOF_MB_077.md`

## What Changed

### 1) Repaired retail transcript fixture
`data/demo/transcript_retail.txt` previously contained only an Ollama 404 error string.

It now contains a real synthetic retail transcript with the exact demo ingredients the doc expects:
- onboarding friction
- pain point
- frustration / effort cue
- competitor mention
- improvement suggestion
- explicit PII tokens for local redaction proof

### 2) Aligned Ollama endpoint assumptions
`services/agilitas-ai-core/llm_client.py` now:
- accepts `AGILITAS_OLLAMA_HOST`, `OLLAMA_ENDPOINT`, `OLLAMA_BASE_URL`, or `OLLAMA_HOST`
- treats those values as a base URL contract and appends `/api/generate` consistently
- normalizes a full endpoint passed via `OLLAMA_ENDPOINT`
- falls back to the working Motherbrain tunnel (`http://127.0.0.1:11435`) when the common local mismatch occurs (`OLLAMA_HOST=http://127.0.0.1:11434` but only the tunnel is reachable)

### 3) Updated doc contract
`docs/agilitas/motherbrain-demo-flow.md` now points to the repaired canonical fixture and documents the endpoint standard explicitly.

## Local QA

### QA 1 — transcript fixture sanity
Command:
```bash
python3 - <<'PY'
from pathlib import Path
p = Path('data/demo/transcript_retail.txt')
text = p.read_text()
print(f'path={p}')
print(f'chars={len(text)} lines={len(text.splitlines())}')
print('contains_error=', 'Ollama Error:' in text)
for needle in ['jamie@example.com', '415-555-0188', 'CompetitorCo', 'guided checklist']:
    print(f'{needle}=', needle in text)
PY
```

Output:
```text
path=data/demo/transcript_retail.txt
chars=650 lines=8
contains_error= False
jamie@example.com= True
415-555-0188= True
CompetitorCo= True
guided checklist= True
```

### QA 2 — endpoint resolution behavior
Command:
```bash
python3 - <<'PY'
import importlib.util
import os
import sys
import types
from pathlib import Path

fake_requests = types.ModuleType('requests')
fake_requests.exceptions = types.SimpleNamespace(RequestException=Exception)
sys.modules['requests'] = fake_requests

module_path = Path('services/agilitas-ai-core/llm_client.py')
spec = importlib.util.spec_from_file_location('llm_client', module_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
AgilitasLLMClient = module.AgilitasLLMClient
for key in ['AGILITAS_OLLAMA_HOST', 'OLLAMA_HOST', 'OLLAMA_BASE_URL', 'OLLAMA_ENDPOINT']:
    os.environ.pop(key, None)
client = AgilitasLLMClient()
print('default_base_url=', client.ollama_base_url)
print('default_endpoint=', client.ollama_endpoint)
os.environ['OLLAMA_HOST'] = 'http://host.docker.internal:11434'
client = AgilitasLLMClient()
print('host_base_url=', client.ollama_base_url)
print('host_endpoint=', client.ollama_endpoint)
os.environ.pop('OLLAMA_HOST', None)
os.environ['OLLAMA_ENDPOINT'] = 'http://127.0.0.1:11435/api/generate'
client = AgilitasLLMClient()
print('endpoint_base_url=', client.ollama_base_url)
print('endpoint_endpoint=', client.ollama_endpoint)
os.environ.pop('OLLAMA_ENDPOINT', None)
os.environ['OLLAMA_HOST'] = 'http://127.0.0.1:11434'
client = AgilitasLLMClient()
print('mismatch_base_url=', client.ollama_base_url)
print('mismatch_endpoint=', client.ollama_endpoint)
PY
```

Output:
```text
default_base_url= http://127.0.0.1:11435
default_endpoint= http://127.0.0.1:11435/api/generate
host_base_url= http://host.docker.internal:11434
host_endpoint= http://host.docker.internal:11434/api/generate
endpoint_base_url= http://127.0.0.1:11435
endpoint_endpoint= http://127.0.0.1:11435/api/generate
mismatch_base_url= http://127.0.0.1:11435
mismatch_endpoint= http://127.0.0.1:11435/api/generate
```

### QA 3 — live local Ollama smoke test through the resolved endpoint
Command:
```bash
python3 - <<'PY'
import importlib.util
import json
import os
import sys
import types
import urllib.request
import urllib.error
from pathlib import Path

os.environ.pop('AGILITAS_OLLAMA_HOST', None)
os.environ['OLLAMA_HOST'] = 'http://127.0.0.1:11434'
os.environ.pop('OLLAMA_BASE_URL', None)
os.environ.pop('OLLAMA_ENDPOINT', None)

class HTTPError(Exception):
    pass

class Response:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body
    def raise_for_status(self):
        if self.status_code >= 400:
            raise HTTPError(f'status={self.status_code}')
    def json(self):
        return json.loads(self._body)

class RequestsShim(types.ModuleType):
    class exceptions:
        RequestException = Exception
    @staticmethod
    def post(url, json=None, headers=None, timeout=60):
        data = None if json is None else __import__('json').dumps(json).encode('utf-8')
        merged_headers = {'Content-Type': 'application/json'}
        if headers:
            merged_headers.update(headers)
        req = urllib.request.Request(url, data=data, headers=merged_headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return Response(resp.status, resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return Response(e.code, e.read().decode('utf-8'))

sys.modules['requests'] = RequestsShim('requests')
module_path = Path('services/agilitas-ai-core/llm_client.py')
spec = importlib.util.spec_from_file_location('llm_client', module_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
client = module.AgilitasLLMClient()
print('resolved_endpoint=', client.ollama_endpoint)
response = client.complete("Reply with exactly one word: hello", provider='ollama')
print('response=', response)
print('is_error=', response.startswith('Ollama Error:'))
PY
```

Output:
```text
resolved_endpoint= http://127.0.0.1:11435/api/generate
response= hello
is_error= False
```

## Notes / Caveats
- The host `/usr/bin/python3` environment does **not** currently include the `requests` package, so the legacy `scripts/test_llm_client.py` script was not directly runnable in this bare environment.
- To keep QA local and zero-spend, I used inline Python shims for `requests` during verification instead of installing packages or invoking any paid service.
- Verified local Ollama access only; no cloud services were used.

## Result
MB-077 is materially real now:
- the demo transcript is usable
- the local Ollama client no longer bakes in a brittle endpoint assumption
- the doc and code now agree on how the local demo is supposed to run
