# PROOF_MB_080 — OLN 2-page local sample corpus and executable ingest proof

## What changed
MB-080 again has current-tree proof artifacts for the bounded repo-side OLN ingest path:
- restored executable proof script: `scripts/prove-mb-080.py`
- preserved a committed proof output artifact from the current tree
- updated card/task state to reflect repo-side completion without claiming live Motherbrain Neo4j proof

## Canonical corpus confirmation
The committed sample corpus remains:
- `data/oln/samples/wookieepedia-test.xml`

It parses exactly these 2 primary pages:
- `Luke Skywalker`
- `Tatooine`

Observed link-derived references from the current tree:
- Luke Skywalker → `Galactic Civil War`, `Human`, `Jedi Master`, `Tatooine`
- Tatooine → `Arkanis sector`, `Outer Rim`, `Outer Rim Territories`

## Executable proof command
Offline repo-side proof plus saved output artifact:
```bash
python3 scripts/prove-mb-080.py --output docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json
```

Optional explicit live probe on a machine that actually has Neo4j running:
```bash
python3 scripts/prove-mb-080.py --probe-live
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
    "primary_link_titles": [
      [
        "Galactic Civil War",
        "Human",
        "Jedi Master",
        "Tatooine"
      ],
      [
        "Arkanis sector",
        "Outer Rim",
        "Outer Rim Territories"
      ]
    ],
    "merged_primary_entities": 2,
    "entity_count": 7,
    "mentions_count": 7,
    "luke_found": true,
    "tatooine_found": true,
    "luke_mentions_tatooine": true,
    "captured_request_count": 9,
    "auth_header_present": true,
    "schema_request_seen": true,
    "batch_merge_entity_count": 2
  },
  "live_neo4j_probe": {
    "attempted": false,
    "reason": "not requested; live Neo4j proof remains downstream MB-087/MB-088 work"
  }
}
```

## What this proof actually proves
### 1. The sample corpus is bounded and stable
The current committed XML sample still parses to exactly 2 primary pages with stable titles.

### 2. The repo ingest contract is executable on the current tree
The proof spins up a local Neo4j-compatible fake server and verifies that the current code:
- checks connectivity
- applies schema
- batch-merges both primary entities
- materializes the expected entity and relationship counts for the bounded corpus
- can query Luke Skywalker, Tatooine, and the Luke→Tatooine `MENTIONS` edge
- sends authenticated HTTP requests to the same transactional endpoint shape used by the real client

### 3. Live-host proof is not being faked
By default the script only proves the repo-side contract. A live probe is opt-in and remains downstream runtime work for MB-087/MB-088.

## Honest status
- MB-080 repo-side proof path: done again on the current tree
- Live Motherbrain Neo4j ingest proof: still not claimed here
- No DTS/Rockler work touched
