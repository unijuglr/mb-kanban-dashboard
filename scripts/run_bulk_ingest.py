import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.oln_ingestor.parser import FranchiseParser
from src.oln.resolution.olid_manager import OLIDManager
from src.oln.storage.neo4j_client.client import Neo4jClient


def build_entities(sample_path: str, franchise_key: str, cache_path: str, limit: Optional[int] = None) -> List[Dict]:
    parser = FranchiseParser(sample_path, franchise_key=franchise_key)
    olid_manager = OLIDManager(cache_path=cache_path)
    entities: List[Dict] = []

    for idx, parsed in enumerate(parser.parse(), start=1):
        if limit is not None and idx > limit:
            break
        metadata = parsed.get("metadata", {})
        title = parsed.get("title")
        parsed["olid"] = olid_manager.resolve(franchise_key, title)

        normalized_links = []
        seen_links = set()
        for link in metadata.get("links", []):
            normalized = link.split("|", 1)[0].strip()
            if normalized and normalized not in seen_links:
                seen_links.add(normalized)
                normalized_links.append(normalized)

        metadata["links"] = normalized_links
        parsed["metadata"] = metadata
        entities.append(parsed)

    return entities


def chunked(items: List[Dict], size: int):
    for start in range(0, len(items), size):
        yield items[start : start + size]


def main() -> int:
    argp = argparse.ArgumentParser(description="Run bulk OLN ingest into Neo4j with chunked writes.")
    argp.add_argument("--sample", required=True, help="Path to a MediaWiki XML file or subset")
    argp.add_argument("--franchise", default="star_wars")
    argp.add_argument("--cache-path", default="data/oln/resolution_cache.json")
    argp.add_argument("--uri", default=os.environ.get("OLN_NEO4J_URI", "http://127.0.0.1:7474"))
    argp.add_argument("--user", default=os.environ.get("OLN_NEO4J_USER", "neo4j"))
    argp.add_argument("--password", default=os.environ.get("OLN_NEO4J_PASSWORD", "password"))
    argp.add_argument("--database", default=os.environ.get("OLN_NEO4J_DATABASE", "neo4j"))
    argp.add_argument("--limit", type=int, default=None, help="Optional cap on primary pages parsed")
    argp.add_argument("--batch-size", type=int, default=25, help="Primary entity batch size per Neo4j write")
    argp.add_argument("--clear-first", action="store_true", help="Delete existing :Entity nodes before ingest")
    argp.add_argument("--summary-out", help="Optional path to write the JSON summary")
    args = argp.parse_args()

    started = time.time()
    entities = build_entities(args.sample, args.franchise, args.cache_path, limit=args.limit)
    parse_seconds = time.time() - started

    client = Neo4jClient(uri=args.uri, user=args.user, password=args.password, database=args.database)
    client.ensure_schema()
    if args.clear_first:
        client.clear_entities()

    write_started = time.time()
    merged_count = 0
    batch_durations = []
    total_links = 0

    for batch_index, batch in enumerate(chunked(entities, max(1, args.batch_size)), start=1):
        batch_link_count = sum(len((entity.get("metadata") or {}).get("links", [])) for entity in batch)
        total_links += batch_link_count
        batch_started = time.time()
        merged_count += client.batch_merge(batch, chunk_size=max(1, args.batch_size))
        batch_seconds = time.time() - batch_started
        batch_durations.append(
            {
                "batch": batch_index,
                "primary_entities": len(batch),
                "links": batch_link_count,
                "duration_seconds": round(batch_seconds, 4),
            }
        )

    write_seconds = time.time() - write_started
    total_seconds = time.time() - started

    entity_count = client.query("MATCH (e:Entity) RETURN count(e) AS entity_count")[0]["entity_count"]
    mentions_count = client.query("MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count")[0]["mentions_count"]

    summary = {
        "sample": args.sample,
        "primary_pages_parsed": len(entities),
        "primary_entities_written": merged_count,
        "entity_nodes_present": entity_count,
        "mentions_relationships_present": mentions_count,
        "primary_links_processed": total_links,
        "batch_size": max(1, args.batch_size),
        "batch_count": len(batch_durations),
        "parse_seconds": round(parse_seconds, 4),
        "write_seconds": round(write_seconds, 4),
        "total_seconds": round(total_seconds, 4),
        "primary_entities_per_second": round((len(entities) / total_seconds), 2) if total_seconds else None,
        "batches": batch_durations,
        "failures": 0,
    }

    if args.summary_out:
        out_path = Path(args.summary_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(summary, indent=2) + "\n")

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
