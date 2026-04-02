# HellaThis Relaunch Vision: Facts vs Files

## The Pivot: From File Search to Entity-Centric Knowledge

The current state of search is dominated by "File Search" (finding documents containing keywords). The HellaThis relaunch pivots to an **Entity-Centric Search Engine**, where the primary unit of retrieval is the **Fact**, not the **File**.

### Facts vs Files
- **Files (The Old Way):** Search returns a list of PDFs, Markdown files, or emails. The user must open each file to find the information they need.
- **Facts (The HellaThis Way):** Search returns a synthesized view of an entity. It resolves the query to a canonical ID (OLID) and pulls relevant facts from the Open Ledger Network (OLN) Fact Graph.

## Architecture: The Search Flow

The HellaThis search pipeline is designed to move from fuzzy intent to structured fact retrieval.

1.  **Query Input:** User provides a natural language query (e.g., "What is the battery life of the MK-1 model?").
2.  **OLID Resolution:** The system identifies the core entities in the query and resolves them to their **Open Ledger Identifier (OLID)**.
3.  **Entity Fact Graph (OLN) Traversal:** Using the OLIDs, the engine queries the **Open Ledger Network** to retrieve high-confidence facts, relationships, and attributes.
4.  **Ranked Results & Synthesis:** Facts are ranked based on relevance and provenance. The final output is a structured response that can be rendered as a "Knowledge Card" or a direct answer, with citations back to the source "Files" if needed.

## Strategic Goals
- **Canonical Truth:** Establish a single source of truth for entities across multiple data sources.
- **Interoperability:** Use OLIDs to link disparate datasets without data duplication.
- **Speed to Insight:** Reduce the "click-to-info" time by presenting facts directly in the search results.
