import argparse
import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.oln_ingestor.parser import FranchiseParser
from src.oln.resolution.olid_manager import OLIDManager
from src.oln.storage.neo4j_client.client import Neo4jClient


def build_entities(sample_path: str, franchise_key: str, cache_path: str):
    parser = FranchiseParser(sample_path, franchise_key=franchise_key)
    olid_manager = OLIDManager(cache_path=cache_path)
    entities = []
    for parsed in parser.parse():
        metadata = parsed.get("metadata", {})
        title = parsed.get("title")
        parsed["olid"] = olid_manager.resolve(franchise_key, title)
        normalized_links = []
        for link in metadata.get("links", []):
            normalized_links.append(link.split("|", 1)[0].strip())
        metadata["links"] = normalized_links
        parsed["metadata"] = metadata
        entities.append(parsed)
    return entities


def main() -> int:
    argp = argparse.ArgumentParser(description="Run the bounded OLN local ingest into Neo4j.")
    argp.add_argument("--sample", required=True, help="Path to the local sample XML file")
    argp.add_argument("--franchise", default="star_wars")
    argp.add_argument("--cache-path", default="data/oln/resolution_cache.json")
    argp.add_argument("--uri", default=os.environ.get("OLN_NEO4J_URI", "http://127.0.0.1:7474"))
    argp.add_argument("--user", default=os.environ.get("OLN_NEO4J_USER", "neo4j"))
    argp.add_argument("--password", default=os.environ.get("OLN_NEO4J_PASSWORD", "password"))
    argp.add_argument("--database", default=os.environ.get("OLN_NEO4J_DATABASE", "neo4j"))
    args = argp.parse_args()

    entities = build_entities(args.sample, args.franchise, args.cache_path)
    client = Neo4jClient(uri=args.uri, user=args.user, password=args.password, database=args.database)
    client.ensure_schema()
    merged_count = client.batch_merge(entities)

    entity_count = client.query("MATCH (e:Entity) RETURN count(e) AS entity_count")[0]["entity_count"]
    mentions_count = client.query("MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count")[0]["mentions_count"]

    summary = {
        "sample": args.sample,
        "primary_pages_parsed": len(entities),
        "entity_nodes_present": entity_count,
        "mentions_relationships_present": mentions_count,
        "primary_entities_written": merged_count,
        "failures": 0,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
