import sys
import os
import json

# Add project root to sys.path for local service imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.oln.storage.neo4j_client.client import Neo4jClient

def prove_mb_030():
    """
    Validates the Neo4j Client logic for the Star Wars Lore Network.
    """
    
    print("--- Running MB-030 QA: Neo4j Graph Schema & Insertion ---")
    
    # 1. Test data: Resolved OLIDs with lore relationships
    test_entities = [
        {
            "olid": "OLID:Skywalker_family",
            "title": "Skywalker family",
            "type": "Family",
            "metadata": {"links": ["Anakin Skywalker", "Luke Skywalker", "Leia Organa"]}
        },
        {
            "olid": "OLID:Anakin_Skywalker",
            "title": "Anakin Skywalker",
            "type": "Character",
            "metadata": {"links": ["Padmé Amidala", "Luke Skywalker", "Darth Vader"]}
        }
    ]

    # 2. Initialize the client (with stubbed driver)
    client = Neo4jClient(uri="bolt://motherbrain.local:7687")
    
    # 3. Perform batch merge
    count = client.batch_merge(test_entities)
    
    # 4. Verify results (in a real test, would query the actual DB)
    if count == 2:
        print(f"SUCCESS: {count} entities merged via OLID-bound graph logic.")
        return True
    else:
        print(f"FAILURE: Expected 2 entities merged, got {count}.")
        return False

if __name__ == "__main__":
    if prove_mb_030():
        sys.exit(0)
    else:
        sys.exit(1)
