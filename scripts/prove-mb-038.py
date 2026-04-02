import json
import os
from services.oln_ingestor.parser import FranchiseParser

def run_test():
    workspace = "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
    xml_path = os.path.join(workspace, "data/oln/samples/memory-alpha-test.xml")
    
    # Test Star Trek (Memory Alpha) generalization
    print("--- Testing Franchise Generalization (Star Trek) ---")
    parser = FranchiseParser(xml_path, franchise_key="star_trek")
    entities = list(parser.parse())
    
    expected_ids = ["STLN:James_T._Kirk", "STLN:USS_Enterprise_(NCC-1701)"]
    found_ids = [e["olid"] for e in entities]
    
    print(f"Ingested {len(entities)} entities with 'STLN' prefix.")
    for e in entities:
        print(f" - {e['olid']} (type: {e['type']})")
        if e['title'] == "James T. Kirk":
            if "Starfleet" in e['metadata']['links']:
                print("   ✅ Link 'Starfleet' extracted.")
            else:
                print("   ❌ Link 'Starfleet' NOT found.")

    if all(eid in found_ids for eid in expected_ids):
        print("\n✅ PASS: Star Trek entities correctly generalized and ingested.")
    else:
        print(f"\n❌ FAIL: Missing expected entities. Found: {found_ids}")

if __name__ == "__main__":
    run_test()
