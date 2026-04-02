import re
import json
import os
from pathlib import Path

class OLIDManager:
    def __init__(self, cache_path="data/oln/resolution_cache.json"):
        self.cache_path = Path(cache_path)
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache = self._load_cache()

    def _load_cache(self):
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return {"aliases": {}, "entities": {}}
        return {"aliases": {}, "entities": {}}

    def _save_cache(self):
        with open(self.cache_path, 'w') as f:
            json.dump(self.cache, f, indent=2)

    def _slugify(self, text):
        # Lowercase, replace non-alphanumeric with hyphens, strip double hyphens
        text = text.lower()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        return text.strip('-')

    def generate_olid(self, franchise, entity_name):
        f_slug = self._slugify(franchise)
        e_slug = self._slugify(entity_name)
        olid = f"oln-{f_slug}-{e_slug}"
        
        # Store in entities if not present
        if olid not in self.cache["entities"]:
            self.cache["entities"][olid] = {
                "canonical_name": entity_name,
                "franchise": franchise
            }
            self._save_cache()
        return olid

    def resolve(self, franchise, name):
        # Check aliases first
        lookup_key = f"{franchise.lower()}:{name.lower()}"
        if lookup_key in self.cache["aliases"]:
            return self.cache["aliases"][lookup_key]
        
        # Try standardizing "Last, First" to "First Last"
        if "," in name:
            parts = [p.strip() for p in name.split(",")]
            if len(parts) == 2:
                reversed_name = f"{parts[1]} {parts[0]}"
                # Generate OLID for the reversed name
                return self.generate_olid(franchise, reversed_name)

        # Default to generating/retrieving OLID for the provided name
        olid = self.generate_olid(franchise, name)
        return olid

    def add_alias(self, franchise, alias, canonical_olid):
        lookup_key = f"{franchise.lower()}:{alias.lower()}"
        self.cache["aliases"][lookup_key] = canonical_olid
        self._save_cache()
