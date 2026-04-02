import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from oln.resolution.olid_manager import OLIDManager

def run_proof():
    manager = OLIDManager(cache_path="data/oln/resolution_cache.json")
    
    print("--- 1. Generating an OLID ---")
    sw_luke_olid = manager.generate_olid("SW", "Luke Skywalker")
    print(f"Luke Skywalker -> {sw_luke_olid}")
    
    print("\n--- 2. Resolving Aliases ---")
    # Luke Skywalker (already generated)
    res1 = manager.resolve("SW", "Luke Skywalker")
    print(f"Resolve 'Luke Skywalker': {res1}")
    
    # Skywalker, Luke (comma reversal logic)
    res2 = manager.resolve("SW", "Skywalker, Luke")
    print(f"Resolve 'Skywalker, Luke': {res2}")
    
    # Adding an explicit alias
    manager.add_alias("SW", "Farmboy", sw_luke_olid)
    res3 = manager.resolve("SW", "Farmboy")
    print(f"Resolve 'Farmboy' (explicit alias): {res3}")
    
    print("\n--- 3. Handling a new entity ---")
    new_entity = "Ahsoka Tano"
    new_olid = manager.resolve("SW", new_entity)
    print(f"Resolve '{new_entity}': {new_olid}")

    # Output to markdown file for the final proof
    with open("PROOF_MB_029.md", "w") as f:
        f.write("# MB-029 OLN Resolution Engine Proof\n\n")
        f.write("## 1. Generating an OLID\n")
        f.write(f"- Entity: Luke Skywalker (Franchise: SW)\n")
        f.write(f"- Resulting OLID: `{sw_luke_olid}`\n\n")
        
        f.write("## 2. Resolving to the Same ID\n")
        f.write(f"- Input 'Luke Skywalker': `{res1}`\n")
        f.write(f"- Input 'Skywalker, Luke': `{res2}`\n")
        f.write(f"- Input 'Farmboy' (alias): `{res3}`\n\n")
        
        f.write("## 3. Handling a New Entity\n")
        f.write(f"- Input '{new_entity}': `{new_olid}`\n\n")
        f.write("## 4. Cache Check\n")
        f.write("Check `data/oln/resolution_cache.json` for persistence.\n")

if __name__ == "__main__":
    run_proof()
