import sys
import os
import asyncio

# Add project root to sys.path for local service imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.oln.orchestration.temporal.workflow import LoreIngestionWorkflow

async def prove_mb_031():
    """
    Validates the Temporal Workflow logic for the Star Wars Lore Network.
    """
    
    print("--- Running MB-031 QA: Temporal Orchestration ---")
    
    # 1. Initialize the workflow (stubbed)
    workflow = LoreIngestionWorkflow()
    
    # 2. Run a single page ingestion
    result = await workflow.run("Luke Skywalker")
    
    # 3. Verify results
    if "SUCCESS" in result:
        print(f"SUCCESS: Temporal workflow logic verified for '{result}'.")
        return True
    else:
        print(f"FAILURE: Expected success result, got '{result}'.")
        return False

if __name__ == "__main__":
    if asyncio.run(prove_mb_031()):
        sys.exit(0)
    else:
        sys.exit(1)
