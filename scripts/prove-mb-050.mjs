import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-050-'));
const fixtureDocs = path.join(fixtureRoot, 'docs');

fs.cpSync(path.join(repoRoot, 'docs'), fixtureDocs, { recursive: true });

const port = 4287;
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

function readCardStatus(filePath) {
  const markdown = fs.readFileSync(filePath, 'utf8');
  const status = markdown.match(/^Status:\s*(.+)$/m)?.[1] || null;
  const lastUpdated = markdown.match(/^Last Updated:\s*(.+)$/m)?.[1] || null;
  return { status, lastUpdated };
}

try {
  await waitForServer();

  const targetFile = path.join(fixtureDocs, 'cards', 'MB-001-authority-model.md');
  const before = readCardStatus(targetFile);

  const success = await postJson(`http://127.0.0.1:${port}/api/cards/mb-001/status`, {
    expectedCurrentStatus: 'Ready',
    status: 'In Progress'
  });

  const afterSuccess = readCardStatus(targetFile);

  const invalid = await postJson(`http://127.0.0.1:${port}/api/cards/mb-001/status`, {
    expectedCurrentStatus: 'In Progress',
    status: 'Done'
  });

  const stale = await postJson(`http://127.0.0.1:${port}/api/cards/mb-001/status`, {
    expectedCurrentStatus: 'Ready',
    status: 'Blocked'
  });

  const report = {
    ok: true,
    fixtureRoot,
    targetCard: 'MB-001',
    before,
    success,
    afterSuccess,
    invalid,
    stale
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  server.kill('SIGTERM');
}
