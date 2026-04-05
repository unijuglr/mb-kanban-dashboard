import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-094-'));

fs.cpSync(path.join(repoRoot, 'docs'), path.join(fixtureRoot, 'docs'), { recursive: true });

const port = 4299;
const server = spawn(process.execPath, [path.join(repoRoot, 'scripts', 'dev-server.mjs')], {
  cwd: repoRoot,
  env: { ...process.env, PORT: String(port), MB_ROOT: fixtureRoot },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start in time.')), 8000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('MB Kanban Dashboard listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.stderr.on('data', (chunk) => {
      const text = String(chunk).trim();
      if (text) {
        clearTimeout(timeout);
        reject(new Error(text));
      }
    });
    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await waitForServer();
  const base = `http://127.0.0.1:${port}`;

  const graphApi = await fetch(`${base}/api/graph`).then((res) => res.json());
  const graphHtml = await fetch(`${base}/graph`).then((res) => res.text());
  const selectedHtml = await fetch(`${base}/graph?selected=entity%3Aluke-skywalker`).then((res) => res.text());

  const luke = graphApi.nodes.find((node) => node.label === 'Luke Skywalker');
  const tatooine = graphApi.nodes.find((node) => node.label === 'Tatooine');
  const verifiedEdge = graphApi.edges.find((edge) => edge.source === luke?.id && edge.target === tatooine?.id);

  assert(luke, 'Luke Skywalker missing from graph api');
  assert(tatooine, 'Tatooine missing from graph api');
  assert(verifiedEdge, 'Luke -> Tatooine edge missing from graph api');
  assert(graphHtml.includes('Single click = select + inspect + focus'), 'graph route missing click interaction copy');
  assert(graphHtml.includes('Entities') && graphHtml.includes('Relationships') && graphHtml.includes('Paths'), 'graph route missing grouped search result sections');
  assert(graphHtml.includes('/graph?selected=:id'), 'graph route missing defined double-click navigation destination');
  assert(graphHtml.includes('data-select-edge') && graphHtml.includes('data-select-path'), 'graph route missing relationship/path interaction hooks');
  assert(selectedHtml.includes('entity:luke-skywalker'), 'selected deep link did not preserve selected node state in HTML');

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: ['/graph', '/graph?selected=entity:luke-skywalker', '/api/graph'],
    nodeCount: graphApi.summary.nodeCount,
    edgeCount: graphApi.summary.edgeCount,
    verifiedEdge: verifiedEdge.id,
    confirmedFeatures: [
      'grouped search results',
      'single-click select+inspect+focus copy',
      'double-click deep-link destination',
      'relationship/path interaction hooks'
    ]
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
