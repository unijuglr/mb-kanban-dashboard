import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-052-'));
const fixtureDocs = path.join(fixtureRoot, 'docs');

fs.cpSync(path.join(repoRoot, 'docs'), fixtureDocs, { recursive: true });

const port = 4288;
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

  const created = await postJson(`http://127.0.0.1:${port}/api/cards`, {
    id: 'MB-052',
    title: 'Create new card from template',
    owner: 'Coder-5',
    priority: 'P1 important',
    status: 'Backlog',
    objective: 'Create a repo-backed markdown card from a template through the local app shell.',
    whyItMatters: 'This proves the app can safely create new file-backed work items.',
    scope: '- [ ] create markdown file\n- [ ] expose created card via API',
    outOfScope: '- arbitrary markdown editing',
    steps: '- [ ] submit create-card request\n- [ ] verify new card shows up on board',
    blockers: '- None currently.',
    artifacts: '- `docs/cards/MB-052-create-new-card-from-template.md`'
  });

  const duplicate = await postJson(`http://127.0.0.1:${port}/api/cards`, {
    id: 'MB-052',
    title: 'Duplicate should fail',
    owner: 'Coder-5',
    objective: 'Should be rejected.'
  });

  const invalid = await postJson(`http://127.0.0.1:${port}/api/cards`, {
    id: 'oops',
    title: '',
    owner: '',
    objective: ''
  });

  const createdFile = path.join(fixtureDocs, 'cards', 'MB-052-create-new-card-from-template.md');
  const fileExists = fs.existsSync(createdFile);
  const filePreview = fileExists ? fs.readFileSync(createdFile, 'utf8').split('\n').slice(0, 18) : [];
  const cardResponse = await fetch(`http://127.0.0.1:${port}/api/cards/mb-052`).then(async (response) => ({
    status: response.status,
    body: await response.json()
  }));
  const boardResponse = await fetch(`http://127.0.0.1:${port}/api/board`).then(async (response) => ({
    status: response.status,
    body: await response.json()
  }));

  console.log(JSON.stringify({
    ok: true,
    fixtureRoot,
    created,
    duplicate,
    invalid,
    fileExists,
    filePreview,
    cardResponse,
    boardContainsCreatedCard: boardResponse.body.board.some((column) =>
      column.cards.some((card) => card.id === 'MB-052' && card.title === 'Create new card from template')
    )
  }, null, 2));
} finally {
  server.kill('SIGTERM');
}
