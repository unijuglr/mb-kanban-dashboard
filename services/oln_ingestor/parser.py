import xml.etree.ElementTree as ET
import re
import yaml
import os

class FranchiseParser:
    """
    Franchise-agnostic parser for Wikitext XML dumps.
    Converts XML pages into canonical OLID structures using configuration.
    """
    
    def __init__(self, xml_path, franchise_key="default", config_path=None):
        self.xml_path = xml_path
        self.namespace = '{http://www.mediawiki.org/xml/export-0.10/}'
        
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), 'lore_config.yaml')
        
        with open(config_path, 'r') as f:
            full_config = yaml.safe_load(f)
            self.config = full_config.get('franchises', {}).get(franchise_key, full_config.get('franchises', {}).get('default'))
            self.franchise_key = franchise_key

    def parse(self):
        """
        Parses the XML file and yields extracted entities based on franchise config.
        """
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        
        # Use localized namespace if available in XML, fallback to MediaWiki export-0.10
        # For now, stick with hardcoded namespace or extract from root if it's there.
        # Most wiki exports use the 0.10 namespace.

        for page in root.findall(f'.//{self.namespace}page'):
            title_node = page.find(f'{self.namespace}title')
            title = title_node.text if title_node is not None else "Untitled"
            
            revision = page.find(f'{self.namespace}revision')
            if revision is None: continue
            
            text_node = revision.find(f'{self.namespace}text')
            text = text_node.text if text_node is not None else ""
            
            yield self._transform_to_olid(title, text)

    def _transform_to_olid(self, title, text):
        """
        Transforms raw page data into the canonical OLID structure.
        """
        link_regex = self.config.get('link_regex', r'\[\[(.*?)\]\]')
        links = re.findall(link_regex, text or "")
        
        # Clean links (strip pipe for display names [[Target|Display]])
        clean_links = [l.split('|')[0] for l in links]
        
        # Infobox detection
        infobox_type = "General"
        infobox_match = re.search(r'{{(.*?)}}', text or "", re.DOTALL)
        if infobox_match:
            first_line = infobox_match.group(1).split('\n')[0].strip()
            # If it contains a pipe, the template name is before the pipe
            infobox_type = first_line.split('|')[0].strip()

        id_prefix = self.config.get('id_prefix', 'OLID')
        
        return {
            "olid": f"{id_prefix}:{title.replace(' ', '_')}",
            "title": title,
            "type": infobox_type,
            "metadata": {
                "source": self.config.get('source', 'Unknown'),
                "franchise": self.franchise_key,
                "links": list(set(clean_links))
            },
            "raw_text_snippet": (text.strip()[:200] + '...') if text and len(text) > 200 else text.strip()
        }

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        # Default to star_wars if not specified, for backward compatibility or simple testing
        franchise = sys.argv[2] if len(sys.argv) > 2 else "star_wars"
        parser = FranchiseParser(sys.argv[1], franchise_key=franchise)
        for entity in parser.parse():
            print(json.dumps(entity, indent=2))
