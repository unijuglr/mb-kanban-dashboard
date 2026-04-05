import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { loadGraphExplorerModel } from '../src/graph-explorer/adapter.mjs';
import { GRAPH_EXPLORER_STORAGE_KEY, resolveInitialGraphState, serializeGraphState } from '../src/graph-explorer/state.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-095-'));

fs.cpSync(path.join(repoRoot, 'docs'), path.join(fixtureRoot, 'docs'), { recursive: true });

const port = 4300;
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

function extractJsonScript(html, id) {
  const match = html.match(new RegExp(`<script id="${id}" type="application/json">([\\s\\S]*?)</script>`));
  assert(match, `Missing ${id} payload in HTML`);
  return JSON.parse(match[1]);
}

try {
  await waitForServer();
  const base = `http://127.0.0.1:${port}`;
  const graph = loadGraphExplorerModel(fixtureRoot);

  const coldHtml = await fetch(`${base}/graph`).then((res) => res.text());
  const deepLinkHtml = await fetch(`${base}/graph?selected=entity%3Atatooine`).then((res) => res.text());
  const apiGraph = await fetch(`${base}/api/graph`).then((res) => res.json());

  const coldBootstrap = extractJsonScript(coldHtml, 'graph-bootstrap');
  const deepLinkBootstrap = extractJsonScript(deepLinkHtml, 'graph-bootstrap');

  const restoredState = serializeGraphState({
    selectedId: 'entity:tatooine',
    searchQuery: 'tatooine'
  });
  const restoredBootstrap = resolveInitialGraphState({
    graph,
    persistedState: restoredState,
    urlSelectedId: null
  });
  const deepLinkResolved = resolveInitialGraphState({
    graph,
    persistedState: serializeGraphState({ selectedId: 'entity:luke-skywalker', searchQuery: 'luke' }),
    urlSelectedId: 'entity:tatooine'
  });

  assert(apiGraph.starter?.id === 'starter:luke-tatooine-proof-slice', 'API graph missing curated starter slice metadata');
  assert(Array.isArray(apiGraph.starter?.nodeIds) && apiGraph.starter.nodeIds.includes('entity:luke-skywalker') && apiGraph.starter.nodeIds.includes('entity:tatooine'), 'API graph starter slice missing proof-backed nodes');
  assert(coldHtml.includes('Default starter subgraph'), 'graph route missing starter subgraph UI copy');
  assert(coldHtml.includes('Local persistence: selected node + search query'), 'graph route missing persistence UI copy');
  assert(coldHtml.includes(GRAPH_EXPLORER_STORAGE_KEY), 'graph route missing local storage key wiring');
  assert(coldHtml.includes('window.localStorage.setItem'), 'graph route missing local persistence write path');
  assert(coldHtml.includes('Showing curated starter subgraph.'), 'graph route missing starter subgraph status copy');

  assert(coldBootstrap.serverBootstrap?.source === 'starter', 'cold load should bootstrap from curated starter state');
  assert(coldBootstrap.serverBootstrap?.selectedId === 'entity:luke-skywalker', 'cold load should default to Luke starter node');
  assert(restoredBootstrap.source === 'persisted', 'persisted local state should win on reload when no deep link is present');
  assert(restoredBootstrap.selectedId === 'entity:tatooine', 'persisted selected node not restored');
  assert(restoredBootstrap.searchQuery === 'tatooine', 'persisted search query not restored');
  assert(deepLinkBootstrap.initialSelectedId === 'entity:tatooine', 'deep-link HTML bootstrap missing selected param');
  assert(deepLinkResolved.source === 'deep-link', 'deep link should override persisted selected node');
  assert(deepLinkResolved.selectedId === 'entity:tatooine', 'deep link did not override selected node');
  assert(deepLinkResolved.searchQuery === 'luke', 'deep link should preserve persisted search query contract');

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: ['/graph', '/graph?selected=entity:tatooine', '/api/graph'],
    storageKey: GRAPH_EXPLORER_STORAGE_KEY,
    starter: apiGraph.starter,
    restoredBootstrap,
    deepLinkResolved,
    confirmedFeatures: [
      'curated starter subgraph bootstrap',
      'local selected node persistence contract',
      'local search query persistence contract',
      'deep-link selected param precedence with preserved search query'
    ]
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
