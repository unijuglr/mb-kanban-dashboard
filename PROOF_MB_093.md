# PROOF_MB_093

Task: MB-093  
Date: 2026-04-04  
Branch: feat/mb-093-graph-route-repair

## Objective
Repair the live `/graph` and `/api/graph` routing in the dashboard so the actual running dev server serves proof-backed OLN graph data instead of 404s.

## What changed
- wired `/graph` into the running app shell in `scripts/dev-server.mjs`
- wired `/api/graph` into the running JSON API in `scripts/dev-server.mjs`
- added `/graph` and `/api/graph` to `/health`
- reused the existing committed proof-backed adapter in `src/graph-explorer/adapter.mjs`
- corrected card state/documentation so MB-089 is no longer overstated

## Proof data source
The repaired route uses committed OLN proof artifacts already in-tree:
- `docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json`
- `docs/cards/MB-088-oln-two-page-ingest-proof-into-local-neo4j.md`

No synthetic demo payloads were introduced.

## Executable QA

### Static sanity
```bash
node --check scripts/dev-server.mjs
node --check src/graph-explorer/adapter.mjs
node --check scripts/prove-mb-089.mjs
npm run proof:mb-089
```

### Actual running local dev server on port 4187
```bash
PORT=4187 node scripts/dev-server.mjs
curl -i http://127.0.0.1:4187/api/graph
curl -i http://127.0.0.1:4187/graph
curl -i http://127.0.0.1:4187/health
python3 - <<'PY'
import json, urllib.request
base = 'http://127.0.0.1:4187'
api = json.load(urllib.request.urlopen(base + '/api/graph'))
html = urllib.request.urlopen(base + '/graph').read().decode('utf-8')
health = json.load(urllib.request.urlopen(base + '/health'))
assert any(n['label'] == 'Luke Skywalker' for n in api['nodes'])
assert any(n['label'] == 'Tatooine' for n in api['nodes'])
assert any(e['source'] == 'entity:luke-skywalker' and e['target'] == 'entity:tatooine' for e in api['edges'])
assert 'Graph explorer' in html and 'graph-canvas' in html and 'Luke Skywalker' in html
assert '/graph' in health['routes'] and '/api/graph' in health['routes']
print(json.dumps({
  'ok': True,
  'nodeCount': api['summary']['nodeCount'],
  'edgeCount': api['summary']['edgeCount'],
  'sourceMode': api['source']['mode']
}, indent=2))
PY
```

## Observed results
- `GET /api/graph` returned `200 OK`
- `GET /graph` returned `200 OK`
- `GET /health` included both graph endpoints
- graph payload included `Luke Skywalker`, `Tatooine`, and the verified Luke → Tatooine edge
- graph page rendered the explorer shell and embedded proof-backed node data

Observed API summary:
```json
{
  "ok": true,
  "nodeCount": 9,
  "edgeCount": 9,
  "sourceMode": "proof-artifact"
}
```

## Honest boundary
This repair proves the real local dashboard route wiring now works. It does **not** newly prove live Neo4j-at-request-time reads or a true 3D rendering stack.
