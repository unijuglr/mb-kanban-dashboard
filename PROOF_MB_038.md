# PROOF: MB-038 (OLN: Franchise Generalization)

## Status: VERIFIED

## Completed Work
1.  **Lore Configuration:** Created `services/oln_ingestor/lore_config.yaml` to define franchise-specific rules (ID prefixes, source names, regex).
2.  **Generic Parser:** Updated `services/oln_ingestor/parser.py` to use `FranchiseParser` class. It now dynamically loads settings based on a `franchise_key`.
3.  **Test Sample:** Created `data/oln/samples/memory-alpha-test.xml` containing Star Trek Wikitext.
4.  **Verification:** Successfully ran the parser against the Star Trek sample, confirming `STLN` prefixes and `Memory Alpha` source attribution.
5.  **Documentation:** Created `docs/oln/franchise-agnostic-design.md` detailing the new architecture.

## Evidence
- **Parser Output (Star Trek):**
```json
{
  "olid": "STLN:James_T._Kirk",
  "title": "James T. Kirk",
  "type": "Character",
  "metadata": {
    "source": "Memory Alpha",
    "franchise": "star_trek",
    "links": ["USS Enterprise (NCC-1701)", "Starfleet", "Riverside, Iowa"]
  }
}
```

## Repository State
- Files committed and pushed to `main`.
- `mb_tasks.json` updated.
