# PROOF_MB_080 — OLN 2-page local sample corpus and executable ingest proof

## What changed
MB-080 now has the missing repo-side proof artifacts for the bounded OLN vertical slice:
- confirmed 2-page local sample corpus: `data/oln/samples/wookieepedia-test.xml`
- added executable proof script: `scripts/prove-mb-080.py`
- added missing card file: `docs/cards/MB-080-oln-two-page-local-sample-corpus-and-executable-ingest-proof.md`

## Corpus confirmation
The canonical local sample contains exactly these 2 primary pages:
- `Luke Skywalker`
- `Tatooine`

Parsed link-derived references observed locally:
- Luke Skywalker → `Galactic Civil War`, `Jedi Master`, `Human`, `Tatooine`
- Tatooine → `Outer Rim`, `Outer Rim Territories`, `Arkanis sector`

## Executable proof command
```bash
python3 scripts/prove-mb-080.py
```

## Observed output
```json
{
  "offline_contract_proof": {
    "sample_path": "data/oln/samples/wookieepedia-test.xml",
    "primary_titles": [
      "Luke Skywalker",
      "Tatooine"
    ],
    "primary_entities_parsed": 2,
    "merged_primary_entities": 2,
    "entity_count": 7,
    "mentions_count": 7,
    "luke_found": true,
    "tatooine_found": true,
    "luke_mentions_tatooine": true,
    "captured_request_count": 9,
    "auth_header_present": true
  },
  "live_neo4j_probe": {
    "attempted": true,
    "uri": "http://127.0.0.1:7474",
    "titles": [
      "Luke Skywalker",
      "Tatooine"
    ],
    "ok": false,
    "error": "Neo4j connection failed for http://127.0.0.1:7474/db/neo4j/tx/commit: <urlopen error [Errno 61] Connection refused>"
  }
}
```

## What the proof actually proves
### 1. The sample corpus is bounded and stable
The proof parses exactly 2 primary pages from the committed local XML sample.

### 2. The ingest contract is executable without external services
The offline proof spins up a local Neo4j-compatible fake server and verifies that the repo code:
- checks connectivity
- applies schema
- merges both primary entities
- issues proof queries for Luke, Tatooine, node count, edge count, and Luke→Tatooine mentions
- sends authenticated HTTP requests to the Neo4j transactional endpoint shape used by the real client

### 3. Live status is reported honestly
The script also attempts a real local Neo4j probe by default. In this session, that probe failed because no Neo4j server was listening at `127.0.0.1:7474`.

That means MB-080 repo prep is complete, but the actual live-graph proof is **not** claimed here. That remains a real environment dependency for MB-088.

## Optional modes
Offline-only contract proof:
```bash
python3 scripts/prove-mb-080.py --skip-live
```

Live probe using explicit environment variables:
```bash
OLN_NEO4J_URI=http://127.0.0.1:7474 \
OLN_NEO4J_USER=neo4j \
OLN_NEO4J_PASSWORD='your-password' \
python3 scripts/prove-mb-080.py
```

## Honest status
- MB-080 repo-side proof artifacts: done
- Live Neo4j ingest proof on this machine: blocked by connection refusal
- No DTS/Rockler work touched
