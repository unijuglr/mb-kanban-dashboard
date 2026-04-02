import json
import os
import sys
import importlib.util

# Set up project root in path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, project_root)

# Correctly import AgilitasNormalizer
module_path = os.path.join(project_root, 'services', 'agilitas_ingestor', 'normalizer.py')
spec = importlib.util.spec_from_file_location("agilitas_normalizer", module_path)
normalizer_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(normalizer_module)
AgilitasNormalizer = normalizer_module.AgilitasNormalizer

def test_normalization():
    normalizer = AgilitasNormalizer()
    
    # Paths relative to project root
    zoom_sample_path = os.path.join(project_root, 'data', 'agilitas', 'samples', 'zoom-sample.json')
    teams_sample_path = os.path.join(project_root, 'data', 'agilitas', 'samples', 'teams-sample.vtt')
    
    # 1. Test Zoom JSON
    print("Testing Zoom JSON Normalization...")
    if os.path.exists(zoom_sample_path):
        with open(zoom_sample_path, 'r') as f:
            zoom_data = json.load(f)
            normalized_zoom = normalizer.normalize_zoom_json(zoom_data)
            print(f"Normalized Zoom Data: {json.dumps(normalized_zoom, indent=2, default=str)}")
            # Sample data: participants: [{"name": "Adam", "role": "Host"}, {"name": "Client", "role": "Attendee"}]
            assert normalized_zoom["agent"] == "Adam"
            assert len(normalized_zoom["parts"]) >= 1
    else:
        print(f"Skipping Zoom JSON: {zoom_sample_path} not found.")

    # 2. Test Teams VTT
    print("\nTesting Teams VTT Normalization...")
    if os.path.exists(teams_sample_path):
        with open(teams_sample_path, 'r') as f:
            teams_vtt = f.read()
            normalized_teams = normalizer.normalize_teams_vtt(teams_vtt, "2026-04-02T11:00:00Z")
            print(f"Normalized Teams Data: {json.dumps(normalized_teams, indent=2, default=str)}")
            assert normalized_teams["agent"] == "Adam"
            assert normalized_teams["customer"] == "Client"
            assert len(normalized_teams["parts"]) >= 1
    else:
        print(f"Skipping Teams VTT: {teams_sample_path} not found.")

    print("\nAll normalization tests passed!")

if __name__ == "__main__":
    test_normalization()
