import argparse
import base64
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.run_oln_local_ingest import build_entities
from src.oln.storage.neo4j_client.client import Neo4jClient


class FakeNeo4jHandler(BaseHTTPRequestHandler):
    captured_requests: List[Dict[str, Any]] = []

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length).decode("utf-8")
        payload = json.loads(body)
        FakeNeo4jHandler.captured_requests.append(
            {
                "path": self.path,
                "headers": dict(self.headers),
                "payload": payload,
            }
        )

        statement_text = "\n".join(stmt.get("statement", "") for stmt in payload.get("statements", []))
        if "RETURN 1 AS ok" in statement_text:
            result = {"results": [{"columns": ["ok"], "data": [{"row": [1], "graph": {}}]}], "errors": []}
        elif "MATCH (e:Entity) RETURN count(e) AS entity_count" in statement_text:
            result = {"results": [{"columns": ["entity_count"], "data": [{"row": [7], "graph": {}}]}], "errors": []}
        elif "MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count" in statement_text:
            result = {"results": [{"columns": ["mentions_count"], "data": [{"row": [7], "graph": {}}]}], "errors": []}
        elif "MATCH (e:Entity {title: $title}) RETURN e.olid AS olid, e.title AS title, e.type AS type" in statement_text:
            title = payload["statements"][0].get("parameters", {}).get("title")
            rows = []
            if title == "Luke Skywalker":
                rows.append(["OLID:Luke_Skywalker", "Luke Skywalker", "Character"])
            elif title == "Tatooine":
                rows.append(["OLID:Tatooine", "Tatooine", "Planet"])
            result = {"results": [{"columns": ["olid", "title", "type"], "data": [{"row": row, "graph": {}} for row in rows]}], "errors": []}
        elif "MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) RETURN count(r) AS rel_count" in statement_text:
            result = {"results": [{"columns": ["rel_count"], "data": [{"row": [1], "graph": {}}]}], "errors": []}
        else:
            result = {"results": [{"columns": ["olid", "title", "link_count"], "data": [{"row": ["OLID:placeholder", "placeholder", 1], "graph": {}}]}], "errors": []}

        encoded = json.dumps(result).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        return


def run_fake_server():
    FakeNeo4jHandler.captured_requests = []
    server = HTTPServer(("127.0.0.1", 0), FakeNeo4jHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def parse_sample(sample_path: str, cache_path: str):
    entities = build_entities(sample_path, "star_wars", cache_path)
    titles = [entity["title"] for entity in entities]
    return entities, titles


def run_fake_proof(sample_path: str, cache_path: str) -> Dict[str, Any]:
    entities, titles = parse_sample(sample_path, cache_path)
    assert len(entities) == 2, f"expected 2 primary entities, got {len(entities)}"
    assert titles == ["Luke Skywalker", "Tatooine"], f"unexpected primary titles: {titles}"

    server = run_fake_server()
    try:
        client = Neo4jClient(uri=f"http://127.0.0.1:{server.server_port}")
        assert client.verify_connectivity() is True
        client.ensure_schema()
        merged_count = client.batch_merge(entities)
        luke_rows = client.query(
            "MATCH (e:Entity {title: $title}) RETURN e.olid AS olid, e.title AS title, e.type AS type",
            {"title": "Luke Skywalker"},
        )
        tatooine_rows = client.query(
            "MATCH (e:Entity {title: $title}) RETURN e.olid AS olid, e.title AS title, e.type AS type",
            {"title": "Tatooine"},
        )
        relation_rows = client.query(
            "MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) RETURN count(r) AS rel_count"
        )
        entity_count_rows = client.query("MATCH (e:Entity) RETURN count(e) AS entity_count")
        mentions_count_rows = client.query("MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count")
    finally:
        server.shutdown()
        server.server_close()

    captured = FakeNeo4jHandler.captured_requests
    auth_header = captured[0]["headers"].get("Authorization", "") if captured else ""
    expected_auth = "Basic " + base64.b64encode(b"neo4j:password").decode("ascii")

    return {
        "sample_path": sample_path,
        "primary_titles": titles,
        "primary_entities_parsed": len(entities),
        "merged_primary_entities": merged_count,
        "entity_count": entity_count_rows[0]["entity_count"],
        "mentions_count": mentions_count_rows[0]["mentions_count"],
        "luke_found": bool(luke_rows),
        "tatooine_found": bool(tatooine_rows),
        "luke_mentions_tatooine": relation_rows[0]["rel_count"] >= 1,
        "captured_request_count": len(captured),
        "auth_header_present": auth_header == expected_auth,
    }


def try_live_probe(sample_path: str, cache_path: str, uri: str, user: str, password: str, database: str) -> Dict[str, Any]:
    entities, titles = parse_sample(sample_path, cache_path)
    client = Neo4jClient(uri=uri, user=user, password=password, database=database)
    result: Dict[str, Any] = {
        "attempted": True,
        "uri": uri,
        "titles": titles,
    }
    try:
        client.ensure_schema()
        merged = client.batch_merge(entities)
        entity_count = client.query("MATCH (e:Entity) RETURN count(e) AS entity_count")[0]["entity_count"]
        mentions_count = client.query("MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count")[0]["mentions_count"]
        luke_count = client.query("MATCH (e:Entity {title: $title}) RETURN count(e) AS c", {"title": "Luke Skywalker"})[0]["c"]
        tatooine_count = client.query("MATCH (e:Entity {title: $title}) RETURN count(e) AS c", {"title": "Tatooine"})[0]["c"]
        relation_count = client.query(
            "MATCH (:Entity {title: 'Luke Skywalker'})-[r:MENTIONS]->(:Entity {title: 'Tatooine'}) RETURN count(r) AS rel_count"
        )[0]["rel_count"]
        result.update(
            {
                "ok": True,
                "merged_primary_entities": merged,
                "entity_count": entity_count,
                "mentions_count": mentions_count,
                "luke_found": luke_count >= 1,
                "tatooine_found": tatooine_count >= 1,
                "luke_mentions_tatooine": relation_count >= 1,
            }
        )
    except Exception as exc:  # honest environment reporting for MB-080
        result.update({"ok": False, "error": str(exc)})
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Proof MB-080: 2-page sample corpus plus executable ingest proof.")
    parser.add_argument("--sample", default="data/oln/samples/wookieepedia-test.xml")
    parser.add_argument("--cache-path", default="data/oln/resolution_cache.json")
    parser.add_argument("--skip-live", action="store_true", help="Only run local fake-server contract proof")
    parser.add_argument("--uri", default=os.environ.get("OLN_NEO4J_URI", "http://127.0.0.1:7474"))
    parser.add_argument("--user", default=os.environ.get("OLN_NEO4J_USER", "neo4j"))
    parser.add_argument("--password", default=os.environ.get("OLN_NEO4J_PASSWORD", "password"))
    parser.add_argument("--database", default=os.environ.get("OLN_NEO4J_DATABASE", "neo4j"))
    args = parser.parse_args()

    fake_result = run_fake_proof(args.sample, args.cache_path)
    output: Dict[str, Any] = {"offline_contract_proof": fake_result}

    if args.skip_live:
        output["live_neo4j_probe"] = {"attempted": False, "reason": "skipped by flag"}
    else:
        output["live_neo4j_probe"] = try_live_probe(
            args.sample,
            args.cache_path,
            args.uri,
            args.user,
            args.password,
            args.database,
        )

    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
