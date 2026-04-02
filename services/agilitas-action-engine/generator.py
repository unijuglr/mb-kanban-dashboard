import json
from typing import Dict, Any, List

class AgilitasActionEngine:
    """
    Agilitas Action Generation Engine (Inner/Outer Loop).
    Generates recommended resolutions based on extracted customer signals and computed KPIs.
    """
    
    def __init__(self, use_cloud: bool = False):
        self.use_cloud = use_cloud

    def generate_action(self, kpi_data: Dict[str, Any], extraction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesizes raw signals and KPIs into actionable resolutions.
        """
        
        # 1. Loop Classification
        churn_prob = kpi_data.get('churn_probability', 0.0)
        loop_type = "Outer Loop" if churn_prob > 0.6 else "Inner Loop"
        
        # 2. Priority Determination
        priority = "Critical" if churn_prob > 0.8 else ("High" if churn_prob > 0.5 else "Standard")
        
        # 3. Recommendation Logic (Simplified RAG mock)
        recommendation = ""
        department = "Customer Success"
        
        if loop_type == "Outer Loop":
            recommendation = "Escalate to Product Management for immediate review and resolution."
            department = "Product Management"
        else:
            recommendation = "Provide targeted training and resources to improve user proficiency."
            department = "Customer Success"
            
        return {
            "loop_type": loop_type,
            "priority": priority,
            "department": department,
            "recommendation": recommendation,
            "kpi_context": {
                "churn_probability": churn_prob,
                "revenue_loss_potential": kpi_data.get('revenue_loss_potential', 0.0)
            }
        }

if __name__ == "__main__":
    # Basic usage test
    engine = AgilitasActionEngine()
    test_kpis = {"churn_probability": 0.85, "revenue_loss_potential": 12000.0}
    test_extraction = {"sentiment": "Negative", "pain_points": ["UI is confusing"]}
    result = engine.generate_action(test_kpis, test_extraction)
    print(json.dumps(result, indent=2))
