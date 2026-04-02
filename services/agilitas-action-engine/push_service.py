import requests
import json

class JiraPushService:
    def __init__(self, api_url=None):
        self.api_url = api_url or "http://localhost:8080/mock-jira"

    def push_action_as_ticket(self, action):
        """Simulates pushing a ticket to Jira."""
        print(f"Pushing action to Jira: {action['jira_ticket']}...")
        
        # This is a prototype mock push
        response_status = 201
        response_data = {
            "key": f"MB-{100 + len(action['jira_ticket'])}",
            "self": f"{self.api_url}/issue/MB-101",
            "status": "Created"
        }
        
        return response_data

if __name__ == "__main__":
    jira = JiraPushService()
    mock_action = {
        "title": "Boost Inventory Turnover",
        "jira_ticket": "INV-TURN-LOW: Discount slow-moving SKUs"
    }
    result = jira.push_action_as_ticket(mock_action)
    print(f"Jira result: {json.dumps(result, indent=2)}")
