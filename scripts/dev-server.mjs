import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = process.env.PORT || 4187;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MB Kanban Dashboard</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; background: #0b1020; color: #e8ecf3; }
      header { padding: 20px; border-bottom: 1px solid #26304a; }
      main { padding: 20px; display: grid; gap: 16px; }
      .card { background: #121a2b; border: 1px solid #26304a; border-radius: 12px; padding: 16px; }
      code { color: #9dd3ff; }
    </style>
  </head>
  <body>
    <header>
      <h1>MB Kanban Dashboard</h1>
      <p>Scaffold is live.</p>
    </header>
    <main>
      <section class="card">
        <h2>Status</h2>
        <p>Repo scaffold created. App shell pending.</p>
      </section>
      <section class="card">
        <h2>Paths</h2>
        <ul>
          <li><code>docs/</code></li>
          <li><code>src/</code></li>
          <li><code>scripts/</code></li>
        </ul>
      </section>
    </main>
  </body>
</html>`;

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, app: 'mb-kanban-dashboard' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => {
  console.log(`MB Kanban Dashboard scaffold listening on http://127.0.0.1:${port}`);
});
