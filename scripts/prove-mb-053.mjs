import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-053-'));
const fixtureDocs = path.join(fixtureRoot, 'docs');

fs.cpSync(path.join(repoRoot, 'docs'), fixtureDocs, { recursive: true });

const port = 4289;
const server = spawn(process.execPath, [path.join(repoRoot, 'scripts', 'dev-server.mjs')], {
  cwd: repoRoot,
  env: {
    ...process.env,
    PORT: String(port),
    MB_ROOT: fixtureRoot
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start in time.')), 5000);

    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('MB Kanban Dashboard listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    server.stderr.on('data', (chunk) => {
      const text = String(chunk);
      if (text.trim()) {
        clearTimeout(timeout);
        reject(new Error(text.trim()));
      }
    });

    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

try {
  await waitForServer();

  const created = await postJson(`http://127.0.0.1:${port}/api/decisions`, {
    id: 'DEC-004',
    title: 'Create new decision from template',
    owner: 'Coder-5',
    status: 'Proposed',
    date: '2026-03-31',
    context: 'The app already supports create-card writes, but decision creation is still missing.',
    optionsConsidered: '### Option A\nKeep decision creation manual in markdown.\n\n### Option B\nAdd a constrained template-backed write path in the app shell.',
    decision: 'Adopt Option B and create decisions through a fixed markdown template.',
    why: 'This keeps decision records structured while reducing manual markdown work.',
    consequences: '- decision records can now be created from the app shell\n- write scope stays narrow and predictable',
    followUpTasks: '- [ ] verify the new decision appears in the decisions list\n- [ ] link the created decision from future workflow UI as needed'
  });

  const duplicate = await postJson(`http://127.0.0.1:${port}/api/decisions`, {
    id: 'DEC-004',
    title: 'Duplicate should fail',
    owner: 'Coder-5',
    context: 'Should be rejected.',
    decision: 'Reject duplicates.'
  });

  const invalid = await postJson(`http://127.0.0.1:${port}/api/decisions`, {
    id: 'oops',
    title: '',
    owner: '',
    context: '',
    decision: ''
  });

  const createdFile = path.join(fixtureDocs, 'decisions', 'DEC-004-create-new-decision-from-template.md');
  const fileExists = fs.existsSync(createdFile);
  const filePreview = fileExists ? fs.readFileSync(createdFile, 'utf8').split('\n').slice(0, 22) : [];
  const decisionResponse = await fetch(`http://127.0.0.1:${port}/api/decisions/dec-004`).then(async (response) => ({
    status: response.status,
    body: await response.json()
  }));
  const decisionsResponse = await fetch(`http://127.0.0.1:${port}/api/decisions`).then(async (response) => ({
    status: response.status,
    body: await response.json()
  }));
  const decisionsHtml = await fetch(`http://127.0.0.1:${port}/decisions`).then((response) => response.text());

  console.log(JSON.stringify({
    ok: true,
    fixtureRoot,
    created,
    duplicate,
    invalid,
    fileExists,
    filePreview,
    decisionResponse,
    decisionsContainsCreatedDecision: decisionsResponse.body.items.some((decision) =>
      decision.id === 'DEC-004' && decision.title === 'Create new decision from template'
    ),
    decisionsPageHasCreateForm: decisionsHtml.includes('id="create-decision-form"') && decisionsHtml.includes('Create new decision')
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
