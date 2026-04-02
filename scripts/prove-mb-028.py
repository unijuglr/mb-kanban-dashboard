import sys
import os
import json

# Add project root to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.oln_ingestor.parser import WookieepediaParser

def main():
    sample_xml = 'data/oln/samples/wookieepedia-test.xml'
    
    # Ensure sample file exists
    if not os.path.exists(sample_xml):
        print(f"Error: {sample_xml} not found.")
        return

    print(f"--- Proving MB-028: Parsing {sample_xml} ---")
    parser = WookieepediaParser(sample_xml)
    
    entities = list(parser.parse())
    
    for entity in entities:
        print(f"Parsed OLID: {entity['olid']}")
        print(f"  Title: {entity['title']}")
        print(f"  Type: {entity['type']}")
        print(f"  Metadata Links: {entity['metadata']['links']}")
        print("-" * 30)

    # Verification: Check if expected OLIDs were created
    olids = [e['olid'] for e in entities]
    expected_olids = ['OLID:Luke_Skywalker', 'OLID:Tatooine']
    
    if all(olid in olids for olid in expected_olids):
        print("\nPASS: All expected OLIDs were correctly extracted.")
    else:
        print(f"\nFAIL: Missing expected OLIDs. Found: {olids}")

if __name__ == "__main__":
    main()
