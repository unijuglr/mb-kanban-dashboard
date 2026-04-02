import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4210;
const baseUrl = `http://127.0.0.1:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  return { ok: response.ok, status: response.status, text: await response.text() };
}

async function waitForReady(deadlineMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < deadlineMs) {
    try {
      const result = await fetchText('/health');
      if (result.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Timed out waiting for server');
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

  const [home, board, card, decisions, decision, updates] = await Promise.all([
    fetchText('/'),
    fetchText('/board'),
    fetchText('/cards/mb-018'),
    fetchText('/decisions'),
    fetchText('/decisions/dec-001'),
    fetchText('/updates')
  ]);

  assert(home.ok && home.text.includes('Program overview'), 'overview route missing expected copy');
  assert(board.ok && board.text.includes('Board'), 'board route did not render');
  assert(card.ok && card.text.includes('MB-018'), 'card detail route did not render expected card');
  assert(decisions.ok && decisions.text.includes('Decisions'), 'decisions route did not render');
  assert(decision.ok && decision.text.includes('DEC-001'), 'decision detail route did not render expected decision');
  assert(updates.ok && updates.text.includes('Updates timeline'), 'updates route did not render');

  console.log(JSON.stringify({
    ok: true,
    routesChecked: ['/', '/board', '/cards/mb-018', '/decisions', '/decisions/dec-001', '/updates']
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  if (stderr.trim()) process.stderr.write(stderr);
}
