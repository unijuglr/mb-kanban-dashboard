import argparse
import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.oln.storage.neo4j_client.client import Neo4jClient

def main() -> int:
    argp = argparse.ArgumentParser(description="Verify MB-088 graph writes.")
    argp.add_argument("--uri", default=os.environ.get("OLN_NEO4J_URI", "http://127.0.0.1:7474"))
    argp.add_argument("--user", default=os.environ.get("OLN_NEO4J_USER", "neo4j"))
    argp.add_argument("--password", default=os.environ.get("OLN_NEO4J_PASSWORD", "password"))
    argp.add_argument("--database", default=os.environ.get("OLN_NEO4J_DATABASE", "neo4j"))
    args = argp.parse_args()

    client = Neo4jClient(uri=args.uri, user=args.user, password=args.password, database=args.database)
    
    # Check for Luke Skywalker and Tatooine specifically
    luke = client.query("MATCH (e:Entity {title: 'Luke Skywalker'}) RETURN e.olid as olid, labels(e) as labels")
    tatooine = client.query("MATCH (e:Entity {title: 'Tatooine'}) RETURN e.olid as olid, labels(e) as labels")
    
    # Check for relationship
    rel = client.query("MATCH (l:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(t:Entity {title: 'Tatooine'}) RETURN type(r) as type")

    result = {
        "luke_found": len(luke) > 0,
        "tatooine_found": len(tatooine) > 0,
        "relationship_found": len(rel) > 0,
        "luke_data": luke[0] if luke else None,
        "tatooine_data": tatooine[0] if tatooine else None
    }
    
    print(json.dumps(result, indent=2))
    
    if result["luke_found"] and result["tatooine_found"]:
        return 0
    else:
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
