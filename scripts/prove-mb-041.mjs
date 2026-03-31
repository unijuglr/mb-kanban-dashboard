import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4191;
const server = spawn('node', ['scripts/dev-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
server.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`server did not start\nstdout:\n${stdout}\nstderr:\n${stderr}`);
}

async function getJson(pathname) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${pathname} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

try {
  await waitForServer();

  const health = await getJson('/health');
  const summary = await getJson('/api/metrics/summary');
  const runs = await getJson('/api/metrics/runs?limit=3');
  const timeline = await getJson('/api/metrics/timeline');

  const proof = {
    ok: true,
    port,
    metricsRoutesAdvertised: health.routes.filter((route) => String(route).startsWith('/api/metrics')),
    summary: {
      projectId: summary.projectId,
      totalRuns: summary.summary.total_runs,
      successfulRuns: summary.summary.successful_runs,
      owners: summary.byOwner.map((row) => row.owner),
      statuses: summary.byStatus
    },
    recentRuns: runs.items.map((row) => ({
      run_id: row.run_id,
      task_id: row.task_id,
      status: row.status,
      owner: row.metadata?.owner ?? null,
      artifacts_count: row.artifacts_count
    })),
    timeline: timeline.items
  };

  console.log(JSON.stringify(proof, null, 2));
} finally {
  server.kill('SIGTERM');
}
