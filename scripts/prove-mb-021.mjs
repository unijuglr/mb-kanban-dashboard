import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4211;
const baseUrl = `http://127.0.0.1:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(deadlineMs = 5000) {
  const started = Date.now();

  while (Date.now() - started < deadlineMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch {}

    await sleep(100);
  }

  throw new Error('Timed out waiting for dev server health endpoint');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  const health = await waitForHealth();
  const [summary, board, cards, cardDetail, decisions, decisionDetail, updates] = await Promise.all([
    fetch(`${baseUrl}/api/summary`).then((res) => res.json()),
    fetch(`${baseUrl}/api/board`).then((res) => res.json()),
    fetch(`${baseUrl}/api/cards`).then((res) => res.json()),
    fetch(`${baseUrl}/api/cards/mb-018`).then((res) => res.json()),
    fetch(`${baseUrl}/api/decisions`).then((res) => res.json()),
    fetch(`${baseUrl}/api/decisions/dec-001`).then((res) => res.json()),
    fetch(`${baseUrl}/api/updates`).then((res) => res.json())
  ]);

  assert(health.ok === true, 'health endpoint did not report ok');
  assert(Array.isArray(health.routes) && health.routes.includes('/api/board'), 'health routes missing /api/board');
  assert(typeof summary.cardCount === 'number' && summary.cardCount > 0, 'summary missing cardCount');
  assert(Array.isArray(board.board) && board.board.length === 6, 'board endpoint did not return six columns');
  assert(typeof cards.count === 'number' && cards.count === cards.items.length, 'cards endpoint count mismatch');
  assert(cardDetail.id === 'MB-018', 'card detail endpoint returned wrong card');
  assert(Array.isArray(decisions.items) && decisions.items.length > 0, 'decisions endpoint empty');
  assert(decisionDetail.id === 'DEC-001', 'decision detail endpoint returned wrong record');
  assert(Array.isArray(updates.items) && updates.items.length > 0, 'updates endpoint empty');

  console.log(JSON.stringify({
    ok: true,
    endpointsChecked: [
      '/health',
      '/api/summary',
      '/api/board',
      '/api/cards',
      '/api/cards/mb-018',
      '/api/decisions',
      '/api/decisions/dec-001',
      '/api/updates'
    ],
    counts: {
      cards: summary.cardCount,
      decisions: summary.decisionCount,
      updates: summary.updateCount,
      boardColumns: board.board.length
    },
    sampleCard: {
      id: cardDetail.id,
      title: cardDetail.title,
      status: cardDetail.status
    },
    sampleDecision: {
      id: decisionDetail.id,
      title: decisionDetail.title,
      status: decisionDetail.status
    },
    latestUpdate: updates.items[0]?.id || null
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
}
