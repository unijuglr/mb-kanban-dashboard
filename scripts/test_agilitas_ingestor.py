import json
import os
import sys

# Set up project root in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from services.agilitas_ingestor.normalizer import AgilitasNormalizer

def test_normalization():
    normalizer = AgilitasNormalizer()
    
    # Paths
    zoom_sample_path = 'data/agilitas/samples/zoom-sample.json'
    teams_sample_path = 'data/agilitas/samples/teams-sample.vtt'
    
    # 1. Test Zoom JSON
    print("Testing Zoom JSON Normalization...")
    with open(zoom_sample_path, 'r') as f:
        zoom_data = json.load(f)
        normalized_zoom = normalizer.normalize_zoom_json(zoom_data)
        print(f"Normalized Zoom Data: {json.dumps(normalized_zoom, indent=2, default=str)}")
        assert normalized_zoom["agent"] == "Adam"
        assert len(normalized_zoom["parts"]) == 2

    # 2. Test Teams VTT
    print("\nTesting Teams VTT Normalization...")
    with open(teams_sample_path, 'r') as f:
        teams_vtt = f.read()
        normalized_teams = normalizer.normalize_teams_vtt(teams_vtt, "2026-04-02T11:00:00Z")
        print(f"Normalized Teams Data: {json.dumps(normalized_teams, indent=2, default=str)}")
        assert normalized_teams["agent"] == "Adam"
        assert normalized_teams["customer"] == "Client"
        assert len(normalized_teams["parts"]) == 2

    print("\nAll normalization tests passed!")

if __name__ == "__main__":
    test_normalization()
