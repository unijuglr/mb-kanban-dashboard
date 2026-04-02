import base64
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.run_oln_local_ingest import build_entities
from src.oln.storage.neo4j_client.client import Neo4jClient


class FakeNeo4jHandler(BaseHTTPRequestHandler):
    captured_requests = []

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length).decode("utf-8")
        payload = json.loads(body)
        FakeNeo4jHandler.captured_requests.append({
            "path": self.path,
            "headers": dict(self.headers),
            "payload": payload,
        })

        statement_text = "\n".join(stmt.get("statement", "") for stmt in payload.get("statements", []))
        if "RETURN 1 AS ok" in statement_text:
            result = {"results": [{"columns": ["ok"], "data": [{"row": [1], "graph": {}}]}], "errors": []}
        elif "MATCH (e:Entity) RETURN count(e) AS entity_count" in statement_text:
            result = {"results": [{"columns": ["entity_count"], "data": [{"row": [4], "graph": {}}]}], "errors": []}
        elif "MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count" in statement_text:
            result = {"results": [{"columns": ["mentions_count"], "data": [{"row": [5], "graph": {}}]}], "errors": []}
        else:
            result = {"results": [{"columns": ["olid", "title", "link_count"], "data": [{"row": ["OLID:Luke_Skywalker", "Luke Skywalker", 2], "graph": {}}]}], "errors": []}

        encoded = json.dumps(result).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        return


def run_fake_server():
    server = HTTPServer(("127.0.0.1", 0), FakeNeo4jHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main() -> int:
    sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "oln", "samples", "wookieepedia-test.xml")
    entities = build_entities(sample_path, "star_wars", os.path.join(os.path.dirname(__file__), "..", "data", "oln", "resolution_cache.json"))

    server = run_fake_server()
    try:
        client = Neo4jClient(uri=f"http://127.0.0.1:{server.server_port}")
        assert client.verify_connectivity() is True
        client.ensure_schema()
        merged = client.batch_merge(entities)
        entity_count = client.query("MATCH (e:Entity) RETURN count(e) AS entity_count")[0]["entity_count"]
        mentions_count = client.query("MATCH ()-[r:MENTIONS]->() RETURN count(r) AS mentions_count")[0]["mentions_count"]
    finally:
        server.shutdown()
        server.server_close()

    captured = FakeNeo4jHandler.captured_requests
    auth_header = captured[0]["headers"].get("Authorization", "") if captured else ""
    expected_auth = "Basic " + base64.b64encode(b"neo4j:password").decode("ascii")

    merge_payloads = [req for req in captured if any("MERGE (e:Entity {olid: $olid})" in stmt.get("statement", "") for stmt in req["payload"].get("statements", []))]
    constraint_payloads = [req for req in captured if any("CREATE CONSTRAINT entity_olid" in stmt.get("statement", "") for stmt in req["payload"].get("statements", []))]

    print(json.dumps({
        "merged_primary_entities": merged,
        "entity_count_query_result": entity_count,
        "mentions_count_query_result": mentions_count,
        "captured_request_count": len(captured),
        "auth_header_present": auth_header == expected_auth,
        "schema_request_seen": bool(constraint_payloads),
        "merge_requests_seen": len(merge_payloads),
    }, indent=2))

    assert merged == 2
    assert entity_count == 4
    assert mentions_count == 5
    assert auth_header == expected_auth
    assert constraint_payloads
    assert len(merge_payloads) == 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
