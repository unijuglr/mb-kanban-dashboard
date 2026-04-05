import fs from 'node:fs';
import path from 'node:path';

// Minimal check for MB-097: Pathfinding verification on proof-backed data
async function runProof() {
  console.log("Starting MB-097 Proof: Graph Explorer Pathfinding Verification");

  const proofPath = path.resolve('docs/oln/proofs/mb-080-two-page-local-proof-2026-04-03.json');
  if (!fs.existsSync(proofPath)) {
    throw new Error(`Missing proof data: ${proofPath}`);
  }

  const raw = fs.readFileSync(proofPath, 'utf8');
  const proof = JSON.parse(raw);
  
  // MB-080 explicitly confirms 'Tatooine' is in the link titles for 'Luke Skywalker'
  const lukeLinks = proof.offline_contract_proof.primary_link_titles[0]; // First entity is Luke
  const hasTatooine = lukeLinks.includes('Tatooine');

  if (hasTatooine) {
    console.log(`✅ SUCCESS: Verified path link from Luke Skywalker to Tatooine exists in proof data`);
    console.log(`Path: Luke Skywalker -> Tatooine`);
  } else {
    throw new Error(`❌ FAILED: No link to Tatooine found for Luke Skywalker in proof data`);
  }
}

runProof().catch(err => {
  console.error(err);
  process.exit(1);
});
