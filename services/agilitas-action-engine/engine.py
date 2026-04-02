import os
import json

class AgilitasActionEngine:
    def __init__(self, docs_dir="docs"):
        self.docs_dir = docs_dir

    def get_context(self, query):
        """Mock RAG: Reads all files in docs_dir and returns as context."""
        context = ""
        for filename in os.listdir(self.docs_dir):
            if filename.endswith(".md"):
                with open(os.path.join(self.docs_dir, filename), "r") as f:
                    context += f.read() + "\n"
        return context

    def generate_action(self, kpi_data):
        """Simulates LLM call using prompt architecture."""
        context = self.get_context("client guidelines")
        
        # Simple rule-based logic for this mock implementation
        actions = []
        
        # Check Inventory Turnover (Target: 4.5)
        if kpi_data.get("inventory_turnover", 0) < 4.0:
            actions.append({
                "title": "Boost Inventory Turnover",
                "category": "Inventory",
                "urgency": "High",
                "description": f"Current turnover is {kpi_data['inventory_turnover']}, target is 4.5. Consider discounting slow-movers.",
                "jira_ticket": "INV-TURN-LOW: Discount slow-moving SKUs"
            })
            
        # Check Upsell Rate (Target: 15%)
        if kpi_data.get("upsell_rate", 0) < 0.12:
            actions.append({
                "title": "Review Upsell Strategy",
                "category": "Sales",
                "urgency": "Medium",
                "description": f"Upsell rate at {kpi_data['upsell_rate']*100}%. Target is 15%. Focus on accessories.",
                "jira_ticket": "SALE-UP-LOW: Review accessory upsell flow"
            })
            
        return actions

if __name__ == "__main__":
    engine = AgilitasActionEngine()
    mock_kpis = {"inventory_turnover": 3.8, "upsell_rate": 0.10}
    actions = engine.generate_action(mock_kpis)
    print(json.dumps(actions, indent=2))
