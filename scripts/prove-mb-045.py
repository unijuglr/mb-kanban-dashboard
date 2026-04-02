import sys
import os
import json

# Add project root to sys.path for local service imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.agilitas_action_engine.generator import AgilitasActionEngine

def prove_mb_045():
    """
    Validates the Agilitas Action Engine logic for both Inner and Outer loop generation.
    """
    
    print("--- Running MB-045 QA: Agilitas Action Engine ---")
    
    # 1. Test cases: High churn (Outer Loop) vs Low churn (Inner Loop)
    test_cases = [
        {
            "id": "High Churn (Outer)",
            "kpis": {"churn_probability": 0.85, "revenue_loss_potential": 12000.0},
            "extraction": {"sentiment": "Negative", "pain_points": ["System down for 2 hours"]}
        },
        {
            "id": "Low Churn (Inner)",
            "kpis": {"churn_probability": 0.25, "revenue_loss_potential": 500.0},
            "extraction": {"sentiment": "Neutral", "pain_points": ["Could use a dark mode"]}
        }
    ]

    engine = AgilitasActionEngine()
    results = []
    
    # 2. Generate actions for each case
    for case in test_cases:
        action = engine.generate_action(case['kpis'], case['extraction'])
        results.append(action)
        print(f"[ActionEngine] Generated {action['loop_type']} ({action['priority']}) for case: {case['id']}")
    
    # 3. Verify results
    if results[0]['loop_type'] == "Outer Loop" and results[1]['loop_type'] == "Inner Loop":
        print(f"SUCCESS: {len(results)} actions generated and correctly classified.")
        return True
    else:
        print(f"FAILURE: Incorrect loop classification.")
        return False

if __name__ == "__main__":
    if prove_mb_045():
        sys.exit(0)
    else:
        sys.exit(1)
