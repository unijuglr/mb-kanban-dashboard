import json
from typing import Dict, Any, List, Optional
from src.oln.storage.neo4j_client.client import Neo4jClient

class SWLNApi:
    """
    Star Wars Lore Network (SWLN) Demo API.
    Provides methods to query the lore graph via Neo4jClient.
    """

    def __init__(self, client: Optional[Neo4jClient] = None):
        self.client = client or Neo4jClient()
        # Simulated data for the demo if Neo4j is not live
        self.is_simulated = True # Since the client.py is currently a stub
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
        """
        Search for characters by name or OLID.
        """
        print(f"[SWLN-API] Searching for: {query}")
        results = []
        
        # In a real implementation:
        # cypher = "MATCH (c:Character) WHERE c.title CONTAINS $query OR c.olid = $query RETURN c"
        
        query_lower = query.lower()
        for olid, data in self._sim_data.items():
            if query_lower in olid.lower() or query_lower in data['title'].lower():
                results.append(data)
        
        return results

    def get_relationships(self, olid: str, rel_type: str = "ALL") -> List[Dict[str, Any]]:
        """
        Traverse relationships for a given OLID.
        rel_type can be 'masters', 'apprentices', etc.
        """
        print(f"[SWLN-API] Getting {rel_type} for {olid}")
        
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
        """
        Get full details for a single node, including canonical/legends status.
        """
        return self._sim_data.get(olid)

if __name__ == "__main__":
    # Demo script usage
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
