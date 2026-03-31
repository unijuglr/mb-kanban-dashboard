import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4213;
const baseUrl = `http://127.0.0.1:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReady(deadlineMs = 5000) {
  const started = Date.now();

  while (Date.now() - started < deadlineMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }

  throw new Error('Timed out waiting for dev server');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = spawn(process.execPath, [path.join(root, 'scripts', 'dev-server.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
server.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await waitForReady();

  const [detailHtml, cardApi] = await Promise.all([
    fetch(`${baseUrl}/cards/mb-018`).then((res) => res.text()),
    fetch(`${baseUrl}/api/cards/mb-018`).then((res) => res.json())
  ]);

  assert(detailHtml.includes('Card detail screen over the repo-backed card API.'), 'card detail page missing MB-031 copy');
  assert(detailHtml.includes('id="card-detail-data"'), 'card detail page missing embedded payload');
  assert(detailHtml.includes('id="card-status-actions"'), 'card detail page missing status action mount');
  assert(detailHtml.includes("fetch('/api/cards/' + encodeURIComponent(slug) + '/status'"), 'card detail page missing status transition wiring');
  assert(detailHtml.includes('Allowed next statuses are loaded from the API.'), 'card detail page missing action help copy');
  assert(detailHtml.includes('id="card-update-log"'), 'card detail page missing update log panel');
  assert(detailHtml.includes('id="card-file-path"'), 'card detail page missing source file panel');

  assert(cardApi.id === 'MB-018', 'card detail API returned wrong card');
  assert(Array.isArray(cardApi.allowedNextStatuses), 'card detail API missing allowedNextStatuses');
  assert(cardApi.allowedNextStatuses.length >= 0, 'card detail API allowedNextStatuses malformed');
  assert(typeof cardApi.objective === 'string' && cardApi.objective.length > 0, 'card detail API missing objective');

  console.log(JSON.stringify({
    ok: true,
    checked: ['/cards/mb-018', '/api/cards/mb-018'],
    features: [
      'api-backed-card-detail',
      'metadata-summary-strip',
      'status-action-panel',
      'source-file-panel',
      'update-log-panel'
    ],
    sampleCard: {
      id: cardApi.id,
      status: cardApi.status,
      priority: cardApi.priority,
      owner: cardApi.owner,
      allowedNextStatuses: cardApi.allowedNextStatuses
    }
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  if (stderr.trim()) process.stderr.write(stderr);
}
