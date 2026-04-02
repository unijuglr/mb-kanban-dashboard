import sys
import json
import os
from typing import Dict, List, Any

# Ensure we can import from src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.oln.storage.neo4j_client.client import Neo4jClient

def get_graph_data():
    client = Neo4jClient()
    
    # Query all nodes and relationships
    # We'll limit it to 1000 nodes for the MVP to keep it smooth
    cypher = """
    MATCH (n:Entity)
    OPTIONAL MATCH (n)-[r:MENTIONS]->(m:Entity)
    RETURN n, type(r) as rel_type, m
    LIMIT 2000
    """
    
    results = client.execute([
        {
            "statement": cypher,
            "parameters": {},
            "resultDataContents": ["graph"],
        }
    ])
    
    nodes = {}
    links = []
    
    if not results:
        return {"nodes": [], "links": []}

    for result in results:
        for data in result.get("data", []):
            graph = data.get("graph", {})
            
            for node in graph.get("nodes", []):
                node_id = node["id"]
                if node_id not in nodes:
                    props = node.get("properties", {})
                    nodes[node_id] = {
                        "id": node_id,
                        "olid": props.get("olid"),
                        "name": props.get("title") or props.get("olid") or f"Node {node_id}",
                        "type": props.get("type", "Unknown"),
                        "franchise": props.get("franchise", "Unknown"),
                        "source": props.get("source", "Unknown"),
                        "properties": props
                    }
            
            for rel in graph.get("relationships", []):
                links.append({
                    "source": rel["startNode"],
                    "target": rel["endNode"],
                    "type": rel["type"]
                })
    
    return {
        "nodes": list(nodes.values()),
        "links": links
    }

if __name__ == "__main__":
    try:
        print(json.dumps(get_graph_data()))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
