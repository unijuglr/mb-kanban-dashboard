import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBySlug, loadDashboardModel } from '../src/app-data.mjs';

const port = Number(process.env.PORT || 4187);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraphize(text) {
  if (!text || !text.trim()) return '<p class="muted">Not available.</p>';
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function shell({ title, currentPath, body }) {
  const navItems = [
    ['/', 'Overview'],
    ['/board', 'Board'],
    ['/decisions', 'Decisions'],
    ['/updates', 'Updates']
  ];

  const nav = navItems
    .map(([href, label]) => `<a class="nav-link${currentPath === href ? ' active' : ''}" href="${href}">${label}</a>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} · MB Kanban Dashboard</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #0b1020; color: #e8ecf3; }
      a { color: #9dd3ff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); min-height: 100vh; }
      .sidebar { border-right: 1px solid #26304a; padding: 24px 18px; background: #0e1427; }
      .brand { font-size: 1.25rem; font-weight: 700; margin: 0 0 10px; }
      .subtle { color: #98a3bb; font-size: 0.95rem; line-height: 1.5; }
      nav { display: grid; gap: 8px; margin-top: 24px; }
      .nav-link { display: block; padding: 10px 12px; border-radius: 10px; color: #d8e0ee; border: 1px solid transparent; }
      .nav-link.active, .nav-link:hover { background: #121a2b; border-color: #2d3b5a; text-decoration: none; }
      .content { padding: 28px; display: grid; gap: 20px; }
      h1, h2, h3 { margin: 0 0 12px; }
      .hero { display: flex; align-items: end; justify-content: space-between; gap: 16px; }
      .hero p { margin: 0; color: #98a3bb; }
      .grid { display: grid; gap: 16px; }
      .stats { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
      .board { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); align-items: start; }
      .list { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .card, .panel { background: #121a2b; border: 1px solid #26304a; border-radius: 14px; padding: 16px; }
      .kpi { font-size: 1.75rem; font-weight: 700; }
      .muted { color: #98a3bb; }
      .chip { display: inline-flex; border: 1px solid #334466; border-radius: 999px; padding: 3px 8px; font-size: 0.8rem; color: #c2d7ff; margin-right: 8px; }
      .stack { display: grid; gap: 12px; }
      .card-item { padding-top: 12px; border-top: 1px solid #26304a; }
      .card-item:first-child { border-top: 0; padding-top: 0; }
      pre { white-space: pre-wrap; background: #0d1322; border: 1px solid #26304a; border-radius: 12px; padding: 12px; color: #d6deed; overflow-x: auto; }
      @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .sidebar { border-right: 0; border-bottom: 1px solid #26304a; } }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <h1 class="brand">MB Dashboard</h1>
        <p class="subtle">Minimal local app shell over repo-backed Motherbrain planning artifacts.</p>
        <nav>${nav}</nav>
      </aside>
      <main class="content">${body}</main>
    </div>
  </body>
</html>`;
}

function renderOverview(model) {
  return shell({
    title: 'Overview',
    currentPath: '/',
    body: `
      <section class="hero">
        <div>
          <h1>Local read-only surface is live</h1>
          <p>Board, decisions, and updates are rendered directly from markdown in this repo.</p>
        </div>
        <div class="muted">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>
      <section class="grid stats">
        <article class="card"><div class="muted">Cards</div><div class="kpi">${model.summary.cardCount}</div></article>
        <article class="card"><div class="muted">In Progress</div><div class="kpi">${model.summary.activeCount}</div></article>
        <article class="card"><div class="muted">Decisions</div><div class="kpi">${model.summary.decisionCount}</div></article>
        <article class="card"><div class="muted">Updates</div><div class="kpi">${model.summary.updateCount}</div></article>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>Routes</h2>
          <div class="stack">
            <div><a href="/board">/board</a><div class="muted">Kanban-style board grouped by status.</div></div>
            <div><a href="/decisions">/decisions</a><div class="muted">Decision record list plus detail pages.</div></div>
            <div><a href="/updates">/updates</a><div class="muted">Reverse chronological program updates.</div></div>
            <div><a href="/api/summary">/api/summary</a><div class="muted">JSON summary for quick local inspection.</div></div>
          </div>
        </article>
        <article class="panel">
          <h2>Current watch-outs</h2>
          ${model.summary.unknownStatuses.length ? `<p>${escapeHtml(model.summary.unknownStatuses.join(', '))}</p>` : '<p>No unknown card statuses detected.</p>'}
          <p class="muted">This is intentionally read-only. Safe writes can come later.</p>
        </article>
      </section>`
  });
}

function renderBoard(model) {
  const columns = model.board.map((column) => `
    <section class="panel">
      <h2>${escapeHtml(column.status)}</h2>
      <div class="muted">${column.cards.length} card(s)</div>
      <div class="stack" style="margin-top: 12px;">
        ${column.cards.length ? column.cards.map((card) => `
          <article class="card-item">
            <div><span class="chip">${escapeHtml(card.id)}</span><span class="chip">${escapeHtml(card.priority)}</span></div>
            <h3><a href="/cards/${card.slug}">${escapeHtml(card.title)}</a></h3>
            <div class="muted">${escapeHtml(card.owner)} · updated ${escapeHtml(card.updatedAt)}</div>
            <p>${escapeHtml(card.summary)}</p>
          </article>`).join('') : '<p class="muted">No cards here.</p>'}
      </div>
    </section>`).join('');

  return shell({
    title: 'Board',
    currentPath: '/board',
    body: `<section class="hero"><div><h1>Board</h1><p>Six-column route structure, minimal but useful.</p></div></section><section class="grid board">${columns}</section>`
  });
}

function renderCardDetail(model, slug) {
  const card = findBySlug(model.cards, slug);
  if (!card) return notFound('/board', 'Card not found');
  return shell({
    title: card.id,
    currentPath: '/board',
    body: `
      <section class="hero">
        <div>
          <h1>${escapeHtml(card.id)} — ${escapeHtml(card.title)}</h1>
          <p>${escapeHtml(card.status)} · ${escapeHtml(card.priority)} · ${escapeHtml(card.owner)}</p>
        </div>
        <a href="/board">← Back to board</a>
      </section>
      <section class="grid list">
        <article class="panel"><h2>Objective</h2>${paragraphize(card.objective)}</article>
        <article class="panel"><h2>Why it matters</h2>${paragraphize(card.whyItMatters)}</article>
        <article class="panel"><h2>Scope</h2><pre>${escapeHtml(card.scope || 'Not available.')}</pre></article>
        <article class="panel"><h2>Out of scope</h2><pre>${escapeHtml(card.outOfScope || 'Not available.')}</pre></article>
        <article class="panel"><h2>Steps</h2><pre>${escapeHtml(card.steps || 'Not available.')}</pre></article>
        <article class="panel"><h2>Blockers</h2><pre>${escapeHtml(card.blockers || 'None listed.')}</pre></article>
        <article class="panel"><h2>Artifacts</h2><pre>${escapeHtml(card.artifacts || 'None listed.')}</pre></article>
        <article class="panel"><h2>Update log</h2><pre>${escapeHtml(card.updateLog || 'No updates yet.')}</pre></article>
      </section>`
  });
}

function renderDecisions(model) {
  return shell({
    title: 'Decisions',
    currentPath: '/decisions',
    body: `
      <section class="hero"><div><h1>Decisions</h1><p>Read-only list view over decision markdown.</p></div></section>
      <section class="grid list">
        ${model.decisions.map((decision) => `
          <article class="panel">
            <div><span class="chip">${escapeHtml(decision.id)}</span><span class="chip">${escapeHtml(decision.status)}</span></div>
            <h2><a href="/decisions/${decision.slug}">${escapeHtml(decision.title)}</a></h2>
            <p class="muted">${escapeHtml(decision.date)} · ${escapeHtml(decision.owner)}</p>
            ${paragraphize(decision.context)}
          </article>`).join('')}
      </section>`
  });
}

function renderDecisionDetail(model, slug) {
  const decision = findBySlug(model.decisions, slug);
  if (!decision) return notFound('/decisions', 'Decision not found');
  return shell({
    title: decision.id,
    currentPath: '/decisions',
    body: `
      <section class="hero">
        <div><h1>${escapeHtml(decision.id)} — ${escapeHtml(decision.title)}</h1><p>${escapeHtml(decision.status)} · ${escapeHtml(decision.date)} · ${escapeHtml(decision.owner)}</p></div>
        <a href="/decisions">← Back to decisions</a>
      </section>
      <section class="grid list">
        <article class="panel"><h2>Context</h2>${paragraphize(decision.context)}</article>
        <article class="panel"><h2>Options considered</h2><pre>${escapeHtml(decision.options || 'Not available.')}</pre></article>
        <article class="panel"><h2>Decision</h2>${paragraphize(decision.decision)}</article>
        <article class="panel"><h2>Consequences</h2><pre>${escapeHtml(decision.consequences || 'Not available.')}</pre></article>
        <article class="panel"><h2>Follow-up tasks</h2><pre>${escapeHtml(decision.followUpTasks || 'None listed.')}</pre></article>
      </section>`
  });
}

function renderUpdates(model) {
  return shell({
    title: 'Updates',
    currentPath: '/updates',
    body: `
      <section class="hero"><div><h1>Updates timeline</h1><p>Reverse chronological activity from docs/updates.</p></div></section>
      <section class="stack">
        ${model.updates.map((update) => `
          <article class="panel">
            <div><span class="chip">${escapeHtml(update.date)}</span><span class="chip">${escapeHtml(update.author)}</span></div>
            <h2>${escapeHtml(update.title)}</h2>
            ${paragraphize(update.summary)}
            <h3>Findings</h3>
            <pre>${escapeHtml(update.findings || 'Not available.')}</pre>
            <h3>Direction</h3>
            <pre>${escapeHtml(update.direction || 'Not available.')}</pre>
          </article>`).join('')}
      </section>`
  });
}

function notFound(backHref, label) {
  return shell({
    title: 'Not found',
    currentPath: '',
    body: `<section class="panel"><h1>${escapeHtml(label)}</h1><p class="muted">The requested route does not exist in this local read-only surface.</p><a href="${backHref}">Go back</a></section>`
  });
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const model = loadDashboardModel(root);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, app: 'mb-kanban-dashboard', routes: ['/', '/board', '/decisions', '/updates', '/api/summary'] }));
    return;
  }

  if (url.pathname === '/api/summary') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(model.summary, null, 2));
    return;
  }

  if (url.pathname === '/') {
    sendHtml(res, 200, renderOverview(model));
    return;
  }

  if (url.pathname === '/board') {
    sendHtml(res, 200, renderBoard(model));
    return;
  }

  if (url.pathname.startsWith('/cards/')) {
    sendHtml(res, 200, renderCardDetail(model, decodeURIComponent(url.pathname.slice('/cards/'.length))));
    return;
  }

  if (url.pathname === '/decisions') {
    sendHtml(res, 200, renderDecisions(model));
    return;
  }

  if (url.pathname.startsWith('/decisions/')) {
    sendHtml(res, 200, renderDecisionDetail(model, decodeURIComponent(url.pathname.slice('/decisions/'.length))));
    return;
  }

  if (url.pathname === '/updates') {
    sendHtml(res, 200, renderUpdates(model));
    return;
  }

  sendHtml(res, 404, notFound('/', 'Route not found'));
}).listen(port, () => {
  console.log(`MB Kanban Dashboard listening on http://127.0.0.1:${port}`);
});
