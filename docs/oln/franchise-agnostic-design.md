# OLN: Franchise Agnostic Design

## Overview
The Open Lore Network (OLN) ingestion pipeline is designed to be franchise-agnostic, supporting multiple Wikitext sources through a centralized configuration model.

## Lore Configuration (`lore_config.yaml`)
A generic configuration file defines franchise-specific patterns, prefixes, and sources.

```yaml
franchises:
  star_wars:
    source: "Wookieepedia"
    id_prefix: "SWLN"
    infobox_patterns: [...]
    link_regex: "\\[\\[(.*?)\\]\\]"
  star_trek:
    source: "Memory Alpha"
    id_prefix: "STLN"
    infobox_patterns: [...]
    link_regex: "\\[\\[(.*?)\\]\\]"
```

## Generic Parser (`parser.py`)
The `FranchiseParser` class replaces the legacy `WookieepediaParser`. It loads the configuration for a given franchise key and applies the relevant rules during extraction.

### Key Generalizations:
- **ID Generation:** Uses a configurable `id_prefix` (e.g., `SWLN`, `STLN`, `OLID`).
- **Source Attribution:** Dynamically assigns the source name based on the franchise.
- **Link Extraction:** Supports regex customization (though standard Wikitext links are common).
- **Template Detection:** Uses generic regex to identify top-level templates (Infoboxes) to determine entity types.

## Testing & Validation
The system was validated using a sample Star Trek XML (`data/oln/samples/memory-alpha-test.xml`). The parser successfully:
1. Identified the franchise as `star_trek`.
2. Applied the `STLN` prefix.
3. Correctly extracted links and infobox types (e.g., `Character`, `Starship`).
4. Attributed the source to `Memory Alpha`.

## Next Steps
- Implement specific `infobox_patterns` mapping for structured metadata extraction.
- Support non-MediaWiki XML formats (e.g., JSON exports or API responses).
- Integrate the franchise key into the Neo4j schema as a node label or property.
