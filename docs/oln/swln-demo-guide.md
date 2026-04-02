# Star Wars Lore Network (SWLN) Demo Guide

## Overview
The Star Wars Lore Network (SWLN) MVP demo provides a search and query interface for exploring character data and relationships within the OLN (Open Lore Network) framework.

## Components
- **API Wrapper**: `src/oln/demo/swln-api/api.py`
- **Underlying Storage**: `src/oln/storage/neo4j_client/client.py` (Neo4j integration)

## How to Run the Demo
1. Ensure you are in the `mb-kanban-dashboard` root directory.
2. Run the demo script using Python:
   ```bash
   export PYTHONPATH=$PYTHONPATH:.
   python3 src/oln/demo/swln-api/api.py
   ```

## Features Demonstrated
1. **Character Search**: Find entities by name or OLID (Open Lore Identifier).
   - Example query: "Skywalker"
2. **Relationship Traversal**: Explore master-apprentice connections.
   - Example query: "Who are the masters of Anakin Skywalker?"
3. **Data Provenance**: Display whether a node's data is sourced from Canon or Legends datasets.

## Artifacts Created
- `src/oln/demo/swln-api/api.py`: Core logic for the search and traversal interface.
- `docs/oln/swln-demo-guide.md`: This guide.

## Next Steps (MB-036+)
- Integrate with real Neo4j storage (requires Neo4j server access on Motherbrain).
- Expand data ingestion to full Wookieepedia exports.
- Implement incremental updates for newly discovered lore nodes.
