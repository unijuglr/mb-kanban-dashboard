import json
import os
import subprocess
from services.oln_ingestor.delta_parser import DeltaParser

def run_test():
    workspace = "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
    v1_xml = os.path.join(workspace, "services/oln_ingestor/test_wiki_v1.xml")
    v2_xml = os.path.join(workspace, "services/oln_ingestor/test_wiki_v2.xml")
    state_file = os.path.join(workspace, "services/oln_ingestor/test_state.json")
    
    # Reset state
    if os.path.exists(state_file):
        os.remove(state_file)
    
    print("--- Phase 1: Initial Ingestion (v1) ---")
    parser1 = DeltaParser(v1_xml, state_path=state_file, franchise_key="star_wars")
    entities1 = list(parser1.parse_deltas())
    print(f"Ingested {len(entities1)} entities.")
    for e in entities1:
        print(f" - {e['title']} (rev {e['metadata']['revision_id']})")
    
    with open(state_file, 'r') as f:
        state1 = json.load(f)
        print(f"State after v1: {len(state1['pages'])} pages tracked.")

    print("\n--- Phase 2: Incremental Ingestion (v2) ---")
    parser2 = DeltaParser(v2_xml, state_path=state_file, franchise_key="star_wars")
    entities2 = list(parser2.parse_deltas())
    print(f"Ingested {len(entities2)} entities (deltas).")
    for e in entities2:
        print(f" - {e['title']} (rev {e['metadata']['revision_id']})")
    
    # Expected: Luke (1003 > 1001) and Leia (new) should be ingested. Han (1002 == 1002) should be skipped.
    titles = [e['title'] for e in entities2]
    if "Luke Skywalker" in titles and "Leia Organa" in titles and "Han Solo" not in titles:
        print("\n✅ PASS: Luke and Leia ingested, Han skipped as expected.")
    else:
        print("\n❌ FAIL: Delta ingestion logic did not return expected entities.")
        print(f"Returned: {titles}")

if __name__ == "__main__":
    run_test()
