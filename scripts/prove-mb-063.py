import os
import sys

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '../..'))

# Dockerfile path
dockerfile_path = os.path.join(project_root, 'infra/agilitas/Dockerfile.agilitas-core-ai')
compose_path = os.path.join(project_root, 'infra/agilitas/docker-compose.yaml')

def prove_mb_063():
    print("--- Proving MB-063: Agilitas Containerization ---")
    
    # 1. Check for artifacts
    if not os.path.exists(dockerfile_path):
        print(f"FAILED: Dockerfile not found at {dockerfile_path}")
        return False
    if not os.path.exists(compose_path):
        print(f"FAILED: docker-compose.yaml not found at {compose_path}")
        return False
    
    print(f"SUCCESS: Docker artifacts confirmed.")
    print(f" - {dockerfile_path}")
    print(f" - {compose_path}")
    
    # 2. Check for service directories
    services = ['agilitas-ai-core', 'agilitas-business-engine', 'agilitas-action-engine']
    for service in services:
        service_path = os.path.join(project_root, 'services', service)
        if not os.path.exists(service_path):
            print(f"FAILED: Service directory {service_path} missing.")
            return False
    
    print(f"SUCCESS: All {len(services)} Agilitas service directories confirmed.")
    
    # 3. Final summary
    print("\nMB-063: Agilitas Containerization - PASS")
    return True

if __name__ == "__main__":
    if prove_mb_063():
        sys.exit(0)
    else:
        sys.exit(1)
