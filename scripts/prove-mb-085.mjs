import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-085-'));

fs.cpSync(path.join(repoRoot, 'docs'), path.join(fixtureRoot, 'docs'), { recursive: true });
fs.mkdirSync(path.join(fixtureRoot, 'data'), { recursive: true });

const port = 4291;
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

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

try {
  await waitForServer();
  const base = `http://127.0.0.1:${port}`;

  const routeHtml = await fetch(`${base}/decisions?selected=dec-001`).then((res) => res.text());
  const detailHtmlBefore = await fetch(`${base}/decisions/dec-001`).then((res) => res.text());

  assert(routeHtml.includes('id="decision-response-form"'), 'selected decisions route missing response form');
  assert(routeHtml.includes('Approve') && routeHtml.includes('Reject'), 'selected decisions route missing approve/reject controls');
  assert(routeHtml.includes('Option selected'), 'selected decisions route missing option picker');
  assert(detailHtmlBefore.includes('id="decision-response-form"'), 'detail route missing response form');

  const first = await postJson(`${base}/api/decisions/dec-001/responses`, {
    action: 'approve',
    actor: 'Adam',
    option: 'Option B',
    note: 'Approved for operator flow verification.'
  });
  assert(first.status === 201 && first.body.ok, 'first decision response did not persist');

  const second = await postJson(`${base}/api/decisions/dec-001/responses`, {
    action: 'reject',
    actor: 'Adam',
    option: 'Option C',
    note: 'Rejected alternate path to prove history.'
  });
  assert(second.status === 201 && second.body.ok, 'second decision response did not persist');

  const api = await fetch(`${base}/api/decisions/dec-001`).then((res) => res.json());
  const routeHtmlAfter = await fetch(`${base}/decisions?selected=dec-001`).then((res) => res.text());
  const detailHtmlAfter = await fetch(`${base}/decisions/dec-001`).then((res) => res.text());
  const storePath = path.join(fixtureRoot, 'data', 'decision-responses.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  assert(api.latestResponse?.action === 'reject', 'latest response not returned by API');
  assert(Array.isArray(api.responseHistory) && api.responseHistory.length === 2, 'response history length incorrect');
  assert(routeHtmlAfter.includes('Response history') && routeHtmlAfter.includes('Rejected alternate path to prove history.'), 'selected decisions route missing refreshed response history');
  assert(detailHtmlAfter.includes('Approved for operator flow verification.') && detailHtmlAfter.includes('Rejected alternate path to prove history.'), 'detail route missing persisted history after refresh');
  assert(store.decisions['dec-001'].responses.length === 2, 'file-backed response store missing entries');

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: ['/decisions?selected=dec-001', '/decisions/dec-001'],
    latestResponse: api.latestResponse,
    responseHistoryCount: api.responseHistory.length,
    storePath
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
