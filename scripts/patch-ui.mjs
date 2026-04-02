import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'dev-server.mjs');

let content = fs.readFileSync(filePath, 'utf8');

// Edit 1: Metadata grid
// Use string concatenation to avoid template literal interpolation in the script itself
content = content.replace(
  '<article class="card"><div class="muted tiny">Owner</div><div class="kpi" style="font-size: 1.1rem;" id="card-owner">${escapeHtml(card.owner)}</div></article>\n        <article class="card"><div class="muted tiny">Last updated</div><div class="kpi" style="font-size: 1.1rem;" id="card-updated-at">${escapeHtml(card.updatedAt)}</div></article>',
  '<article class="card"><div class="muted tiny">Owner</div><div class="kpi" style="font-size: 1.1rem;" id="card-owner">${escapeHtml(card.owner)}</div></article>\n        <article class="card"><div class="muted tiny">Project</div><div class="kpi" style="font-size: 1.1rem;" id="card-project-name">${escapeHtml(card.project)}</div></article>\n        <article class="card"><div class="muted tiny">Last updated</div><div class="kpi" style="font-size: 1.1rem;" id="card-updated-at">${escapeHtml(card.updatedAt)}</div></article>'
);

// Edit 2: DOM elements
content = content.replace(
  "const ownerEl = document.getElementById('card-owner');\n          const updatedEl = document.getElementById('card-updated-at');",
  "const ownerEl = document.getElementById('card-owner');\n          const projectEl = document.getElementById('card-project-name');\n          const updatedEl = document.getElementById('card-updated-at');"
);

// Edit 3: Apply card data
content = content.replace(
  "priorityEl.textContent = cardData.priority || 'Unknown';\n            ownerEl.textContent = cardData.owner || 'Unknown';\n            assignedCoderEl.textContent = cardData.assignedCoder || 'Unknown';",
  "priorityEl.textContent = cardData.priority || 'Unknown';\n            ownerEl.textContent = cardData.owner || 'Unknown';\n            projectEl.textContent = cardData.project || 'Unknown';\n            assignedCoderEl.textContent = cardData.assignedCoder || 'Unknown';"
);

fs.writeFileSync(filePath, content);
console.log('Patched dev-server.mjs');
