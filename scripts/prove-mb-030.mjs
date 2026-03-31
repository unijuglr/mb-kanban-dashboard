import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4212;
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

  const [boardHtml, boardApi] = await Promise.all([
    fetch(`${baseUrl}/board`).then((res) => res.text()),
    fetch(`${baseUrl}/api/board`).then((res) => res.json())
  ]);

  assert(boardHtml.includes('API-backed board screen with local filtering over real repo cards.'), 'board page missing MB-030 copy');
  assert(boardHtml.includes('id="board-search"'), 'board page missing search control');
  assert(boardHtml.includes('id="board-owner"'), 'board page missing owner filter');
  assert(boardHtml.includes('id="board-priority"'), 'board page missing priority filter');
  assert(boardHtml.includes('id="board-status"'), 'board page missing status filter');
  assert(boardHtml.includes('id="board-columns"'), 'board page missing board columns mount');
  assert(boardHtml.includes('id="board-data"'), 'board page missing embedded board payload');
  assert(boardHtml.includes("fetch('/api/board')"), 'board page missing API hydration');

  assert(Array.isArray(boardApi.board) && boardApi.board.length === 6, 'board API did not return six columns');
  assert(boardApi.board.some((column) => column.cards.length > 0), 'board API returned no populated columns');

  const owners = [...new Set(boardApi.board.flatMap((column) => column.cards.map((card) => card.owner)).filter(Boolean))].sort();
  const priorities = [...new Set(boardApi.board.flatMap((column) => column.cards.map((card) => card.priority)).filter(Boolean))].sort();

  console.log(JSON.stringify({
    ok: true,
    checked: ['/board', '/api/board'],
    features: [
      'summary-strip',
      'search-filter',
      'owner-filter',
      'priority-filter',
      'status-filter',
      'api-hydrated-columns'
    ],
    counts: {
      columns: boardApi.board.length,
      cards: boardApi.board.reduce((sum, column) => sum + column.cards.length, 0),
      owners: owners.length,
      priorities: priorities.length
    },
    sampleOwners: owners.slice(0, 5),
    samplePriorities: priorities
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  if (stderr.trim()) process.stderr.write(stderr);
}
