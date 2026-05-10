import os
import sys
from typing import Dict, Any

# Ensure we can import from the repo root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from services.oln_ingestor.parser import FranchiseParser
from src.oln.resolution.olid_manager import OLIDManager
from src.oln.storage.neo4j_client.client import Neo4jClient

class LoreIngestionActivities:
    def __init__(self, neo4j_uri=None, neo4j_user=None, neo4j_password=None, cache_path="data/oln/resolution_cache.json"):
        self.neo4j_uri = neo4j_uri or os.environ.get("OLN_NEO4J_URI", "http://127.0.0.1:7474")
        self.neo4j_user = neo4j_user or os.environ.get("OLN_NEO4J_USER", "neo4j")
        self.neo4j_password = neo4j_password or os.environ.get("OLN_NEO4J_PASSWORD", "password")
        self.cache_path = cache_path

    async def parse_xml_chunk(self, xml_path: str, franchise_key: str) -> list:
        """
        Parses a local XML file into a list of entity dictionaries.
        """
        parser = FranchiseParser(xml_path, franchise_key=franchise_key)
        entities = list(parser.parse())
        return entities

    async def resolve_entities(self, entities: list, franchise_key: str) -> list:
        """
        Resolves OLIDs for a list of entities.
        """
        olid_manager = OLIDManager(cache_path=self.cache_path)
        for entity in entities:
            title = entity.get("title")
            entity["olid"] = olid_manager.resolve(franchise_key, title)
            # Normalize links to titles for the merge logic
            metadata = entity.get("metadata", {})
            links = metadata.get("links", [])
            metadata["links"] = [l.split("|", 1)[0].strip() for l in links]
            entity["metadata"] = metadata
        return entities

    async def merge_to_graph(self, entities: list) -> int:
        """
        Merges a batch of entities into Neo4j.
        """
        client = Neo4jClient(
            uri=self.neo4j_uri, 
            user=self.neo4j_user, 
            password=self.neo4j_password
        )
        client.ensure_schema()
        count = client.batch_merge(entities)
        return count

# For use with Temporal Worker (actual decorators would be added in the worker script)
activities = LoreIngestionActivities()
