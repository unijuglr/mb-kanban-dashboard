import json
import subprocess
import os

def run_test():
    base_dir = "/Users/adamgoldband/.openclaw/workspace/projects/mb-kanban-dashboard"
    api_script = os.path.join(base_dir, "src/oln/demo/swln-api/api.py")
    
    print("--- Running SWLN API Demo Script ---")
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{env.get('PYTHONPATH', '')}:{base_dir}"
    
    try:
        output = subprocess.check_output(["python3", api_script], env=env, text=True, stderr=subprocess.STDOUT)
        print(output)
        
        # Verify key outputs
        if "Anakin Skywalker" not in output:
            print("FAILED: Anakin Skywalker not found in demo output.")
            return False
        if "Luke Skywalker" not in output:
            print("FAILED: Luke Skywalker not found in demo output.")
            return False
        if "Obi-Wan Kenobi" not in output:
            print("FAILED: Obi-Wan Kenobi not found in demo output.")
            return False
            
        print("SUCCESS: SWLN API Demo verified.")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"FAILED: Demo script failed with error:\n{e.output}")
        return False

if __name__ == "__main__":
    if run_test():
        print("\n[PROVE MB-035] PASSED")
    else:
        print("\n[PROVE MB-035] FAILED")
        exit(1)
