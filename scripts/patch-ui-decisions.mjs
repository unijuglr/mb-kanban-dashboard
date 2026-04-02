import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'dev-server.mjs');

let content = fs.readFileSync(filePath, 'utf8');

// The logic: In the card detail view, we want a section for "Related decisions"
// This requires the model to have loaded decisions. The loadDashboardModel already does this.

// In renderCardDetail(model, slug):
// We need to filter model.decisions by the project of the current card.

const injectionPoint = '          <article class="panel"><h2>Summary</h2><p id="card-summary">${escapeHtml(card.summary || \'No summary yet.\')}</p></article>';
const newPanel = `          <article class="panel"><h2>Project Decisions</h2><div id="card-related-decisions"><p class="muted">Loading related decisions...</p></div></article>`;

if (content.includes(injectionPoint)) {
  content = content.replace(injectionPoint, injectionPoint + '\n' + newPanel);
  console.log('Injected panel HTML');
} else {
  console.error('Could not find injection point for panel HTML');
}

// In the applyCard(cardData, flashMessage) function in the client-side script:
// We need to render the related decisions.

const applyCardInjectionPoint = "statusResultEl.textContent = flashMessage || '';";
const applyCardLogic = `            const relatedDecisionsEl = document.getElementById('card-related-decisions');
            if (relatedDecisionsEl) {
              fetch('/api/decisions').then(res => res.json()).then(data => {
                const projectDecisions = (data.items || []).filter(d => d.project === cardData.project);
                if (projectDecisions.length) {
                  relatedDecisionsEl.innerHTML = '<ul style="padding-left: 1.5rem; margin: 0;">' + projectDecisions.map(d => '<li><a href="/decisions?selected=' + encodeURIComponent(d.slug) + '">' + esc(d.id) + ' — ' + esc(d.title) + '</a></li>').join('') + '</ul>';
                } else {
                  relatedDecisionsEl.innerHTML = '<p class="muted">No decisions recorded for this project.</p>';
                }
              }).catch(() => {
                relatedDecisionsEl.innerHTML = '<p class="muted">Failed to load decisions.</p>';
              });
            }`;

if (content.includes(applyCardInjectionPoint)) {
  content = content.replace(applyCardInjectionPoint, applyCardInjectionPoint + '\n' + applyCardLogic);
  console.log('Injected applyCard logic');
} else {
  console.error('Could not find injection point for applyCard logic');
}

fs.writeFileSync(filePath, content);
console.log('Patched dev-server.mjs for Related Decisions');
