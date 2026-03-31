import { spawn } from 'node:child_process';

const port = 4191;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/dev-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitForReady() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for dev server to start.')), 10000);

    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes('MB Kanban Dashboard listening')) {
        clearTimeout(timeout);
        server.stdout.off('data', onData);
        resolve();
      }
    };

    server.stdout.on('data', onData);
    server.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.trim()) process.stderr.write(text);
    });
    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Dev server exited early with code ${code}.`));
    });
  });
}

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${pathname}: ${response.status}`);
  }
  return response.json();
}

async function fetchText(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${pathname}: ${response.status}`);
  }
  return response.text();
}

try {
  await waitForReady();

  const updates = await fetchJson('/api/updates');
  const latest = updates.items[0];
  const latestDetail = await fetchJson(`/api/updates/${encodeURIComponent(latest.slug)}`);
  const updatesHtml = await fetchText('/updates');

  const proof = {
    count: updates.count,
    latest: {
      id: latest.id,
      title: latest.title,
      date: latest.date,
      sectionCount: latest.sections.length,
      sectionHeadings: latest.sections.map((section) => section.heading)
    },
    detailRoute: {
      slug: latestDetail.slug,
      title: latestDetail.title,
      summary: latestDetail.summary,
      metadataKeys: Object.keys(latestDetail.metadata || {})
    },
    htmlChecks: {
      hasSummaryStrip: updatesHtml.includes('Visible updates'),
      hasSearchFilter: updatesHtml.includes('updates-search'),
      hasDetailPanel: updatesHtml.includes('Update detail'),
      hasOpenSourceLink: updatesHtml.includes('Open source markdown')
    }
  };

  console.log(JSON.stringify(proof, null, 2));
} finally {
  server.kill('SIGTERM');
}
