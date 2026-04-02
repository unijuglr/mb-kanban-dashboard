import sys
import os

# Add services/agilitas-business-engine to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/agilitas-business-engine')))

from scoring_engine import calculate_kpis

def test_mb_040():
    print("Running MB-040: Agilitas Deterministic Scoring Proof...")

    # Sample data: Sentiment Negative, 1 pain point, frustrated emotion, High effort, LTV 50k
    extraction_data = {
        "sentiment": "Negative",
        "pain_points": ["UI is slow"],
        "emotion": "Frustrated",
        "effort": "High"
    }
    customer_metadata = {
        "ltv": 50000.0
    }

    results = calculate_kpis(extraction_data, customer_metadata)

    print(f"Extraction Data: {extraction_data}")
    print(f"Customer Metadata: {customer_metadata}")
    print(f"Calculated KPIs: {results}")

    # Expected Values:
    # Sentiment (Negative) = 1.0
    # Pain points (1) = 0.5
    # Emotion (Frustrated) = 1.0
    # Churn Prob = (1.0 + 0.5 + 1.0) / 3.0 = 2.5 / 3.0 = 0.8333
    # Revenue Loss = 0.8333 * 50000 = 41666.67
    # Effort Score = 1.0 (High)

    assert 0.8 <= results["churn_probability"] <= 0.85
    assert 41000 <= results["revenue_loss_potential"] <= 42000
    assert results["effort_score"] == 1.0

    print("✅ MB-040 Proof Successful: Calculated KPIs match expectations.")

if __name__ == "__main__":
    try:
        test_mb_040()
    except Exception as e:
        print(f"❌ MB-040 Proof Failed: {str(e)}")
        sys.exit(1)
