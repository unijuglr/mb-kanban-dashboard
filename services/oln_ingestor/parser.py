import xml.etree.ElementTree as ET
import re

class WookieepediaParser:
    """
    Skeleton parser for Wookieepedia XML dumps.
    Converts XML pages into the canonical OLID structure.
    """
    
    def __init__(self, xml_path):
        self.xml_path = xml_path
        self.namespace = '{http://www.mediawiki.org/xml/export-0.10/}'

    def parse(self):
        """
        Parses the XML file and yields extracted entities.
        """
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        
        for page in root.findall(f'{self.namespace}page'):
            title = page.find(f'{self.namespace}title').text
            revision = page.find(f'{self.namespace}revision')
            text = revision.find(f'{self.namespace}text').text
            
            yield self._transform_to_olid(title, text)

    def _transform_to_olid(self, title, text):
        """
        Transforms raw page data into the canonical OLID structure.
        """
        # Basic link extraction: [[Link]] -> Link
        links = re.findall(r'\[\[(.*?)\]\]', text or "")
        
        # Simple infobox detection ({{Template ... }})
        infobox_match = re.search(r'{{(.*?)}}', text or "", re.DOTALL)
        infobox_type = None
        if infobox_match:
            infobox_type = infobox_match.group(1).split('\n')[0].strip()

        return {
            "olid": f"OLID:{title.replace(' ', '_')}",
            "title": title,
            "type": infobox_type or "General",
            "metadata": {
                "source": "Wookieepedia",
                "links": list(set(links))
            },
            "raw_text_snippet": (text[:200] + '...') if text and len(text) > 200 else text
        }

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        parser = WookieepediaParser(sys.argv[1])
        for entity in parser.parse():
            print(json.dumps(entity, indent=2))
