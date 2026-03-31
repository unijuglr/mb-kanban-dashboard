import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4193;
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

  const [metricsPageRes, comparisonRes, timelineRes, healthRes] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/metrics`),
    fetch(`http://127.0.0.1:${port}/api/metrics/comparison`),
    fetch(`http://127.0.0.1:${port}/api/metrics/timeline`),
    fetch(`http://127.0.0.1:${port}/health`)
  ]);

  const metricsHtml = await metricsPageRes.text();
  const comparison = await comparisonRes.json();
  const timeline = await timelineRes.json();
  const health = await healthRes.json();

  const checks = {
    metricsRouteOk: metricsPageRes.ok,
    comparisonRouteOk: comparisonRes.ok,
    timelineRouteOk: timelineRes.ok,
    healthAdvertisesMetricsScreen: health.routes.includes('/metrics'),
    healthAdvertisesComparisonApi: health.routes.includes('/api/metrics/comparison'),
    hasHeading: metricsHtml.includes('Metrics timeline & comparison'),
    hasOwnerComparison: metricsHtml.includes('Owner comparison'),
    hasTimelineSection: metricsHtml.includes('Timeline'),
    hasOwnerFilter: metricsHtml.includes('id="metrics-owner-filter"'),
    hasSortControl: metricsHtml.includes('id="metrics-sort"'),
    hasWindowControl: metricsHtml.includes('id="metrics-window"'),
    hasEmbeddedMetricsPayload: metricsHtml.includes('id="metrics-data"'),
    hydratesComparisonApi: metricsHtml.includes("fetch('/api/metrics/comparison')"),
    comparisonHasItems: Array.isArray(comparison.items) && comparison.items.length > 0,
    timelineHasItems: Array.isArray(timeline.items) && timeline.items.length > 0
  };

  const proof = {
    ok: Object.values(checks).every(Boolean),
    port,
    checks,
    comparisonSample: comparison.items.slice(0, 3).map((row) => ({
      owner: row.owner,
      runs: row.runs,
      successful_runs: row.successful_runs,
      avg_duration_ms: row.avg_duration_ms,
      artifacts_count: row.artifacts_count
    })),
    timelineSample: timeline.items.slice(0, 3),
    overviewExcerpt: metricsHtml.replace(/\s+/g, ' ').slice(0, 800)
  };

  console.log(JSON.stringify(proof, null, 2));
} finally {
  server.kill('SIGTERM');
}
