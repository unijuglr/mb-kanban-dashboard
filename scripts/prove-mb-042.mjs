import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4192;
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

try {
  await waitForServer();

  const [overviewRes, metricsRes, boardRes] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/`),
    fetch(`http://127.0.0.1:${port}/api/metrics/summary`),
    fetch(`http://127.0.0.1:${port}/api/board`)
  ]);

  const overviewHtml = await overviewRes.text();
  const metrics = await metricsRes.json();
  const board = await boardRes.json();

  const checks = {
    overviewOk: overviewRes.ok,
    hasProgramOverviewHeading: overviewHtml.includes('Program overview'),
    hasRunStatusMix: overviewHtml.includes('Run status mix'),
    hasRecentRuns: overviewHtml.includes('Recent runs'),
    hasTimeline: overviewHtml.includes('Timeline'),
    includesTotalRunsValue: overviewHtml.includes(String(metrics.summary.total_runs ?? '')),
    includesDoneColumnLabel: overviewHtml.includes('Done'),
    includesMetricsRouteLink: overviewHtml.includes('/api/metrics/summary')
  };

  const proof = {
    ok: Object.values(checks).every(Boolean),
    port,
    checks,
    metricsSummary: {
      projectId: metrics.projectId,
      totalRuns: metrics.summary.total_runs,
      successfulRuns: metrics.summary.successful_runs,
      owners: metrics.byOwner.map((row) => row.owner),
      statuses: metrics.byStatus
    },
    boardSummary: board.summary,
    overviewExcerpt: overviewHtml
      .replace(/\s+/g, ' ')
      .slice(0, 600)
  };

  console.log(JSON.stringify(proof, null, 2));
} finally {
  server.kill('SIGTERM');
}
