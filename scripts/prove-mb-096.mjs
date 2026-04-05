import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { rankGraphForIntent } from '../src/graph-explorer/scoring.mjs';
import { loadGraphExplorerModel } from '../src/graph-explorer/adapter.mjs';
import { resolveInitialGraphState, serializeGraphState } from '../src/graph-explorer/state.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-096-'));

fs.cpSync(path.join(repoRoot, 'docs'), path.join(fixtureRoot, 'docs'), { recursive: true });

const port = 4301;
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

  const factsApi = await fetch(`${base}/api/graph?intent=facts&selected=entity%3Aluke-skywalker`).then((res) => res.json());
  const storyApi = await fetch(`${base}/api/graph?intent=story&selected=entity%3Aluke-skywalker`).then((res) => res.json());
  const relApi = await fetch(`${base}/api/graph?intent=relationships&selected=entity%3Aluke-skywalker`).then((res) => res.json());
  const debugApi = await fetch(`${base}/api/graph?intent=debug&selected=entity%3Aluke-skywalker`).then((res) => res.json());
  const graphHtml = await fetch(`${base}/graph?intent=story&selected=entity%3Aluke-skywalker`).then((res) => res.text());
  const bootstrap = extractJsonScript(graphHtml, 'graph-bootstrap');

  const factsRank = rankGraphForIntent(graph, { intentMode: 'facts', selectedId: 'entity:luke-skywalker' });
  const storyRank = rankGraphForIntent(graph, { intentMode: 'story', selectedId: 'entity:luke-skywalker' });
  const relRank = rankGraphForIntent(graph, { intentMode: 'relationships', selectedId: 'entity:luke-skywalker' });
  const debugRank = rankGraphForIntent(graph, { intentMode: 'debug', selectedId: 'entity:luke-skywalker' });
  const restored = resolveInitialGraphState({
    graph,
    persistedState: serializeGraphState({ selectedId: 'entity:tatooine', searchQuery: 'tatooine', intentMode: 'relationships' })
  });

  assert(Array.isArray(factsApi.intentModes) && factsApi.intentModes.join(',') === 'facts,story,relationships,debug', 'API missing explicit intent modes');
  assert(graphHtml.includes('Intent mode') && graphHtml.includes('facts') && graphHtml.includes('story') && graphHtml.includes('relationships') && graphHtml.includes('debug'), 'graph route missing intent mode selector/copy');
  assert(bootstrap.serverBootstrap?.intentMode === 'story', 'graph bootstrap did not preserve deep-linked intent mode');
  assert(factsApi.adaptive.intentMode === 'facts', 'facts API adaptive block missing');
  assert(storyApi.adaptive.intentMode === 'story', 'story API adaptive block missing');
  assert(relApi.adaptive.intentMode === 'relationships', 'relationships API adaptive block missing');
  assert(debugApi.adaptive.intentMode === 'debug', 'debug API adaptive block missing');
  assert(storyRank.rankingSummary.topNodeIds.join('|') !== debugRank.rankingSummary.topNodeIds.join('|'), 'story/debug top node ranking should differ deterministically');
  assert(relRank.visibleNodeLimit > factsRank.visibleNodeLimit, 'relationships mode should expose a broader node window than facts');
  assert(debugRank.visibleNodeLimit === graph.nodes.length, 'debug mode should expose full graph context');
  assert(storyApi.adaptive.rankingSummary.topEdgeIds[0] !== debugApi.adaptive.rankingSummary.topEdgeIds[0], 'story/debug top edge should differ deterministically');
  assert(restored.intentMode === 'relationships', 'persisted intent mode should restore through shared state helper');

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: [
      '/api/graph?intent=facts&selected=entity:luke-skywalker',
      '/api/graph?intent=story&selected=entity:luke-skywalker',
      '/api/graph?intent=relationships&selected=entity:luke-skywalker',
      '/api/graph?intent=debug&selected=entity:luke-skywalker',
      '/graph?intent=story&selected=entity:luke-skywalker'
    ],
    topNodes: {
      facts: factsRank.rankingSummary.topNodeIds,
      story: storyRank.rankingSummary.topNodeIds,
      relationships: relRank.rankingSummary.topNodeIds,
      debug: debugRank.rankingSummary.topNodeIds
    },
    topEdges: {
      facts: factsApi.adaptive.rankingSummary.topEdgeIds,
      story: storyApi.adaptive.rankingSummary.topEdgeIds,
      relationships: relApi.adaptive.rankingSummary.topEdgeIds,
      debug: debugApi.adaptive.rankingSummary.topEdgeIds
    },
    restoredIntentMode: restored.intentMode,
    visibleNodeLimits: {
      facts: factsRank.visibleNodeLimit,
      relationships: relRank.visibleNodeLimit,
      debug: debugRank.visibleNodeLimit
    }
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
