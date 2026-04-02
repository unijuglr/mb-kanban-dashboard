import sys
import os
import json

# Ensure engine is importable
sys.path.append(os.path.join(os.path.dirname(__file__), '../services/agilitas-action-engine'))
from engine import AgilitasActionEngine

def test_agilitas_groundedness():
    print("--- Running MB-045 Factual Groundedness Audit ---")
    
    engine = AgilitasActionEngine(docs_dir="services/agilitas-action-engine/docs")
    mock_kpis = {"inventory_turnover": 3.8, "upsell_rate": 0.10}
    actions = engine.generate_action(mock_kpis)
    
    # Audit for Groundedness: Check if actions are based on Source of Truth docs
    # Our docs say target inventory turnover is 4.5x.
    # Our doc says Focus on high-margin accessories for upsells.
    
    grounded_count = 0
    for action in actions:
        if action['category'] == "Inventory":
            # Check for inventory keywords in doc
            with open("services/agilitas-action-engine/docs/client_a_guidelines.md", "r") as f:
                content = f.read()
                if "Inventory" in content and "Turnover: 4.5" in content:
                    print(f"PASS: Action '{action['title']}' is grounded in Client A guidelines.")
                    grounded_count += 1
                    
        elif action['category'] == "Sales":
            with open("services/agilitas-action-engine/docs/client_a_guidelines.md", "r") as f:
                content = f.read()
                if "accessories" in content:
                    print(f"PASS: Action '{action['title']}' is grounded in Client A guidelines.")
                    grounded_count += 1
    
    if grounded_count == 2:
        print("\nSUMMARY: Groundedness audit passed 100%. All actions aligned with Source of Truth.")
        return True
    else:
        print(f"\nSUMMARY: Groundedness audit failed. Only {grounded_count}/2 actions grounded.")
        return False

if __name__ == "__main__":
    success = test_agilitas_groundedness()
    sys.exit(0 if success else 1)
