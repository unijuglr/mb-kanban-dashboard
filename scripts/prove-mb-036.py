import json
import os
import subprocess

def run_test():
    base_dir = "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard/services/oln_ingestor"
    v1_xml = os.path.join(base_dir, "test_wiki_v1.xml")
    v2_xml = os.path.join(base_dir, "test_wiki_v2.xml")
    state_file = os.path.join(base_dir, "test_state.json")
    delta_parser = os.path.join(base_dir, "delta_parser.py")

    # Ensure state file is clean
    if os.path.exists(state_file):
        os.remove(state_file)

    print("--- Running Initial Ingestion (v1) ---")
    # Ingest v1
    try:
        v1_output = subprocess.check_output(["python3", delta_parser, v1_xml, "star_wars", state_file], text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print(f"Subprocess failed with: {e.output}")
        return False
    
    print(f"Raw output: {repr(v1_output)}")
    v1_results = [json.loads(line) for line in v1_output.strip().split('\n') if line.strip()]
    
    print(f"Ingested {len(v1_results)} pages from v1.")
    for r in v1_results:
        print(f" - {r['title']} (rev {r['metadata']['revision_id']})")

    if len(v1_results) != 2:
        print("FAILED: Expected 2 pages from v1.")
        return False

    print("\n--- Running Delta Ingestion (v2) ---")
    # Ingest v2 (deltas)
    v2_output = subprocess.check_output(["python3", delta_parser, v2_xml, "star_wars", state_file], text=True)
    v2_results = [json.loads(line) for line in v2_output.strip().split('\n') if line.strip()]

    print(f"Ingested {len(v2_results)} pages from v2 deltas.")
    for r in v2_results:
        print(f" - {r['title']} (rev {r['metadata']['revision_id']})")

    # Expectations:
    # Luke Skywalker (rev 1003) - UPDATED
    # Leia Organa (rev 1004) - NEW
    # Han Solo (rev 1002) - SKIPPED (same as v1)
    
    titles = [r['title'] for r in v2_results]
    if "Luke Skywalker" not in titles or "Leia Organa" not in titles:
        print("FAILED: Missing expected updates in v2.")
        return False
    
    if "Han Solo" in titles:
        print("FAILED: Han Solo should have been skipped.")
        return False

    print("\n--- Final State Verification ---")
    with open(state_file, 'r') as f:
        state = json.load(f)
        print(f"State file has {len(state['pages'])} pages tracked.")
        if state['pages']['Luke Skywalker']['rev_id'] != "1003":
            print("FAILED: Luke Skywalker rev_id mismatch in state.")
            return False
        if state['pages']['Leia Organa']['rev_id'] != "1004":
            print("FAILED: Leia Organa rev_id mismatch in state.")
            return False

    print("\nSUCCESS: Delta ingestion verified.")
    return True

if __name__ == "__main__":
    if run_test():
        print("\n[PROVE MB-036] PASSED")
    else:
        print("\n[PROVE MB-036] FAILED")
        exit(1)
