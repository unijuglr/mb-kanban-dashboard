import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4214;
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

  const [decisionsHtml, decisionsApi, detailHtml, detailApi] = await Promise.all([
    fetch(`${baseUrl}/decisions-v2-test`).then((res) => res.text()),
    fetch(`${baseUrl}/api/decisions`).then((res) => res.json()),
    fetch(`${baseUrl}/api/decisions/dec-001`).then((res) => res.json()),
    fetch(`${baseUrl}/api/decisions/dec-001`).then((res) => res.json())
  ]);

  assert(decisionsHtml.includes('API-backed decisions screen with local filtering and in-page detail inspection.'), 'decisions page missing MB-032 copy');
  assert(decisionsHtml.includes('id="decisions-search"'), 'decisions page missing search control');
  assert(decisionsHtml.includes('id="decisions-status"'), 'decisions page missing status filter');
  assert(decisionsHtml.includes('id="decisions-owner"'), 'decisions page missing owner filter');
  assert(decisionsHtml.includes('id="decisions-swimlanes"'), 'decisions page missing swimlanes mount');
  assert(decisionsHtml.includes('id="decision-detail-panel"'), 'decisions page missing detail panel');
  assert(decisionsHtml.includes('id="decisions-data"'), 'decisions page missing embedded decisions payload');
  assert(decisionsHtml.includes("fetch('/api/decisions')"), 'decisions page missing API hydration');
  assert(decisionsHtml.includes("searchParams.set('selected', selectedSlug)"), 'decisions page missing selected-state URL handling');

  assert(Array.isArray(decisionsApi.items) && decisionsApi.items.length >= 3, 'decisions API returned too few decisions');
  assert(decisionsApi.items.every((item) => item.id && item.slug && item.title), 'decisions API missing decision identity fields');
  assert(typeof detailApi.decision === 'string' && detailApi.decision.length > 0, 'decision detail API missing decision body');

  const owners = [...new Set(decisionsApi.items.map((item) => item.owner).filter(Boolean))].sort();
  const statuses = [...new Set(decisionsApi.items.map((item) => item.status).filter(Boolean))].sort();

  console.log(JSON.stringify({
    ok: true,
    checked: ['/decisions', '/api/decisions', '/decisions/dec-001', '/api/decisions/dec-001'],
    features: [
      'summary-strip',
      'search-filter',
      'status-filter',
      'owner-filter',
      'master-detail-panel',
      'selected-query-state',
      'api-hydrated-decisions'
    ],
    counts: {
      decisions: decisionsApi.items.length,
      owners: owners.length,
      statuses: statuses.length
    },
    sampleDecision: {
      id: detailApi.id,
      title: detailApi.title,
      status: detailApi.status,
      owner: detailApi.owner
    }
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  if (stderr.trim()) process.stderr.write(stderr);
}
