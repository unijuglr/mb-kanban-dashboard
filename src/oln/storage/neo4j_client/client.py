import base64
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List, Optional


class Neo4jClient:
    """
    Minimal local-first Neo4j client for the bounded OLN vertical slice.

    Uses Neo4j's HTTP transactional endpoint so the write path stays dependency-free
    and works on Motherbrain without pulling extra Python packages.
    """

    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
        timeout_seconds: int = 10,
    ):
        self.uri = uri or os.environ.get("OLN_NEO4J_URI") or "http://127.0.0.1:7474"
        self.user = user or os.environ.get("OLN_NEO4J_USER") or "neo4j"
        self.password = password or os.environ.get("OLN_NEO4J_PASSWORD") or "password"
        self.database = database or os.environ.get("OLN_NEO4J_DATABASE") or "neo4j"
        self.timeout_seconds = timeout_seconds
        self.commit_url = self._build_commit_url(self.uri, self.database)
        self.base_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Basic {self._basic_auth_token(self.user, self.password)}",
        }

    @staticmethod
    def _basic_auth_token(user: str, password: str) -> str:
        raw = f"{user}:{password}".encode("utf-8")
        return base64.b64encode(raw).decode("ascii")

    @staticmethod
    def _build_commit_url(uri: str, database: str) -> str:
        normalized = uri.rstrip("/")
        if normalized.startswith("bolt://"):
            normalized = "http://" + normalized[len("bolt://") :]
        elif normalized.startswith("neo4j://"):
            normalized = "http://" + normalized[len("neo4j://") :]

        if normalized.endswith("/db/data/transaction/commit"):
            return normalized
        if normalized.endswith("/db/neo4j/tx/commit") or normalized.endswith("/tx/commit"):
            return normalized
        return f"{normalized}/db/{database}/tx/commit"

    def execute(self, statements: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        payload = json.dumps({"statements": list(statements)}).encode("utf-8")
        request = urllib.request.Request(self.commit_url, data=payload, headers=self.base_headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "ignore")
            raise RuntimeError(f"Neo4j HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Neo4j connection failed for {self.commit_url}: {exc}") from exc

        errors = body.get("errors") or []
        if errors:
            raise RuntimeError(f"Neo4j returned errors: {errors}")
        return body.get("results", [])

    def query(self, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        results = self.execute(
            [
                {
                    "statement": cypher,
                    "parameters": parameters or {},
                    "resultDataContents": ["row", "graph"],
                }
            ]
        )
        if not results:
            return []
        columns = results[0].get("columns", [])
        rows = []
        for record in results[0].get("data", []):
            row_values = record.get("row", [])
            rows.append(dict(zip(columns, row_values)))
        return rows

    def verify_connectivity(self) -> bool:
        rows = self.query("RETURN 1 AS ok")
        return bool(rows and rows[0].get("ok") == 1)

    def ensure_schema(self) -> bool:
        schema_statements = [
            "CREATE CONSTRAINT entity_olid IF NOT EXISTS FOR (e:Entity) REQUIRE e.olid IS UNIQUE",
            "CREATE INDEX entity_title_index IF NOT EXISTS FOR (e:Entity) ON (e.title)",
            "CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type)",
        ]
        self.execute({"statement": statement} for statement in schema_statements)
        return True

    @staticmethod
    def _normalize_olid(raw_title: str, explicit_olid: Optional[str] = None) -> str:
        if explicit_olid:
            return explicit_olid
        safe = (raw_title or "Untitled").replace(" ", "_")
        return f"OLID:{safe}"

    @staticmethod
    def _normalize_link_title(link_value: str) -> str:
        cleaned = (link_value or "").strip()
        if not cleaned:
            return "Unknown"
        cleaned = cleaned.split("#", 1)[0].strip()
        return cleaned or "Unknown"

    def merge_entity(self, entity: Dict[str, Any]) -> bool:
        olid = entity.get("olid") or self._normalize_olid(entity.get("title"))
        title = entity.get("title") or olid.replace("OLID:", "").replace("_", " ")
        entity_type = entity.get("type") or "Entity"
        metadata = entity.get("metadata") or {}
        links = [self._normalize_link_title(link) for link in metadata.get("links", []) if str(link).strip()]
        source = metadata.get("source")
        franchise = metadata.get("franchise")
        raw_text_snippet = entity.get("raw_text_snippet")
        now_ms = int(time.time() * 1000)

        cypher = """
        MERGE (e:Entity {olid: $olid})
        ON CREATE SET e.created_at = $now_ms
        SET e.title = $title,
            e.type = $type,
            e.source = $source,
            e.franchise = $franchise,
            e.raw_text_snippet = $raw_text_snippet,
            e.last_updated = $now_ms
        WITH e
        UNWIND $links AS link_title
        MERGE (target:Entity {olid: 'OLID:' + replace(link_title, ' ', '_')})
        ON CREATE SET target.created_at = $now_ms
        SET target.title = coalesce(target.title, link_title),
            target.type = coalesce(target.type, 'LinkedEntity'),
            target.source = coalesce(target.source, $source),
            target.franchise = coalesce(target.franchise, $franchise),
            target.last_updated = $now_ms
        MERGE (e)-[:MENTIONS]->(target)
        RETURN e.olid AS olid, e.title AS title, size($links) AS link_count
        """

        self.query(
            cypher,
            {
                "olid": olid,
                "title": title,
                "type": entity_type,
                "source": source,
                "franchise": franchise,
                "raw_text_snippet": raw_text_snippet,
                "links": links,
                "now_ms": now_ms,
            },
        )
        return True

    def batch_merge(self, entities: List[Dict[str, Any]]) -> int:
        for entity in entities:
            self.merge_entity(entity)
        return len(entities)

    def clear_entities(self) -> bool:
        self.query("MATCH (n:Entity) DETACH DELETE n RETURN count(n) AS deleted")
        return True


if __name__ == "__main__":
    client = Neo4jClient()
    test_entity = {
        "olid": "OLID:Luke_Skywalker",
        "title": "Luke Skywalker",
        "type": "Character",
        "metadata": {"source": "Wookieepedia", "franchise": "star_wars", "links": ["Tatooine", "Jedi Master"]},
    }
    client.ensure_schema()
    client.merge_entity(test_entity)
    print(client.query("MATCH (e:Entity {title: $title}) RETURN e.olid AS olid, e.title AS title", {"title": "Luke Skywalker"}))
