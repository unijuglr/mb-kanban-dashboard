import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-090-'));

fs.cpSync(path.join(repoRoot, 'docs'), path.join(fixtureRoot, 'docs'), { recursive: true });

const port = 4292;
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

  const detailHtmlBefore = await fetch(`${base}/decisions/dec-001`).then((res) => res.text());
  assert(detailHtmlBefore.includes('Type: Multiple choice'), 'detail route did not render typed multiple-choice decision UI');
  assert(detailHtmlBefore.includes('Choose one of the recorded options'), 'detail route missing option selector for DEC-001');
  assert(!detailHtmlBefore.includes('Yes / Approve'), 'detail route incorrectly rendered binary controls for DEC-001');
  assert(detailHtmlBefore.includes('Notes / nuance (always available)'), 'detail route missing notes field');

  const submit = await postJson(`${base}/api/decisions/dec-001/respond`, {
    selectedOption: 'Option B',
    notes: 'MB-090 proof: direct-route typed response saved successfully.',
    responder: 'MB-090 proof'
  });
  assert(submit.status === 201 && submit.body.ok, 'typed decision response did not persist through /respond route');

  const api = await fetch(`${base}/api/decisions/dec-001`).then((res) => res.json());
  const detailHtmlAfter = await fetch(`${base}/decisions/dec-001`).then((res) => res.text());
  const responseFile = path.join(fixtureRoot, 'docs', 'decisions', 'responses', 'DEC-001.responses.json');
  const responseData = JSON.parse(fs.readFileSync(responseFile, 'utf8'));

  assert(api.decisionType?.key === 'multiple-choice', 'decision API missing multiple-choice classification');
  assert(api.latestResponse?.selectedOption === 'Option B', 'decision API missing latest selected option');
  assert(Array.isArray(api.responseHistory) && api.responseHistory.length >= 1, 'decision API missing response history');
  assert(detailHtmlAfter.includes('MB-090 proof: direct-route typed response saved successfully.'), 'detail route did not render saved note after refresh');
  assert(responseData.at(-1)?.selectedOption === 'Option B', 'response file missing latest selected option');

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: ['/decisions/dec-001', '/api/decisions/dec-001', 'POST /api/decisions/dec-001/respond'],
    latestResponse: api.latestResponse,
    decisionType: api.decisionType,
    responseFile
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
