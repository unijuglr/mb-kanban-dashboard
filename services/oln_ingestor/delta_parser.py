import xml.etree.ElementTree as ET
import re
import yaml
import os
import json
from datetime import datetime

class DeltaParser:
    """
    Handles incremental updates (deltas) from Wikitext XML dumps.
    Tracks revision IDs and timestamps to determine if a page needs updating.
    """
    
    def __init__(self, xml_path, state_path=None, franchise_key="default", config_path=None):
        self.xml_path = xml_path
        self.state_path = state_path or os.path.join(os.path.dirname(__file__), f'state_{franchise_key}.json')
        self.namespace = '{http://www.mediawiki.org/xml/export-0.10/}'
        
        # Load config
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), 'lore_config.yaml')
        
        with open(config_path, 'r') as f:
            full_config = yaml.safe_load(f)
            self.config = full_config.get('franchises', {}).get(franchise_key, full_config.get('franchises', {}).get('default'))
            self.franchise_key = franchise_key

        # Load state (last seen revision IDs)
        self.state = self._load_state()

    def _load_state(self):
        if os.path.exists(self.state_path):
            with open(self.state_path, 'r') as f:
                return json.load(f)
        return {"pages": {}}

    def _save_state(self):
        with open(self.state_path, 'w') as f:
            json.dump(self.state, f, indent=2)

    def parse_deltas(self):
        """
        Parses the XML and yields only pages that have a newer revision ID than stored in state.
        """
        # Using iterparse for memory efficiency with large XML dumps
        context = ET.iterparse(self.xml_path, events=('end',))
        
        for event, elem in context:
            if elem.tag == f'{self.namespace}page':
                title_node = elem.find(f'{self.namespace}title')
                title = title_node.text if title_node is not None else "Untitled"
                
                revision = elem.find(f'{self.namespace}revision')
                if revision is None:
                    elem.clear()
                    continue
                
                rev_id_node = revision.find(f'{self.namespace}id')
                rev_id = rev_id_node.text if rev_id_node is not None else "0"
                
                timestamp_node = revision.find(f'{self.namespace}timestamp')
                timestamp = timestamp_node.text if timestamp_node is not None else ""

                # Check if this revision is newer than what we have
                old_rev_id = self.state["pages"].get(title, {}).get("rev_id", "0")
                
                if int(rev_id) > int(old_rev_id):
                    text_node = revision.find(f'{self.namespace}text')
                    text = text_node.text if text_node is not None else ""
                    
                    # Yield the transformed entity
                    entity = self._transform_to_olid(title, text)
                    entity["metadata"]["revision_id"] = rev_id
                    entity["metadata"]["timestamp"] = timestamp
                    
                    yield entity
                    
                    # Update state
                    self.state["pages"][title] = {
                        "rev_id": rev_id,
                        "timestamp": timestamp,
                        "last_ingested": datetime.utcnow().isoformat()
                    }
                
                # Clear element from memory
                elem.clear()
        
        self._save_state()

    def _transform_to_olid(self, title, text):
        """
        Transforms raw page data into the canonical OLID structure.
        (Logic shared/mirrored from base parser)
        """
        link_regex = self.config.get('link_regex', r'\[\[(.*?)\]\]')
        links = re.findall(link_regex, text or "")
        clean_links = [l.split('|')[0] for l in links]
        
        infobox_type = "General"
        infobox_match = re.search(r'{{(.*?)}}', text or "", re.DOTALL)
        if infobox_match:
            first_line = infobox_match.group(1).split('\n')[0].strip()
            infobox_type = first_line.split('|')[0].strip()

        id_prefix = self.config.get('id_prefix', 'OLID')
        
        return {
            "olid": f"{id_prefix}:{title.replace(' ', '_')}",
            "title": title,
            "type": infobox_type,
            "operation": "UPDATE", # Explicitly mark as update for downstream
            "metadata": {
                "source": self.config.get('source', 'Unknown'),
                "franchise": self.franchise_key,
                "links": list(set(clean_links))
            },
            "raw_text_snippet": (text.strip()[:200] + '...') if text and len(text) > 200 else text.strip()
        }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        xml_file = sys.argv[1]
        franchise = sys.argv[2] if len(sys.argv) > 2 else "star_wars"
        # Optional: path to state file as 3rd arg
        state_file = sys.argv[3] if len(sys.argv) > 3 else None
        
        parser = DeltaParser(xml_file, state_path=state_file, franchise_key=franchise)
        for entity in parser.parse_deltas():
            print(json.dumps(entity, indent=2))
