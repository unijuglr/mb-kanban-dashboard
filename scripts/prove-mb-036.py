import sys
import os
import json
import unittest
from datetime import datetime

# Add project root to sys.path for local service imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.oln_ingestor.delta_parser import DeltaParser
from src.oln.storage.neo4j_client.client import Neo4jClient

class TestIncrementalUpdates(unittest.TestCase):
    def setUp(self):
        # Create a temporary test XML with multiple revisions
        self.xml_path = "test_delta.xml"
        self.state_path = "test_state.json"
        self.config_path = "services/oln_ingestor/lore_config.yaml"
        
        with open(self.xml_path, "w") as f:
            f.write("""<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.10/">
  <page>
    <title>Luke Skywalker</title>
    <revision>
      <id>1001</id>
      <timestamp>2026-04-01T12:00:00Z</timestamp>
      <text>Luke is a Jedi Knight. [[Leia Organa]] is his sister.</text>
    </revision>
  </page>
  <page>
    <title>Darth Vader</title>
    <revision>
      <id>2001</id>
      <timestamp>2026-04-01T12:00:00Z</timestamp>
      <text>Vader is a Sith Lord. [[Anakin Skywalker]]</text>
    </revision>
  </page>
</mediawiki>""")

        if os.path.exists(self.state_path):
            os.remove(self.state_path)

    def tearDown(self):
        if os.path.exists(self.xml_path):
            os.remove(self.xml_path)
        if os.path.exists(self.state_path):
            os.remove(self.state_path)

    def test_incremental_flow(self):
        print("\n[QA] Starting Incremental Flow Test...")
        
        # 1. Initial Ingestion (Luke and Vader)
        parser = DeltaParser(self.xml_path, state_path=self.state_path, franchise_key="star_wars", config_path=self.config_path)
        entities = list(parser.parse_deltas())
        
        self.assertEqual(len(entities), 2, "Should ingest 2 new pages")
        self.assertEqual(entities[0]["title"], "Luke Skywalker")
        self.assertEqual(entities[1]["title"], "Darth Vader")
        print(f"[QA] Initial ingestion successful: {len(entities)} entities.")

        # 2. Run again with same file (Should yield 0)
        entities_again = list(parser.parse_deltas())
        self.assertEqual(len(entities_again), 0, "Should ingest 0 pages on repeat run with same rev_id")
        print("[QA] Idempotency check successful: 0 entities on repeat.")

        # 3. Create a delta file (Update Luke, keep Vader same)
        with open(self.xml_path, "w") as f:
            f.write("""<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.10/">
  <page>
    <title>Luke Skywalker</title>
    <revision>
      <id>1002</id>
      <timestamp>2026-04-02T01:00:00Z</timestamp>
      <text>Luke is a Jedi Grand Master now. [[Ahsoka Tano]]</text>
    </revision>
  </page>
  <page>
    <title>Darth Vader</title>
    <revision>
      <id>2001</id>
      <timestamp>2026-04-01T12:00:00Z</timestamp>
      <text>Vader is a Sith Lord. [[Anakin Skywalker]]</text>
    </revision>
  </page>
</mediawiki>""")

        # 4. Parse deltas (Should only yield Luke)
        entities_delta = list(parser.parse_deltas())
        self.assertEqual(len(entities_delta), 1, "Should only ingest 1 updated page")
        self.assertEqual(entities_delta[0]["title"], "Luke Skywalker")
        self.assertEqual(entities_delta[0]["metadata"]["revision_id"], "1002")
        print(f"[QA] Delta ingestion successful: Only '{entities_delta[0]['title']}' updated.")

        # 5. Verify Neo4j Client handles the "UPDATE" operation
        client = Neo4jClient(uri="bolt://motherbrain.local:7687")
        # In a real run, this would update the existing node in Neo4j
        for entity in entities_delta:
            success = client.merge_entity(entity)
            self.assertTrue(success)
        
        print("[QA] Neo4j Client update-merge simulation successful.")

if __name__ == "__main__":
    unittest.main()
