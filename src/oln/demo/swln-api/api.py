import json
from typing import Dict, Any, List, Optional
from src.oln.storage.neo4j_client.client import Neo4jClient


class SWLNApi:
    """
    Star Wars Lore Network (SWLN) Demo API.
    Uses live Neo4j when available and falls back to simulated demo data otherwise.
    """

    def __init__(self, client: Optional[Neo4jClient] = None):
        self.client = client or Neo4jClient()
        try:
            self.is_simulated = not self.client.verify_connectivity()
        except Exception:
            self.is_simulated = True
        self._sim_data = {
            "OLID:Anakin_Skywalker": {
                "olid": "OLID:Anakin_Skywalker",
                "title": "Anakin Skywalker",
                "type": "Character",
                "affiliation": "Jedi Order / Sith",
                "masters": ["OLID:Obi-Wan_Kenobi", "OLID:Darth_Sidious"],
                "apprentices": ["OLID:Ahsoka_Tano"],
                "summary": "The Chosen One who fell to the dark side.",
                "data_source": "Canon"
            },
            "OLID:Luke_Skywalker": {
                "olid": "OLID:Luke_Skywalker",
                "title": "Luke Skywalker",
                "type": "Character",
                "affiliation": "Rebel Alliance / Jedi Order",
                "masters": ["OLID:Obi-Wan_Kenobi", "OLID:Yoda"],
                "summary": "Son of Anakin Skywalker, hero of the Rebellion.",
                "data_source": "Canon"
            },
            "OLID:Obi-Wan_Kenobi": {
                "olid": "OLID:Obi-Wan_Kenobi",
                "title": "Obi-Wan Kenobi",
                "type": "Character",
                "affiliation": "Jedi Order",
                "masters": ["OLID:Qui-Gon_Jinn"],
                "summary": "Legendary Jedi Master.",
                "data_source": "Canon"
            }
        }

    def search_character(self, query: str) -> List[Dict[str, Any]]:
        print(f"[SWLN-API] Searching for: {query}")
        if not self.is_simulated:
            cypher = """
            MATCH (c:Entity)
            WHERE toLower(c.title) CONTAINS toLower($query)
               OR toLower(c.olid) CONTAINS toLower($query)
            RETURN c.olid AS olid, c.title AS title, c.type AS type, c.source AS data_source, c.franchise AS franchise
            ORDER BY c.title ASC
            LIMIT 25
            """
            return self.client.query(cypher, {"query": query})

        results = []
        query_lower = query.lower()
        for olid, data in self._sim_data.items():
            if query_lower in olid.lower() or query_lower in data['title'].lower():
                results.append(data)
        return results

    def get_relationships(self, olid: str, rel_type: str = "ALL") -> List[Dict[str, Any]]:
        print(f"[SWLN-API] Getting {rel_type} for {olid}")
        if not self.is_simulated:
            cypher = """
            MATCH (source:Entity {olid: $olid})-[r]->(target:Entity)
            WHERE $rel_type = 'ALL' OR type(r) = $rel_type
            RETURN type(r) AS type,
                   target.olid AS target_olid,
                   target.title AS target_title,
                   target.type AS target_type
            ORDER BY target.title ASC
            """
            rows = self.client.query(cypher, {"olid": olid, "rel_type": rel_type})
            return [
                {
                    "type": row["type"],
                    "target": {
                        "olid": row["target_olid"],
                        "title": row["target_title"],
                        "type": row["target_type"],
                    },
                }
                for row in rows
            ]

        if olid not in self._sim_data:
            return []

        data = self._sim_data[olid]
        results = []

        if rel_type == "masters" or rel_type == "ALL":
            for master_olid in data.get("masters", []):
                master_info = self._sim_data.get(master_olid, {"olid": master_olid, "title": "Unknown Master"})
                results.append({"type": "MASTER_OF", "target": master_info})

        if rel_type == "apprentices" or rel_type == "ALL":
            for apprentice_olid in data.get("apprentices", []):
                apprentice_info = self._sim_data.get(apprentice_olid, {"olid": apprentice_olid, "title": "Unknown Apprentice"})
                results.append({"type": "APPRENTICE_OF", "target": apprentice_info})

        return results

    def get_node_details(self, olid: str) -> Optional[Dict[str, Any]]:
        if not self.is_simulated:
            rows = self.client.query(
                "MATCH (e:Entity {olid: $olid}) RETURN e.olid AS olid, e.title AS title, e.type AS type, e.source AS source, e.franchise AS franchise, e.raw_text_snippet AS raw_text_snippet LIMIT 1",
                {"olid": olid},
            )
            return rows[0] if rows else None
        return self._sim_data.get(olid)


if __name__ == "__main__":
    api = SWLNApi()

    print("\n--- SWLN SEARCH DEMO ---")
    results = api.search_character("Skywalker")
    for r in results:
        print(f"Found: {r['title']} ({r['olid']})")

    print("\n--- SWLN RELATIONSHIP DEMO ---")
    anakin_olid = "OLID:Anakin_Skywalker"
    rels = api.get_relationships(anakin_olid, "masters")
    print(f"Masters of Anakin Skywalker:")
    for rel in rels:
        print(f" - {rel['target']['title']}")

    print("\n--- SWLN NODE DETAILS ---")
    luke = api.get_node_details("OLID:Luke_Skywalker")
    if luke:
        print(json.dumps(luke, indent=2))
