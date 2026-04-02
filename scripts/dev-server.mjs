import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBySlug, loadDashboardModel } from '../src/app-data.mjs';
import { allowedNextStatuses, createCardFromTemplate, transitionCardStatus } from '../src/card-writes.mjs';
import { createDecisionFromTemplate } from '../src/decision-writes.mjs';
import { appendDecisionResponse } from '../src/decision-response-writes.mjs';
import { classifyDecisionType, latestDecisionResponse } from '../src/decision-models.mjs';
import { appendUpdate } from '../src/update-writes.mjs';
import { loadMetricsSnapshot } from '../src/metrics-api.mjs';

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

const port = Number(process.env.PORT || 4187);
const host = process.env.HOST || '127.0.0.1';
const startedAt = new Date().toISOString();
const root = process.env.MB_ROOT
  ? path.resolve(process.env.MB_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
    ['/metrics', 'Metrics'],
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
      .detail-layout { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); align-items: start; }
      .card, .panel { background: #121a2b; border: 1px solid #26304a; border-radius: 14px; padding: 16px; }
      .kpi { font-size: 1.75rem; font-weight: 700; }
      .muted { color: #98a3bb; }
      .tiny { font-size: 0.85rem; }
      .chip { display: inline-flex; border: 1px solid #334466; border-radius: 999px; padding: 3px 8px; font-size: 0.8rem; color: #c2d7ff; margin-right: 8px; }
      .stack { display: grid; gap: 12px; }
      .card-item { padding-top: 12px; border-top: 1px solid #26304a; }
      .card-item:first-child { border-top: 0; padding-top: 0; }
      .button-row { display: flex; gap: 10px; flex-wrap: wrap; }
      .button { padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #16203a; color: #e8ecf3; cursor: pointer; }
      .button[disabled] { opacity: 0.55; cursor: default; }
      input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #0d1322; color: #e8ecf3; }
      textarea { min-height: 110px; resize: vertical; }
      .section-copy p { margin: 0 0 10px; }
      .section-copy p:last-child { margin-bottom: 0; }
      .meta-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
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

function formatDuration(ms) {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return '0m';
  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatPercent(numerator, denominator) {
  const top = Number(numerator || 0);
  const bottom = Number(denominator || 0);
  if (!bottom) return '0%';
  return `${Math.round((top / bottom) * 100)}%`;
}

function formatDecimal(value, digits = 1) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return number.toFixed(digits);
}

function parseIsoDate(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatRelativeTimeFromNow(value, now = Date.now()) {
  const timestamp = typeof value === 'number' ? value : parseIsoDate(value);
  if (!timestamp) return 'unknown';
  const deltaMs = Math.max(0, now - timestamp);
  const minutes = Math.round(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function parsePriorityRank(value) {
  const match = String(value || '').match(/P(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function summarizeFreshness(updatedAt, now = Date.now()) {
  const timestamp = parseIsoDate(updatedAt);
  if (!timestamp) {
    return {
      label: 'Freshness unknown',
      tone: 'warn',
      detail: 'No machine-parseable timestamp on the card or run record.'
    };
  }

  const ageMs = Math.max(0, now - timestamp);
  if (ageMs <= 30 * 60 * 1000) {
    return { label: `Fresh · ${formatRelativeTimeFromNow(timestamp, now)}`, tone: 'good', detail: 'Updated within the last 30 minutes.' };
  }
  if (ageMs <= 4 * 60 * 60 * 1000) {
    return { label: `Aging · ${formatRelativeTimeFromNow(timestamp, now)}`, tone: 'ok', detail: 'Recent enough to be useful, but not live.' };
  }
  if (ageMs <= 24 * 60 * 60 * 1000) {
    return { label: `Stale today · ${formatRelativeTimeFromNow(timestamp, now)}`, tone: 'warn', detail: 'Same-day signal, but treat ETA as rough.' };
  }
  return { label: `Stale · ${formatRelativeTimeFromNow(timestamp, now)}`, tone: 'bad', detail: 'Older than a day. Likely drifted from reality.' };
}

function buildOperationsSnapshot(model, metrics) {
  const now = Date.now();
  const recentRuns = Array.isArray(metrics?.recentRuns) ? metrics.recentRuns : [];
  const readyCards = model.cards
    .filter((card) => card.status === 'Ready')
    .sort((left, right) => {
      const priorityDiff = parsePriorityRank(left.priority) - parsePriorityRank(right.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return String(left.id).localeCompare(String(right.id));
    });

  const explicitActive = model.cards
    .filter((card) => ['In Progress', 'Review'].includes(card.status))
    .map((card) => ({
      kind: 'card',
      card,
      id: card.id,
      title: card.title,
      agent: card.assignedCoder !== 'Unknown' ? card.assignedCoder : (card.owner !== 'Unknown' ? card.owner : 'Unassigned'),
      status: card.status,
      eta: card.estimate !== 'Unknown' ? card.estimate : 'Unknown — no card estimate recorded',
      updatedAt: card.updatedAt !== 'Unknown' ? card.updatedAt : null,
      freshness: summarizeFreshness(card.updatedAt, now),
      confidence: card.updatedAt && card.updatedAt !== 'Unknown' ? 'Medium' : 'Low',
      source: 'Board card metadata',
      detail: card.summary,
      nextMeaningfulUpdate: card.estimate !== 'Unknown'
        ? card.estimate
        : 'Unknown — needs manual progress update on the card'
    }));

  const recentByOwner = [];
  const seenOwners = new Set();
  for (const run of recentRuns) {
    const owner = run.metadata?.owner || run.role || 'Unknown';
    if (seenOwners.has(owner)) continue;
    seenOwners.add(owner);
    recentByOwner.push(run);
  }

  const inferredActive = explicitActive.length
    ? []
    : recentByOwner.slice(0, 4).map((run) => ({
      kind: 'inferred-run',
      id: run.task_id || run.run_id,
      title: run.task_id ? `${run.task_id} — recent completed run` : (run.label || run.run_id),
      agent: run.metadata?.owner || run.role || 'Unknown',
      status: `Inferred from last completed run (${run.status || 'unknown'})`,
      eta: 'Unknown — no live heartbeat, only last recorded completion',
      updatedAt: run.ended_at || run.started_at,
      freshness: summarizeFreshness(run.ended_at || run.started_at, now),
      confidence: 'Low',
      source: 'SQLite metrics run log',
      detail: `${run.task_id || run.label || run.run_id} finished ${formatRelativeTimeFromNow(run.ended_at || run.started_at, now)} in ${formatDuration(run.duration_ms)}.`,
      nextMeaningfulUpdate: 'When that agent posts another run or updates a card'
    }));

  const agents = [...new Set([
    ...explicitActive.map((item) => item.agent),
    ...recentByOwner.map((run) => run.metadata?.owner || run.role || 'Unknown'),
    ...readyCards.map((card) => card.assignedCoder !== 'Unknown' ? card.assignedCoder : (card.owner !== 'Unknown' ? card.owner : 'Unassigned'))
  ])].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));

  const queueByAgent = agents.map((agent) => {
    const queued = readyCards
      .filter((card) => {
        const cardAgent = card.assignedCoder !== 'Unknown' ? card.assignedCoder : (card.owner !== 'Unknown' ? card.owner : 'Unassigned');
        return cardAgent === agent;
      })
      .slice(0, 3)
      .map((card) => ({
        id: card.id,
        title: card.title,
        priority: card.priority,
        summary: card.summary,
        updatedAt: card.updatedAt,
        freshness: summarizeFreshness(card.updatedAt, now)
      }));

    const latestRun = recentByOwner.find((run) => (run.metadata?.owner || run.role || 'Unknown') === agent) || null;

    return {
      agent,
      queued,
      latestRun,
      active: explicitActive.find((item) => item.agent === agent) || null
    };
  });

  return {
    generatedAt: new Date(now).toISOString(),
    active: explicitActive.length ? explicitActive : inferredActive,
    activeMode: explicitActive.length ? 'explicit' : 'inferred',
    queueByAgent,
    readyCount: readyCards.length,
    honestyNote: explicitActive.length
      ? 'Active work comes from cards explicitly marked In Progress/Review. Freshness still depends on the last card update.'
      : 'No cards are currently marked In Progress, so this screen falls back to the latest completed runs in the local metrics DB. That is useful, but not live.'
  };
}

function renderOverview(model, metrics) {
  const operations = buildOperationsSnapshot(model, metrics);
  const summary = metrics?.summary || {};
  const byStatus = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];
  const byOwner = Array.isArray(metrics?.byOwner) ? metrics.byOwner : [];
  const recentRuns = Array.isArray(metrics?.recentRuns) ? metrics.recentRuns.slice(0, 5) : [];
  const timeline = Array.isArray(metrics?.timeline) ? metrics.timeline.slice(0, 7) : [];
  const totalRuns = Number(summary.total_runs || 0);
  const successfulRuns = Number(summary.successful_runs || 0);
  const avgDuration = formatDuration(summary.avg_duration_ms);
  const totalArtifacts = Number(summary.total_artifacts || 0);
  const successRate = formatPercent(successfulRuns, totalRuns);
  const boardHealth = model.summary.blockedCount
    ? `${model.summary.blockedCount} blocked card(s)`
    : 'No blocked cards right now';
  const topOwner = byOwner[0];
  const toneColor = {
    good: '#22c55e',
    ok: '#60a5fa',
    warn: '#f59e0b',
    bad: '#ef4444'
  };

  return shell({
    title: 'Overview',
    currentPath: '/',
    body: `
      <section class="hero">
        <div>
          <h1>Operator dashboard</h1>
          <p>Truth-first ops view: active work, likely owner, next useful update window, and queued-next cards per agent.</p>
        </div>
        <div class="muted">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>
      <section class="panel">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap;">
          <div>
            <h2>What is active right now</h2>
            <p class="muted" style="margin:0;">${escapeHtml(operations.honestyNote)}</p>
          </div>
          <div class="chip">Mode: ${escapeHtml(operations.activeMode === 'explicit' ? 'explicit board state' : 'inferred from local run log')}</div>
        </div>
        <div class="stack" style="margin-top:16px;">
          ${operations.active.length ? operations.active.map((item) => `
            <article class="card-item">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
                <div>
                  <strong>${escapeHtml(item.id)} — ${escapeHtml(item.title)}</strong>
                  <div class="tiny muted" style="margin-top:6px;">${escapeHtml(item.detail)}</div>
                </div>
                <div class="chip">${escapeHtml(item.status)}</div>
              </div>
              <div class="grid stats" style="margin-top:12px;grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
                <div><div class="tiny muted">Agent</div><div>${escapeHtml(item.agent)}</div></div>
                <div><div class="tiny muted">Next meaningful update</div><div>${escapeHtml(item.nextMeaningfulUpdate)}</div></div>
                <div><div class="tiny muted">ETA confidence</div><div>${escapeHtml(item.confidence)}</div></div>
                <div><div class="tiny muted">Source</div><div>${escapeHtml(item.source)}</div></div>
              </div>
              <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <span class="chip" style="border-color:${toneColor[item.freshness.tone] || '#334466'}; color:${toneColor[item.freshness.tone] || '#c2d7ff'};">${escapeHtml(item.freshness.label)}</span>
                <span class="tiny muted">${escapeHtml(item.freshness.detail)}</span>
              </div>
            </article>
          `).join('') : '<p class="muted">No active work signal found locally.</p>'}
        </div>
      </section>
      <section class="panel">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap;">
          <div>
            <h2>Queued next by agent</h2>
            <p class="muted" style="margin:0;">Only cards in <code>Ready</code> are treated as queued-next. Unassigned work is called out instead of being magically assigned.</p>
          </div>
          <div class="chip">${operations.readyCount} ready card(s)</div>
        </div>
        <div class="grid list" style="margin-top:16px;">
          ${operations.queueByAgent.map((entry) => `
            <article class="card">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
                <div>
                  <strong>${escapeHtml(entry.agent)}</strong>
                  <div class="tiny muted" style="margin-top:6px;">${entry.active ? `Currently tied to ${escapeHtml(entry.active.id)}.` : 'No explicit in-progress card.'}</div>
                </div>
                <div class="chip">${entry.queued.length} queued</div>
              </div>
              <div class="stack" style="margin-top:14px;">
                ${entry.queued.length ? entry.queued.map((card) => `
                  <div class="card-item">
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
                      <div>
                        <a href="/cards/${encodeURIComponent(card.id.toLowerCase())}"><strong>${escapeHtml(card.id)}</strong></a>
                        <div class="tiny muted" style="margin-top:6px;">${escapeHtml(card.title)}</div>
                      </div>
                      <div class="chip">${escapeHtml(card.priority || 'No priority')}</div>
                    </div>
                    <div class="tiny muted" style="margin-top:8px;">${escapeHtml(card.summary)}</div>
                    <div class="tiny muted" style="margin-top:8px;">${escapeHtml(card.freshness.label)}</div>
                  </div>
                `).join('') : '<div class="card-item"><span class="muted">No ready work explicitly queued for this agent.</span></div>'}
              </div>
              ${entry.latestRun ? `<div class="tiny muted" style="margin-top:14px;">Last local run: ${escapeHtml(entry.latestRun.task_id || entry.latestRun.run_id)} finished ${escapeHtml(formatRelativeTimeFromNow(entry.latestRun.ended_at || entry.latestRun.started_at))}.</div>` : '<div class="tiny muted" style="margin-top:14px;">No local run history found for this agent.</div>'}
            </article>
          `).join('')}
        </div>
      </section>
      <section class="grid stats">
        <article class="card"><div class="muted">Open cards</div><div class="kpi">${model.summary.cardCount}</div><div class="tiny muted">${model.summary.activeCount} in progress · ${model.summary.doneCount} done</div></article>
        <article class="card"><div class="muted">Total runs</div><div class="kpi">${totalRuns}</div><div class="tiny muted">${successfulRuns} successful · ${successRate} success rate</div></article>
        <article class="card"><div class="muted">Average run time</div><div class="kpi">${escapeHtml(avgDuration)}</div><div class="tiny muted">${totalArtifacts} artifacts recorded</div></article>
        <article class="card"><div class="muted">Decisions / updates</div><div class="kpi">${model.summary.decisionCount} / ${model.summary.updateCount}</div><div class="tiny muted">${escapeHtml(boardHealth)}</div></article>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>Board snapshot</h2>
          <div class="grid stats">
            <article class="card"><div class="muted tiny">Ready</div><div class="kpi">${model.summary.readyCount}</div></article>
            <article class="card"><div class="muted tiny">In progress</div><div class="kpi">${model.summary.activeCount}</div></article>
            <article class="card"><div class="muted tiny">Blocked</div><div class="kpi">${model.summary.blockedCount}</div></article>
            <article class="card"><div class="muted tiny">Done</div><div class="kpi">${model.summary.doneCount}</div></article>
          </div>
          <div class="stack" style="margin-top: 16px;">
            ${model.board.map((column) => `<div class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(column.status)}</strong><span class="muted">${column.cards.length}</span></div><div class="tiny muted">${column.cards.slice(0, 2).map((card) => escapeHtml(card.id)).join(' · ') || 'No cards'}</div></div>`).join('')}
          </div>
        </article>
        <article class="panel">
          <h2>Run status mix</h2>
          <div class="stack">
            ${byStatus.length ? byStatus.map((row) => `<div class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(row.status)}</strong><span>${row.runs}</span></div><div class="tiny muted">${formatPercent(row.runs, totalRuns)} of recorded runs</div></div>`).join('') : '<p class="muted">No metrics runs found for this project.</p>'}
          </div>
        </article>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>Owner throughput</h2>
          ${topOwner ? `<p class="muted">Top owner: ${escapeHtml(topOwner.owner)} with ${topOwner.runs} run(s) averaging ${escapeHtml(formatDuration(topOwner.avg_duration_ms))}.</p>` : '<p class="muted">No owner data yet.</p>'}
          <div class="stack">
            ${byOwner.length ? byOwner.map((row) => `<div class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(row.owner)}</strong><span>${row.runs} run(s)</span></div><div class="tiny muted">avg ${escapeHtml(formatDuration(row.avg_duration_ms))} · ${row.artifacts_count} artifact(s)</div></div>`).join('') : '<p class="muted">No owner metrics found.</p>'}
          </div>
        </article>
        <article class="panel">
          <h2>Recent runs</h2>
          <div class="stack">
            ${recentRuns.length ? recentRuns.map((run) => `<div class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(run.task_id || run.label || run.run_id)}</strong><span class="chip">${escapeHtml(run.status || 'unknown')}</span></div><div class="tiny muted">${escapeHtml(run.metadata?.owner || run.role || 'unknown')} · ${escapeHtml(formatDuration(run.duration_ms))} · ${run.artifacts_count || 0} artifact(s)</div><div class="tiny muted">${escapeHtml(run.started_at || '')}</div></div>`).join('') : '<p class="muted">No recent runs found.</p>'}
          </div>
        </article>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>Timeline</h2>
          <div class="stack">
            ${timeline.length ? timeline.map((row) => `<div class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(row.day)}</strong><span>${row.runs} run(s)</span></div><div class="tiny muted">${row.successful_runs} successful · avg ${escapeHtml(formatDuration(row.avg_duration_ms))} · ${row.total_tokens || 0} tokens</div></div>`).join('') : '<p class="muted">No timeline buckets found.</p>'}
          </div>
        </article>
        <article class="panel">
          <h2>Routes</h2>
          <div class="stack">
            <div><a href="/board">/board</a><div class="muted">Kanban board with filtering and safe create/write actions.</div></div>
            <div><a href="/decisions">/decisions</a><div class="muted">Decision records with in-page inspection and dedicated routes.</div></div>
            <div><a href="/updates">/updates</a><div class="muted">Reverse chronological updates from repo markdown.</div></div>
            <div><a href="/api/metrics/summary">/api/metrics/summary</a><div class="muted">Overview metrics JSON for quick inspection.</div></div>
          </div>
          ${model.summary.unknownStatuses.length ? `<p class="muted" style="margin-top: 16px;">Unknown board statuses: ${escapeHtml(model.summary.unknownStatuses.join(', '))}</p>` : '<p class="muted" style="margin-top: 16px;">No unknown card statuses detected.</p>'}
        </article>
      </section>`
  });
}

function renderMetricsScreen(model, metrics) {
  const comparison = Array.isArray(metrics?.comparison) ? metrics.comparison : [];
  const timeline = Array.isArray(metrics?.timeline) ? metrics.timeline : [];
  const initialData = JSON.stringify({
    generatedAt: model.generatedAt,
    projectId: metrics?.projectId || 'mb-kanban-dashboard',
    summary: metrics?.summary || {},
    comparison,
    timeline,
    hourly: Array.isArray(metrics?.timeline) ? metrics.timeline : []
  }).replace(/</g, '\\u003c');

  return shell({
    title: 'Metrics',
    currentPath: '/metrics',
    body: `
      <section class="hero">
        <div>
          <h1>Metrics timeline & comparison</h1>
          <p>Dedicated metrics screen over the existing SQLite-backed MB run log.</p>
        </div>
        <div class="muted" id="metrics-generated-at">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>
      <section class="grid stats" id="metrics-summary">
        <article class="card"><div class="muted">Timeline days</div><div class="kpi" data-summary="days">${timeline.length}</div><div class="tiny muted">Daily buckets from /api/metrics/timeline</div></article>
        <article class="card"><div class="muted">Compared owners</div><div class="kpi" data-summary="owners">${comparison.length}</div><div class="tiny muted">Grouped from /api/metrics/comparison</div></article>
        <article class="card"><div class="muted">Total runs</div><div class="kpi" data-summary="runs">${Number(metrics?.summary?.total_runs || 0)}</div><div class="tiny muted">${formatPercent(metrics?.summary?.successful_runs, metrics?.summary?.total_runs)} success rate</div></article>
        <article class="card"><div class="muted">Avg run time</div><div class="kpi" data-summary="duration">${escapeHtml(formatDuration(metrics?.summary?.avg_duration_ms))}</div><div class="tiny muted">${Number(metrics?.summary?.total_artifacts || 0)} artifacts captured</div></article>
      </section>
      <section class="panel">
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end;">
          <label class="stack">
            <span class="muted">Owner filter</span>
            <select id="metrics-owner-filter">
              <option value="">All owners</option>
              ${comparison.map((row) => `<option value="${escapeHtml(row.owner)}">${escapeHtml(row.owner)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Sort owners by</span>
            <select id="metrics-sort">
              <option value="runs">Runs</option>
              <option value="successRate">Success rate</option>
              <option value="avgDuration">Average duration</option>
              <option value="artifacts">Artifacts</option>
            </select>
          </label>
          <label class="stack">
            <span class="muted">Timeline window</span>
            <select id="metrics-window">
              <option value="7">Last 7 buckets</option>
              <option value="14">Last 14 buckets</option>
              <option value="30">Last 30 buckets</option>
              <option value="all">All buckets</option>
            </select>
          </label>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
          <button id="metrics-clear" type="button" class="button">Reset view</button>
          <div class="muted" id="metrics-filter-state">Showing full metrics comparison.</div>
        </div>
      </section>
      <section class="panel">
        <h2>Hourly Utilization</h2>
        <div class="muted">Runs per hour (last 24-48 buckets) showing concurrent activity and overnight bursts.</div>
        <div id="metrics-hourly-chart" style="margin-top: 20px; height: 180px; display: flex; align-items: end; gap: 4px; border-bottom: 1px solid #26304a; padding-bottom: 8px; overflow-x: auto;"></div>
        <div id="metrics-hourly-labels" style="display: flex; gap: 4px; overflow-x: auto; margin-top: 8px;"></div>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>Owner comparison</h2>
          <div class="muted">Compare run volume, success rate, duration, and artifacts by owner.</div>
          <div class="stack" id="metrics-owner-comparison" style="margin-top: 16px;"></div>
        </article>
        <article class="panel">
          <h2>Timeline</h2>
          <div class="muted">Daily run buckets with day-over-day deltas for volume and average duration.</div>
          <div class="stack" id="metrics-timeline" style="margin-top: 16px;"></div>
        </article>
      </section>
      <section class="grid list">
        <article class="panel">
          <h2>What this screen is for</h2>
          <div class="stack">
            <div class="card-item"><strong>Timeline</strong><div class="tiny muted">See how run volume and average duration move over time.</div></div>
            <div class="card-item"><strong>Comparison</strong><div class="tiny muted">Spot which owner/workstream is carrying the most runs or producing the most artifacts.</div></div>
            <div class="card-item"><strong>API-backed</strong><div class="tiny muted">Hydrates from <code>/api/metrics/timeline</code> and <code>/api/metrics/comparison</code>.</div></div>
          </div>
        </article>
        <article class="panel">
          <h2>JSON routes</h2>
          <div class="stack">
            <div><a href="/api/metrics/summary">/api/metrics/summary</a><div class="muted">Top-level totals and grouped status/owner breakdowns.</div></div>
            <div><a href="/api/metrics/timeline">/api/metrics/timeline</a><div class="muted">Daily buckets for charts or sparkline-style UI.</div></div>
            <div><a href="/api/metrics/comparison">/api/metrics/comparison</a><div class="muted">Owner comparison rows for leaderboards and side-by-side review.</div></div>
          </div>
        </article>
      </section>
      <script id="metrics-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const embedded = document.getElementById('metrics-data');
          const initial = embedded ? JSON.parse(embedded.textContent) : null;
          const ownerFilterEl = document.getElementById('metrics-owner-filter');
          const sortEl = document.getElementById('metrics-sort');
          const windowEl = document.getElementById('metrics-window');
          const clearEl = document.getElementById('metrics-clear');
          const stateEl = document.getElementById('metrics-filter-state');
          const generatedEl = document.getElementById('metrics-generated-at');
          const ownerListEl = document.getElementById('metrics-owner-comparison');
          const timelineEl = document.getElementById('metrics-timeline');
          const hourlyChartEl = document.getElementById('metrics-hourly-chart');
          const hourlyLabelsEl = document.getElementById('metrics-hourly-labels');
          const summaryEls = {
            days: document.querySelector('[data-summary="days"]'),
            owners: document.querySelector('[data-summary="owners"]'),
            runs: document.querySelector('[data-summary="runs"]'),
            duration: document.querySelector('[data-summary="duration"]')
          };

          function esc(value) {
            return String(value || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          function formatDurationClient(ms) {
            const value = Number(ms || 0);
            if (!Number.isFinite(value) || value <= 0) return '0m';
            const totalSeconds = Math.round(value / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours) return hours + 'h ' + minutes + 'm';
            if (minutes) return minutes + 'm ' + seconds + 's';
            return seconds + 's';
          }

          function percent(numerator, denominator) {
            const top = Number(numerator || 0);
            const bottom = Number(denominator || 0);
            if (!bottom) return '0%';
            return Math.round((top / bottom) * 100) + '%';
          }

          function decimal(value, digits = 1) {
            const number = Number(value || 0);
            if (!Number.isFinite(number)) return '0';
            return number.toFixed(digits);
          }

          function toOwnerRows(rows) {
            return (rows || []).map((row) => ({
              ...row,
              successRate: Number(row.runs || 0) ? Number(row.successful_runs || 0) / Number(row.runs || 0) : 0,
              avgDuration: Number(row.avg_duration_ms || 0),
              artifacts: Number(row.artifacts_count || 0)
            }));
          }

          function ownerMarkup(row, topRuns) {
            const width = topRuns > 0 ? Math.max(8, Math.round((Number(row.runs || 0) / topRuns) * 100)) : 8;
            return '<article class="card-item">'
              + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;"><strong>' + esc(row.owner) + '</strong><span class="chip">' + esc(String(row.runs || 0)) + ' run(s)</span></div>'
              + '<div style="margin-top:10px;height:10px;border-radius:999px;background:#0d1322;border:1px solid #26304a;overflow:hidden;"><div style="height:100%;width:' + width + '%;background:linear-gradient(90deg,#4f8cff,#6dd3ff);"></div></div>'
              + '<div class="grid stats" style="margin-top:12px;grid-template-columns: repeat(4, minmax(0, 1fr));">'
              + '<div><div class="tiny muted">Success</div><div>' + esc(percent(row.successful_runs, row.runs)) + '</div></div>'
              + '<div><div class="tiny muted">Avg duration</div><div>' + esc(formatDurationClient(row.avg_duration_ms)) + '</div></div>'
              + '<div><div class="tiny muted">Artifacts</div><div>' + esc(String(row.artifacts_count || 0)) + '</div></div>'
              + '<div><div class="tiny muted">Avg/run</div><div>' + esc(decimal(row.avg_artifacts_per_run || 0, 1)) + '</div></div>'
              + '</div>'
              + '<div class="tiny muted" style="margin-top:10px;">First seen ' + esc(row.first_started_at || 'n/a') + ' · Last activity ' + esc(row.last_activity_at || 'n/a') + '</div>'
              + '</article>';
          }

          function timelineMarkup(row, previous) {
            const runDelta = previous ? Number(row.runs || 0) - Number(previous.runs || 0) : null;
            const durationDelta = previous ? Number(row.avg_duration_ms || 0) - Number(previous.avg_duration_ms || 0) : null;
            const runDeltaText = runDelta === null ? 'baseline bucket' : (runDelta >= 0 ? '+' : '') + runDelta + ' vs previous';
            const durationDeltaText = durationDelta === null ? 'baseline bucket' : ((durationDelta >= 0 ? '+' : '') + formatDurationClient(Math.abs(durationDelta)) + ' avg duration shift');
            return '<article class="card-item">'
              + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;"><strong>' + esc(row.day) + '</strong><span class="chip">' + esc(String(row.runs || 0)) + ' run(s)</span></div>'
              + '<div class="grid stats" style="margin-top:12px;grid-template-columns: repeat(4, minmax(0, 1fr));">'
              + '<div><div class="tiny muted">Successful</div><div>' + esc(String(row.successful_runs || 0)) + '</div></div>'
              + '<div><div class="tiny muted">Success rate</div><div>' + esc(percent(row.successful_runs, row.runs)) + '</div></div>'
              + '<div><div class="tiny muted">Avg duration</div><div>' + esc(formatDurationClient(row.avg_duration_ms)) + '</div></div>'
              + '<div><div class="tiny muted">Tokens</div><div>' + esc(String(row.total_tokens || 0)) + '</div></div>'
              + '</div>'
              + '<div class="tiny muted" style="margin-top:10px;">' + esc(runDeltaText) + ' · ' + esc(durationDeltaText) + '</div>'
              + '</article>';
          }

          function applySummary(owners, timeline) {
            summaryEls.days.textContent = String(timeline.length);
            summaryEls.owners.textContent = String(owners.length);
            summaryEls.runs.textContent = String((owners || []).reduce((sum, row) => sum + Number(row.runs || 0), 0));
            const avg = owners.length ? owners.reduce((sum, row) => sum + Number(row.avg_duration_ms || 0), 0) / owners.length : 0;
            summaryEls.duration.textContent = formatDurationClient(avg);
          }

          function renderHourly(timeline) {
            if (!timeline || !timeline.length) {
              hourlyChartEl.innerHTML = '<p class="muted">No hourly data available.</p>';
              return;
            }
            // Timeline is DESC (newest first). Reverse for the chart (oldest to newest).
            const data = [...timeline].reverse();
            const maxRuns = data.reduce((max, row) => Math.max(max, Number(row.runs || 0)), 1);
            
            hourlyChartEl.innerHTML = data.map((row) => {
              const height = Math.max(4, Math.round((Number(row.runs || 0) / maxRuns) * 100));
              const color = Number(row.runs || 0) > 0 ? 'linear-gradient(0deg, #1e3a8a, #3b82f6)' : '#1a202c';
              const hourLabel = row.day.includes(' ') ? row.day.split(' ')[1] : row.day.slice(-2);
              const tooltip = row.day + ': ' + row.runs + ' run(s)';
              return '<div title="' + esc(tooltip) + '" style="flex: 1; min-width: 20px; height: ' + height + '%; background: ' + color + '; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>';
            }).join('');

            hourlyLabelsEl.innerHTML = data.map((row, i) => {
              // Only show every 3rd label to avoid clutter
              const hourLabel = row.day.includes(' ') ? row.day.split(' ')[1] : row.day.slice(-2);
              const labelText = (i % 3 === 0) ? hourLabel + 'h' : '';
              return '<div style="flex: 1; min-width: 20px; text-align: center; font-size: 0.7rem; color: #98a3bb;">' + esc(labelText) + '</div>';
            }).join('');
          }

          function render(payload) {
            const allOwners = toOwnerRows(payload.comparison || []);
            const ownerFilter = ownerFilterEl.value;
            const sortKey = sortEl.value;
            const windowValue = windowEl.value;
            const owners = allOwners
              .filter((row) => !ownerFilter || row.owner === ownerFilter)
              .sort((left, right) => {
                const valueFor = (row) => {
                  if (sortKey === 'successRate') return row.successRate;
                  if (sortKey === 'avgDuration') return row.avgDuration;
                  if (sortKey === 'artifacts') return row.artifacts;
                  return Number(row.runs || 0);
                };
                return valueFor(right) - valueFor(left) || String(left.owner).localeCompare(String(right.owner));
              });
            const allTimeline = payload.timeline || [];
            const windowSize = windowValue === 'all' ? allTimeline.length : Number(windowValue || 7);
            const timeline = allTimeline.slice(0, windowSize);
            const topRuns = owners.reduce((max, row) => Math.max(max, Number(row.runs || 0)), 0);

            ownerListEl.innerHTML = owners.length
              ? owners.map((row) => ownerMarkup(row, topRuns)).join('')
              : '<p class="muted">No owner rows match the current comparison filters.</p>';
            timelineEl.innerHTML = timeline.length
              ? timeline.map((row, index) => timelineMarkup(row, timeline[index + 1] || null)).join('')
              : '<p class="muted">No timeline buckets available.</p>';
            renderHourly(payload.timeline);
            applySummary(owners, timeline);
            generatedEl.textContent = 'Generated ' + (payload.generatedAt || new Date().toISOString());
            const active = [ownerFilter && 'owner', sortKey !== 'runs' && 'sort', windowValue !== '7' && 'window'].filter(Boolean);
            stateEl.textContent = active.length
              ? 'Filtered metrics view: ' + active.join(', ') + '.'
              : 'Showing full metrics comparison.';
          }

          async function loadPayload() {
            try {
              const [comparisonRes, timelineRes, summaryRes] = await Promise.all([
                fetch('/api/metrics/comparison'),
                fetch('/api/metrics/timeline'),
                fetch('/api/metrics/summary')
              ]);
              if (!comparisonRes.ok || !timelineRes.ok || !summaryRes.ok) throw new Error('metrics api failed');
              const [comparison, timeline, summary] = await Promise.all([
                comparisonRes.json(),
                timelineRes.json(),
                summaryRes.json()
              ]);
              return {
                generatedAt: new Date().toISOString(),
                projectId: summary.projectId,
                summary: summary.summary,
                comparison: comparison.items || [],
                timeline: timeline.items || []
              };
            } catch {
              return initial;
            }
          }

          function wire(payload) {
            [ownerFilterEl, sortEl, windowEl].forEach((el) => el.addEventListener('input', () => render(payload)));
            clearEl.addEventListener('click', () => {
              ownerFilterEl.value = '';
              sortEl.value = 'runs';
              windowEl.value = '7';
              render(payload);
            });
            render(payload);
          }

          loadPayload().then((payload) => payload && wire(payload));
        })();
      </script>`
  });
}

function renderBoard(model) {
  const ownerOptions = [...new Set(model.cards.map((card) => card.owner).filter(Boolean))].sort();
  const priorityOptions = [...new Set(model.cards.map((card) => card.priority).filter(Boolean))].sort();
  const projectOptions = [...new Set(model.cards.map((card) => card.project).filter(Boolean))].sort();

  const initialData = JSON.stringify({
    generatedAt: model.generatedAt,
    statusOrder: model.statusOrder,
    summary: model.summary,
    board: model.board.map((column) => ({
      status: column.status,
      count: column.cards.length,
      cards: column.cards.map(cardApiShape)
    })),
    filters: {
      owners: ownerOptions,
      priorities: priorityOptions,
      projects: projectOptions
    }
  }).replace(/</g, '\\u003c');

  const initialSwimlanes = [...new Set(model.cards.map((card) => card.project).filter(Boolean))]
    .sort()
    .map((projectName) => {
      const cardsByStatus = Object.fromEntries(
        model.statusOrder.map((status) => [status, model.cards.filter((card) => card.project === projectName && card.status === status)])
      );
      return renderBoardSwimlane(projectName, cardsByStatus, model.statusOrder);
    })
    .join('') || '<p class="muted">No cards available.</p>';

  return shell({
    title: 'Board',
    currentPath: '/board',
    body: `
      <style>
        .drawer {
          position: fixed;
          top: 0;
          right: -420px;
          width: 420px;
          height: 100vh;
          background: #0e1427;
          border-left: 1px solid #26304a;
          transition: right 0.3s ease;
          z-index: 1000;
          padding: 24px;
          overflow-y: auto;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }
        .drawer.open { right: 0; }
        .drawer-handle {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: #4f8cff;
          color: white;
          padding: 20px 8px;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-weight: bold;
          z-index: 1001;
          user-select: none;
        }
        .swimlane { margin-bottom: 32px; }
        .swimlane-header {
          background: #121a2b;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border: 1px solid #26304a;
        }
        .swimlane-title { font-size: 1.25rem; font-weight: 700; }
        .board-row {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(280px, 1fr);
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 12px;
        }
        .board-col { display: flex; flex-direction: column; gap: 12px; min-height: 100px; }
        .status-badge {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #98a3bb;
          margin-bottom: 8px;
          padding-left: 4px;
        }
      </style>

      <section class="hero">
        <div>
          <h1>Board</h1>
          <p>Swimlane view grouped by project with project drill-in.</p>
        </div>
        <div class="muted" id="board-generated-at">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>

      <div class="drawer-handle" id="drawer-toggle">CREATE NEW CARD</div>
      <aside class="drawer" id="create-card-drawer">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2>Create new card</h2>
          <button class="button" id="drawer-close" style="padding: 4px 10px;">✕</button>
        </div>
        <form id="create-card-form" class="stack">
          <label class="stack"><span class="muted">Project</span><input name="project" type="text" placeholder="Motherbrain" value="Motherbrain" required /></label>
          <label class="stack"><span class="muted">Card ID</span><input name="id" type="text" placeholder="MB-052" required /></label>
          <label class="stack"><span class="muted">Title</span><input name="title" type="text" placeholder="Task title" required /></label>
          <label class="stack"><span class="muted">Owner</span><input name="owner" type="text" placeholder="Coder-5" required /></label>
          <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
            <label class="stack"><span class="muted">Priority</span><input name="priority" type="text" value="P2 normal" /></label>
            <label class="stack"><span class="muted">Status</span><select name="status">${model.statusOrder.map((status) => `<option value="${escapeHtml(status)}"${status === 'Backlog' ? ' selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
          </div>
          <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
            <label class="stack"><span class="muted">Assigned Coder</span><input name="assignedCoder" type="text" placeholder="Coder-1" /></label>
            <label class="stack"><span class="muted">Estimate</span><input name="estimate" type="text" placeholder="2h" /></label>
          </div>
          <label class="stack"><span class="muted">Objective</span><textarea name="objective" placeholder="Describe the concrete objective." required></textarea></label>
          <div class="button-row">
            <button class="button" id="create-card-submit" type="submit">Create card</button>
          </div>
          <p class="muted tiny" id="create-card-result"></p>
        </form>
      </aside>

      <section class="grid stats" id="board-summary">
        <article class="card"><div class="muted">Visible cards</div><div class="kpi" data-summary="visible">${model.summary.cardCount}</div></article>
        <article class="card"><div class="muted">In Progress</div><div class="kpi" data-summary="active">${model.summary.activeCount}</div></article>
        <article class="card"><div class="muted">Blocked</div><div class="kpi" data-summary="blocked">${model.summary.blockedCount}</div></article>
        <article class="card"><div class="muted">Done</div><div class="kpi" data-summary="done">${model.summary.doneCount}</div></article>
      </section>

      <section class="panel">
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end;">
          <label class="stack">
            <span class="muted">Search</span>
            <input id="board-search" type="search" placeholder="ID, title, summary" />
          </label>
          <label class="stack">
            <span class="muted">Project</span>
            <select id="board-project-filter">
              <option value="">All projects</option>
              ${projectOptions.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Owner</span>
            <select id="board-owner">
              <option value="">All owners</option>
              ${ownerOptions.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Priority</span>
            <select id="board-priority">
              <option value="">All priorities</option>
              ${priorityOptions.map((priority) => `<option value="${escapeHtml(priority)}">${escapeHtml(priority)}</option>`).join('')}
            </select>
          </label>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
          <button id="board-clear" type="button" class="button">Clear filters</button>
          <div class="muted" id="board-filter-state">Showing all cards.</div>
        </div>
      </section>

      <div id="board-swimlanes">${initialSwimlanes}</div>

      <script id="board-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const embedded = document.getElementById('board-data');
          const initial = embedded ? JSON.parse(embedded.textContent) : null;
          const swimlanesEl = document.getElementById('board-swimlanes');
          const searchEl = document.getElementById('board-search');
          const ownerEl = document.getElementById('board-owner');
          const priorityEl = document.getElementById('board-priority');
          const projectFilterEl = document.getElementById('board-project-filter');
          const clearEl = document.getElementById('board-clear');
          const stateEl = document.getElementById('board-filter-state');
          const generatedEl = document.getElementById('board-generated-at');
          const createFormEl = document.getElementById('create-card-form');
          const createResultEl = document.getElementById('create-card-result');
          const createSubmitEl = document.getElementById('create-card-submit');
          const drawerEl = document.getElementById('create-card-drawer');
          const drawerToggleEl = document.getElementById('drawer-toggle');
          const drawerCloseEl = document.getElementById('drawer-close');

          const summaryEls = {
            visible: document.querySelector('[data-summary="visible"]'),
            active: document.querySelector('[data-summary="active"]'),
            blocked: document.querySelector('[data-summary="blocked"]'),
            done: document.querySelector('[data-summary="done"]')
          };

          const normalized = (value) => String(value || '').toLowerCase();

          function matches(card) {
            const search = normalized(searchEl.value).trim();
            const owner = ownerEl.value;
            const priority = priorityEl.value;
            const project = projectFilterEl.value;
            const haystack = [card.id, card.title, card.summary, card.owner, card.priority, card.project].map(normalized).join(' ');
            return (!search || haystack.includes(search))
              && (!owner || card.owner === owner)
              && (!priority || card.priority === priority)
              && (!project || card.project === project);
          }

          function esc(value) {
            return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          }

          function swimlaneMarkup(projectName, cardsByStatus, statusOrder) {
            const projectCards = Object.values(cardsByStatus).flat();
            if (projectCards.length === 0) return '';

            const effectiveStatusOrder = statusOrder.filter((s) => s !== 'Archive');

            return '<div class="swimlane">'
              + '<div class="swimlane-header">'
              + '<span class="swimlane-title">' + esc(projectName) + '</span>'
              + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
              + '<span class="chip" style="margin-right:0;">' + projectCards.length + ' card(s)</span>'
              + '<a href="/projects/' + encodeURIComponent(projectName) + '" class="button">View Project</a>'
              + '</div>'
              + '</div>'
              + '<div class="board-row">'
              + effectiveStatusOrder.map((status) => {
                  const cards = cardsByStatus[status] || [];
                  return '<div class="board-col">'
                    + '<div class="status-badge">' + esc(status) + ' (' + cards.length + ')</div>'
                    + cards.map((card) => {
                        return '<article class="card" style="padding: 12px; margin-bottom: 0; flex: 0 0 auto;">'
                          + '<div style="display:flex; justify-content:space-between; margin-bottom: 8px; gap: 8px;">'
                          + '<span class="chip" style="margin-right:4px; font-size:0.7rem;">' + esc(card.id) + '</span>'
                          + '<span class="chip" style="margin-right:0; font-size:0.7rem;">' + esc(card.priority || 'Unknown') + '</span>'
                          + '</div>'
                          + '<h3 style="font-size: 0.95rem; margin: 0 0 8px;"><a href="/cards/' + encodeURIComponent(card.slug) + '">' + esc(card.title) + '</a></h3>'
                          + '<div class="tiny muted">' + esc(card.owner || 'Unknown') + '</div>'
                          + '</article>';
                      }).join('')
                    + '</div>';
                }).join('')
              + '</div>'
              + '</div>';
          }

          function render(payload) {
            const allCards = payload.board.flatMap(col => col.cards).filter(matches);
            const projects = [...new Set(allCards.map(c => c.project))].sort();
            const statusOrder = payload.statusOrder;

            let html = '';
            projects.forEach(proj => {
              const projCards = allCards.filter(c => c.project === proj);
              const grouped = {};
              statusOrder.forEach(s => {
                grouped[s] = projCards.filter(c => c.status === s);
              });
              html += swimlaneMarkup(proj, grouped, statusOrder);
            });

            swimlanesEl.innerHTML = html || '<p class="muted">No cards match the current filters.</p>';

            summaryEls.visible.textContent = String(allCards.length);
            summaryEls.active.textContent = String(allCards.filter((card) => card.status === 'In Progress').length);
            summaryEls.blocked.textContent = String(allCards.filter((card) => card.status === 'Blocked').length);
            summaryEls.done.textContent = String(allCards.filter((card) => card.status === 'Done').length);

            const activeFilters = [searchEl.value && 'search', ownerEl.value && 'owner', priorityEl.value && 'priority', projectFilterEl.value && 'project'].filter(Boolean);
            stateEl.textContent = activeFilters.length ? 'Showing ' + allCards.length + ' filtered card(s).' : 'Showing all cards.';
          }

          drawerToggleEl.addEventListener('click', () => drawerEl.classList.toggle('open'));
          drawerCloseEl.addEventListener('click', () => drawerEl.classList.remove('open'));

          async function submitCreateCard(event, payload) {
            event.preventDefault();
            createSubmitEl.disabled = true;
            createResultEl.textContent = 'Creating card…';
            const formData = new FormData(createFormEl);
            const data = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));

            try {
              const response = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed');

              const refreshed = await (await fetch('/api/board')).json();
              payload.board = refreshed.board;
              render(payload);
              createFormEl.reset();
              createResultEl.innerHTML = 'Created <a href="/cards/' + encodeURIComponent(result.slug) + '">' + result.cardId + '</a>';
              setTimeout(() => drawerEl.classList.remove('open'), 1500);
            } catch (err) {
              createResultEl.textContent = err.message;
            } finally {
              createSubmitEl.disabled = false;
            }
          }

          function wire(payload) {
            [searchEl, ownerEl, priorityEl, projectFilterEl].forEach(el => el.addEventListener('input', () => render(payload)));
            createFormEl.addEventListener('submit', (e) => submitCreateCard(e, payload));
            clearEl.addEventListener('click', () => {
              searchEl.value = ''; ownerEl.value = ''; priorityEl.value = ''; projectFilterEl.value = '';
              render(payload);
            });
            render(payload);
          }

          wire(initial);
        })();
      </script>`
  });
}

function renderCardDetail(model, slug) {
  const card = findBySlug(model.cards, slug);
  if (!card) return notFound('/board', 'Card not found');

  const initialData = JSON.stringify({
    generatedAt: model.generatedAt,
    card: cardApiShape(card)
  }).replace(/</g, '\\u003c');

  return shell({
    title: card.id,
    currentPath: '/board',
    body: `
      <style>
        .artifact-link { display: inline-block; padding: 2px 6px; background: #1a2a4a; border-radius: 4px; border: 1px solid #334466; margin-bottom: 4px; font-family: monospace; font-size: 0.85rem; }
      </style>
      <section class="hero">
        <div>
          <h1 id="card-title">${escapeHtml(card.id)} — ${escapeHtml(card.title)}</h1>
          <p id="card-subtitle">Card detail screen over the repo-backed card API.</p>
        </div>
        <div class="button-row">
          <a class="button" href="/board">← Back to board</a>
          <a class="button" id="card-api-link" href="/api/cards/${encodeURIComponent(card.slug)}">Open JSON</a>
        </div>
      </section>
      <section class="grid stats meta-grid" id="card-meta-grid">
        <article class="card"><div class="muted tiny">Status</div><div class="kpi" id="card-status">${escapeHtml(card.status)}</div></article>
        <article class="card"><div class="muted tiny">Priority</div><div class="kpi" id="card-priority">${escapeHtml(card.priority)}</div></article>
        <article class="card"><div class="muted tiny">Owner</div><div class="kpi" style="font-size: 1.1rem;" id="card-owner">${escapeHtml(card.owner)}</div></article>
        <article class="card"><div class="muted tiny">Project</div><div class="kpi" style="font-size: 1.1rem;" id="card-project-name">${escapeHtml(card.project)}</div></article>
        <article class="card"><div class="muted tiny">Last updated</div><div class="kpi" style="font-size: 1.1rem;" id="card-updated-at">${escapeHtml(card.updatedAt)}</div></article>
      </section>
      <section class="grid stats meta-grid">
        <article class="card"><div class="muted tiny">Assigned Coder</div><div id="card-assigned-coder" class="kpi" style="font-size: 1rem;">${escapeHtml(card.assignedCoder || 'Unknown')}</div></article>
        <article class="card"><div class="muted tiny">Start Time</div><div id="card-start-time" class="kpi" style="font-size: 1rem;">${escapeHtml(card.startTime || 'Unknown')}</div></article>
        <article class="card"><div class="muted tiny">Estimate</div><div id="card-estimate" class="kpi" style="font-size: 1rem;">${escapeHtml(card.estimate || 'Unknown')}</div></article>
        <article class="card"><div class="muted tiny">Completion Time</div><div id="card-completion-time" class="kpi" style="font-size: 1rem;">${escapeHtml(card.completionTime || 'Unknown')}</div></article>
      </section>
      <section class="grid detail-layout">
        <div class="stack">
          <article class="panel section-copy"><h2>Objective</h2><div id="card-objective">${paragraphize(card.objective)}</div></article>
          <article class="panel section-copy"><h2>Why it matters</h2><div id="card-why">${paragraphize(card.whyItMatters)}</div></article>
          <article class="panel"><h2>Scope</h2><pre id="card-scope">${escapeHtml(card.scope || 'Not available.')}</pre></article>
          <article class="panel"><h2>Out of scope</h2><pre id="card-out-of-scope">${escapeHtml(card.outOfScope || 'Not available.')}</pre></article>
          <article class="panel"><h2>Steps</h2><pre id="card-steps">${escapeHtml(card.steps || 'Not available.')}</pre></article>
        </div>
        <div class="stack">
          <article class="panel">
            <h2>Actions</h2>
            <p class="muted">Safe status controls ride the existing API write path.</p>
            <div class="button-row" id="card-status-actions"></div>
            <p class="muted tiny" id="card-status-help">Allowed next statuses are loaded from the API.</p>
            <p class="muted tiny" id="card-status-result"></p>
          </article>
          <article class="panel"><h2>Summary</h2><p id="card-summary">${escapeHtml(card.summary || 'No summary yet.')}</p></article>
          <article class="panel"><h2>Project Decisions</h2><div id="card-related-decisions"><p class="muted">Loading related decisions...</p></div></article>
          <article class="panel"><h2>Blockers</h2><pre id="card-blockers">${escapeHtml(card.blockers || 'None listed.')}</pre></article>
          <article class="panel"><h2>Artifacts</h2><div id="card-artifacts-rich">${escapeHtml(card.artifacts || 'None listed.')}</div></article>
          <article class="panel"><h2>Update log</h2><pre id="card-update-log">${escapeHtml(card.updateLog || 'No updates yet.')}</pre></article>
          <article class="panel"><h2>Source file</h2><pre id="card-file-path">${escapeHtml(card.filePath || 'Not available.')}</pre></article>
        </div>
      </section>
      <script id="card-detail-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const embedded = document.getElementById('card-detail-data');
          const initial = embedded ? JSON.parse(embedded.textContent) : null;
          const slug = ${JSON.stringify(card.slug)};
          const apiPath = '/api/cards/' + encodeURIComponent(slug);
          const titleEl = document.getElementById('card-title');
          const subtitleEl = document.getElementById('card-subtitle');
          const summaryEl = document.getElementById('card-summary');
          const statusEl = document.getElementById('card-status');
          const priorityEl = document.getElementById('card-priority');
          const ownerEl = document.getElementById('card-owner');
          const projectEl = document.getElementById('card-project-name');
          const updatedEl = document.getElementById('card-updated-at');
          const objectiveEl = document.getElementById('card-objective');
          const whyEl = document.getElementById('card-why');
          const scopeEl = document.getElementById('card-scope');
          const outOfScopeEl = document.getElementById('card-out-of-scope');
          const stepsEl = document.getElementById('card-steps');
          const blockersEl = document.getElementById('card-blockers');
          const artifactsEl = document.getElementById('card-artifacts');
          const artifactsRichEl = document.getElementById('card-artifacts-rich');
          const updateLogEl = document.getElementById('card-update-log');
          const assignedCoderEl = document.getElementById('card-assigned-coder');

          const startTimeEl = document.getElementById('card-start-time');
          const estimateEl = document.getElementById('card-estimate');
          const completionTimeEl = document.getElementById('card-completion-time');
          const filePathEl = document.getElementById('card-file-path');
          const statusActionsEl = document.getElementById('card-status-actions');
          const statusHelpEl = document.getElementById('card-status-help');
          const statusResultEl = document.getElementById('card-status-result');
          const apiLinkEl = document.getElementById('card-api-link');

          function esc(value) {
            return String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          function prose(value, fallback) {
            const text = String(value || '').trim();
            if (!text) return '<p class="muted">' + esc(fallback) + '</p>';
            return text
              .split(/\n\s*\n/)
              .map((block) => '<p>' + esc(block).replace(/\n/g, '<br />') + '</p>')
              .join('');
          }

          function block(value, fallback) {
            const text = String(value || '').trim();
            return text || fallback;
          }

          function setBusy(isBusy) {
            Array.from(statusActionsEl.querySelectorAll('button')).forEach((button) => {
              button.disabled = isBusy;
            });
          }

          function renderActions(cardData) {
            const allowed = Array.isArray(cardData.allowedNextStatuses) ? cardData.allowedNextStatuses : [];
            statusActionsEl.innerHTML = allowed.length
              ? allowed.map((status) => '<button class="button" type="button" data-next-status="' + esc(status) + '">' + esc(status) + '</button>').join('')
              : '<span class="muted">No safe transitions available.</span>';
            statusHelpEl.textContent = allowed.length
              ? 'Allowed next statuses: ' + allowed.join(', ')
              : 'No safe status transitions available from the current state.';
            Array.from(statusActionsEl.querySelectorAll('button')).forEach((button) => {
              button.addEventListener('click', async () => {
                const nextStatus = button.getAttribute('data-next-status');
                if (!nextStatus) return;
                setBusy(true);
                statusResultEl.textContent = 'Updating status…';
                try {
                  const response = await fetch('/api/cards/' + encodeURIComponent(slug) + '/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      expectedCurrentStatus: cardData.status,
                      status: nextStatus
                    })
                  });
                  const result = await response.json();
                  if (!response.ok || !result.ok) throw new Error(result.error || 'Status update failed');
                  const refreshed = await loadCard();
                  if (!refreshed) throw new Error('Card refresh failed after status update');
                  applyCard(refreshed, 'Status updated to ' + refreshed.status + '.');
                } catch (error) {
                  statusResultEl.textContent = error.message;
                } finally {
                  setBusy(false);
                }
              });
            });
          }

          function renderArtifacts(text) {
            if (!text || text.trim() === 'None listed.' || text.trim() === 'None yet.') return '<p class="muted">' + esc(text) + '</p>';
            
            // This is a naive parser but effective for many markdown artifact lists.
            // It looks for things that look like paths or filenames.
            const lines = text.split('\\n');
            let html = '<ul style="padding-left: 1.5rem; margin: 0;">';
            lines.forEach(line => {
              const cleanLine = line.replace(/^[-*]\\s+/, '').trim();
              if (!cleanLine) return;
              
              // If it's a file path in the project
              if (cleanLine.includes('/') || cleanLine.includes('.')) {
                // Try to find if it has a git commit associated
                // In a real app we'd query the server for provenance.
                // Here we'll generate a dummy link to the repo as proof of concept
                const repoUrl = 'https://github.com/adamgoldband/mb-kanban-dashboard';
                html += '<li>' + esc(line) + ' <a href="' + repoUrl + '/search?q=' + encodeURIComponent(cleanLine) + '" class="artifact-link" target="_blank">View History</a></li>';
              } else {
                html += '<li>' + esc(line) + '</li>';
              }
            });
            html += '</ul>';
            return html;
          }

          function applyCard(cardData, flashMessage) {
            titleEl.textContent = cardData.id + ' — ' + cardData.title;

            subtitleEl.textContent = 'Card detail screen over the repo-backed card API.';
            summaryEl.textContent = cardData.summary || 'No summary yet.';
            statusEl.textContent = cardData.status || 'Unknown';
            priorityEl.textContent = cardData.priority || 'Unknown';
            ownerEl.textContent = cardData.owner || 'Unknown';
            projectEl.textContent = cardData.project || 'Unknown';
            assignedCoderEl.textContent = cardData.assignedCoder || 'Unknown';
            startTimeEl.textContent = cardData.startTime || 'Unknown';
            estimateEl.textContent = cardData.estimate || 'Unknown';
            completionTimeEl.textContent = cardData.completionTime || 'Unknown';
            updatedEl.textContent = cardData.updatedAt || 'Unknown';
            objectiveEl.innerHTML = prose(cardData.objective, 'Not available.');
            whyEl.innerHTML = prose(cardData.whyItMatters, 'Not available.');
            scopeEl.textContent = block(cardData.scope, 'Not available.');
            outOfScopeEl.textContent = block(cardData.outOfScope, 'Not available.');
            stepsEl.textContent = block(cardData.steps, 'Not available.');
            blockersEl.textContent = block(cardData.blockers, 'None listed.');
            artifactsRichEl.innerHTML = renderArtifacts(cardData.artifacts);
            updateLogEl.textContent = block(cardData.updateLog, 'No updates yet.');
            filePathEl.textContent = block(cardData.filePath, 'Not available.');
            apiLinkEl.setAttribute('href', apiPath);
            renderActions(cardData);
            statusResultEl.textContent = flashMessage || '';
            const relatedDecisionsEl = document.getElementById('card-related-decisions');
            if (relatedDecisionsEl) {
              fetch('/api/decisions').then(res => res.json()).then(data => {
                const projectDecisions = (data.items || []).filter(d => d.project === cardData.project);
                if (projectDecisions.length) {
                  relatedDecisionsEl.innerHTML = '<ul style="padding-left: 1.5rem; margin: 0;">' + projectDecisions.map(d => '<li><a href="/decisions?selected=' + encodeURIComponent(d.slug) + '">' + esc(d.id) + ' — ' + esc(d.title) + '</a></li>').join('') + '</ul>';
                } else {
                  relatedDecisionsEl.innerHTML = '<p class="muted">No decisions recorded for this project.</p>';
                }
              }).catch(() => {
                relatedDecisionsEl.innerHTML = '<p class="muted">Failed to load decisions.</p>';
              });
            }
          }

          async function loadCard() {
            try {
              const response = await fetch(apiPath);
              if (!response.ok) throw new Error('card api failed');
              return await response.json();
            } catch {
              return initial ? initial.card : null;
            }
          }

          loadCard().then((cardData) => {
            if (cardData) applyCard(cardData);
          });
        })();
      </script>`
  });
}

function renderDecisions(model) {
  const statusOptions = [...new Set(model.decisions.map((decision) => decision.status).filter(Boolean))].sort();
  const ownerOptions = [...new Set(model.decisions.map((decision) => decision.owner).filter(Boolean))].sort();
  const projectOptions = [...new Set(model.decisions.map((decision) => decision.project).filter(Boolean))].sort();
  const initialSelected = model.decisions[0]?.slug ?? '';

  const initialData = JSON.stringify({
    generatedAt: model.generatedAt,
    count: model.decisions.length,
    items: model.decisions.map(decisionApiShape)
  }).replace(/</g, '\\u003c');

  const initialDecisionList = [...new Set(model.decisions.map((decision) => decision.project).filter(Boolean))]
    .sort()
    .map((projectName) => renderDecisionSwimlane(projectName, model.decisions.filter((decision) => decision.project === projectName), initialSelected))
    .join('') || '<p class="muted">No decisions recorded yet.</p>';

  const decisionStarterTemplates = [
    {
      label: 'Approve an approach',
      id: 'DEC-',
      title: 'Approve approach for current workstream',
      status: 'Accepted',
      context: 'We need a clear call so work can proceed without more wobbling.',
      decision: 'Approve the current proposed approach and move execution forward now.',
      consequences: '- delivery can proceed immediately\n- revisit only if new evidence changes the cost/risk profile',
      followUpTasks: '- [ ] communicate the decision to affected cards\n- [ ] update follow-up work if scope changed'
    },
    {
      label: 'Reject an option',
      id: 'DEC-',
      title: 'Reject option that adds avoidable complexity',
      status: 'Rejected',
      context: 'Multiple options were considered and one is not worth the complexity/cost right now.',
      decision: 'Reject the higher-complexity option for now and keep the simpler path.',
      consequences: '- lower implementation risk now\n- may revisit later if requirements change',
      followUpTasks: '- [ ] document why the rejected option was not chosen\n- [ ] create follow-up card only if revisit becomes necessary'
    },
    {
      label: 'Record a tradeoff',
      id: 'DEC-',
      title: 'Record tradeoff for current implementation',
      status: 'Proposed',
      context: 'We need to explicitly capture a tradeoff so it does not disappear into chat history.',
      decision: 'Accept the near-term tradeoff in exchange for restoring momentum and reducing uncertainty.',
      consequences: '- captures the compromise clearly\n- gives future work a stable reference point',
      followUpTasks: '- [ ] add validation step\n- [ ] create cleanup follow-up if needed'
    }
  ];

  return shell({
    title: 'Decisions',
    currentPath: '/decisions',
    body: `
      <style>
        .drawer {
          position: fixed;
          top: 0;
          right: -420px;
          width: 420px;
          height: 100vh;
          background: #0e1427;
          border-left: 1px solid #26304a;
          transition: right 0.3s ease;
          z-index: 1000;
          padding: 24px;
          overflow-y: auto;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }
        .drawer.open { right: 0; }
        .drawer-handle {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: #4f8cff;
          color: white;
          padding: 20px 8px;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-weight: bold;
          z-index: 1001;
          user-select: none;
        }
        .swimlane { margin-bottom: 32px; }
        .swimlane-header {
          background: #121a2b;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border: 1px solid #26304a;
        }
        .swimlane-title { font-size: 1.25rem; font-weight: 700; }
      </style>

      <section class="hero">
        <div>
          <h1>Decisions</h1>
          <p>Project-grouped decisions with drawer-based creation and drill-in.</p>
        </div>
        <div class="muted" id="decisions-generated-at">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>

      <div class="drawer-handle" id="drawer-toggle">CREATE NEW DECISION</div>
      <aside class="drawer" id="create-decision-drawer">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2>Create new decision</h2>
          <button class="button" id="drawer-close" style="padding: 4px 10px;">✕</button>
        </div>
        <form id="create-decision-form" class="stack">
          <label class="stack"><span class="muted">Decision ID</span><input name="id" type="text" placeholder="DEC-004" required /></label>
          <label class="stack"><span class="muted">Title</span><input name="title" type="text" placeholder="Decision title" required /></label>
          <label class="stack"><span class="muted">Project</span><input name="project" type="text" placeholder="Motherbrain" value="Motherbrain" required /></label>
          <label class="stack"><span class="muted">Owner</span><input name="owner" type="text" placeholder="Coder-5" required /></label>
          <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
            <label class="stack"><span class="muted">Status</span><input name="status" type="text" value="Proposed" /></label>
            <label class="stack"><span class="muted">Date</span><input name="date" type="date" value="${escapeHtml(new Date().toISOString().slice(0, 10))}" /></label>
          </div>
          <label class="stack"><span class="muted">Context</span><textarea name="context" placeholder="Describe the problem." required></textarea></label>
          <label class="stack"><span class="muted">Decision</span><textarea name="decision" placeholder="State the decision." required></textarea></label>
          <div class="button-row">
            <button class="button" id="create-decision-submit" type="submit">Create decision</button>
          </div>
          <p class="muted tiny" id="create-decision-result"></p>
        </form>
      </aside>

      <section class="grid stats" id="decisions-summary">
        <article class="card"><div class="muted">Visible decisions</div><div class="kpi" data-summary="visible">${model.decisions.length}</div></article>
        <article class="card"><div class="muted">Proposed</div><div class="kpi" data-summary="proposed">${model.decisions.filter((decision) => decision.status === 'Proposed').length}</div></article>
        <article class="card"><div class="muted">Owners</div><div class="kpi" data-summary="owners">${ownerOptions.length}</div></article>
        <article class="card"><div class="muted">Follow-ups</div><div class="kpi" data-summary="followups">${model.decisions.reduce((sum, decision) => sum + String(decision.followUpTasks || '').split('\n').filter(Boolean).length, 0)}</div></article>
      </section>
      <section class="panel">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap;">
          <div>
            <h2>Make a decision now</h2>
            <p class="muted">Not just a dead markdown form. Pick a starter, fill the gaps, hit record.</p>
          </div>
          <div class="chip" style="margin-right:0;">Action-triggered</div>
        </div>
        <div class="button-row" style="margin-top:12px;">
          ${decisionStarterTemplates.map((template, index) => `<button class="button" type="button" data-decision-starter="${index}">${escapeHtml(template.label)}</button>`).join('')}
          <button class="button" type="button" id="decision-new-blank">Blank decision</button>
        </div>
        <p class="muted tiny" id="decision-starter-result">Choose a starter to open the drawer with a prefilled decision record.</p>
      </section>
      <section class="panel">
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end;">
          <label class="stack">
            <span class="muted">Search</span>
            <input id="decisions-search" type="search" placeholder="ID, title, context" />
          </label>
          <label class="stack">
            <span class="muted">Project</span>
            <select id="decisions-project-filter">
              <option value="">All projects</option>
              ${projectOptions.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Status</span>
            <select id="decisions-status">
              <option value="">All statuses</option>
              ${statusOptions.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Owner</span>
            <select id="decisions-owner">
              <option value="">All owners</option>
              ${ownerOptions.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join('')}
            </select>
          </label>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
          <button id="decisions-clear" type="button" class="button">Clear filters</button>
          <div class="muted" id="decisions-filter-state">Showing all decisions.</div>
        </div>
      </section>
      <section class="grid" style="grid-template-columns: minmax(320px, 480px) minmax(0, 1fr); align-items: start;">
        <div id="decisions-swimlanes">${initialDecisionList}</div>
        <article class="panel" id="decision-detail-panel">
          <h2>Decision detail</h2>
          <div class="muted">Select a decision to inspect its full record.</div>
        </article>
      </section>
      <script id="decisions-data" type="application/json">${initialData}</script>
      <script id="decision-starters" type="application/json">${JSON.stringify(decisionStarterTemplates).replace(/</g, '\\u003c')}</script>
      <script>
        (() => {
          const embedded = document.getElementById('decisions-data');
          const initial = embedded ? JSON.parse(embedded.textContent) : null;
          const starterEmbedded = document.getElementById('decision-starters');
          const starterTemplates = starterEmbedded ? JSON.parse(starterEmbedded.textContent) : [];
          const swimlanesEl = document.getElementById('decisions-swimlanes');
          const detailEl = document.getElementById('decision-detail-panel');
          const searchEl = document.getElementById('decisions-search');
          const statusEl = document.getElementById('decisions-status');
          const ownerEl = document.getElementById('decisions-owner');
          const projectFilterEl = document.getElementById('decisions-project-filter');
          const clearEl = document.getElementById('decisions-clear');
          const stateEl = document.getElementById('decisions-filter-state');
          const generatedEl = document.getElementById('decisions-generated-at');
          const createFormEl = document.getElementById('create-decision-form');
          const createSubmitEl = document.getElementById('create-decision-submit');
          const createResultEl = document.getElementById('create-decision-result');
          const starterResultEl = document.getElementById('decision-starter-result');
          const drawerEl = document.getElementById('create-decision-drawer');
          const drawerToggleEl = document.getElementById('drawer-toggle');
          const drawerCloseEl = document.getElementById('drawer-close');
          const blankDecisionEl = document.getElementById('decision-new-blank');

          const summaryEls = {
            visible: document.querySelector('[data-summary="visible"]'),
            proposed: document.querySelector('[data-summary="proposed"]'),
            owners: document.querySelector('[data-summary="owners"]'),
            followups: document.querySelector('[data-summary="followups"]')
          };
          let payload = initial;
          let selectedSlug = new URL(window.location.href).searchParams.get('selected') || ${JSON.stringify(initialSelected)};

          const normalized = (value) => String(value || '').toLowerCase();

          function esc(value) {
            return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          }

          function paragraphizeClient(text, fallback = 'Not available.') {
            const value = String(text || '').trim();
            if (!value) return '<p class="muted">' + esc(fallback) + '</p>';
            return value.split(/\\n\\s*\\n/).map((block) => '<p>' + esc(block).replace(/\\n/g, '<br />') + '</p>').join('');
          }

          function extractOptions(decision) {
            const raw = String(decision?.options || '');
            const titled = Array.from(raw.matchAll(/^###\\s+(.+)$/gm)).map((match) => match[1].trim()).filter(Boolean);
            if (titled.length) return titled;
            return raw.split('\\n').map((line) => line.match(/^\\s*-\\s+(.*)$/)).filter(Boolean).map((match) => match[1].trim()).filter(Boolean);
          }

          function responseHistoryMarkup(decision) {
            const history = Array.isArray(decision.responseHistory) ? decision.responseHistory : [];
            if (!history.length) return '<p class="muted">No responses recorded yet.</p>';
            return history.slice().reverse().map((entry) => '<article class="card">'
              + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><strong>' + esc(entry.action) + '</strong><span class="tiny muted">' + esc(entry.createdAt) + ' · ' + esc(entry.actor || 'operator') + '</span></div>'
              + (entry.option ? '<div class="tiny" style="margin-top:8px;">Option: ' + esc(entry.option) + '</div>' : '')
              + (entry.note ? '<p style="margin:8px 0 0;">' + esc(entry.note) + '</p>' : '<p class="muted" style="margin:8px 0 0;">No note recorded.</p>')
              + '</article>').join('');
          }

          function actionPanelMarkup(decision) {
            const options = extractOptions(decision);
            const latest = decision.latestResponse || null;
            return '<section class="panel" style="margin-top:16px;">'
              + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">'
              + '<div><h3>Respond now</h3><p class="muted">Approve/reject here, add notes, save, refresh, and keep the trail visible.</p></div>'
              + (latest ? '<div class="chip" style="margin-right:0;">Latest: ' + esc(latest.action) + (latest.option ? ' · ' + esc(latest.option) : '') + '</div>' : '<div class="chip" style="margin-right:0;">No response yet</div>')
              + '</div>'
              + '<form id="decision-response-form" class="stack" style="margin-top:12px;">'
              + '<div class="button-row"><button class="button" type="button" data-decision-action="approve">Approve</button><button class="button" type="button" data-decision-action="reject">Reject</button></div>'
              + '<input type="hidden" name="action" value="' + esc(latest?.action || '') + '" />'
              + '<label class="stack"><span class="muted">Operator</span><input name="actor" type="text" value="Adam" /></label>'
              + (options.length ? '<label class="stack"><span class="muted">Option selected</span><select name="option"><option value="">No specific option</option>' + options.map((option) => '<option value="' + esc(option) + '"' + (latest?.option === option ? ' selected' : '') + '>' + esc(option) + '</option>').join('') + '</select></label>' : '<input type="hidden" name="option" value="" />')
              + '<label class="stack"><span class="muted">Notes</span><textarea name="note" placeholder="Why this call, constraints, follow-up, operator context...">' + esc(latest?.note || '') + '</textarea></label>'
              + '<div class="button-row" style="align-items:center;"><button class="button" id="decision-response-submit" type="submit">Save response</button><span class="muted tiny" id="decision-response-result">Choose approve/reject, add note or option, then save.</span></div>'
              + '</form>'
              + '<div class="stack" style="margin-top:16px;"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><h3 style="margin:0;">Response history</h3><span class="muted tiny">' + ((decision.responseHistory || []).length) + ' entr' + (((decision.responseHistory || []).length) === 1 ? 'y' : 'ies') + '</span></div><div id="decision-response-history">' + responseHistoryMarkup(decision) + '</div></div>'
              + '</section>';
          }

          function matches(decision) {
            const search = normalized(searchEl.value).trim();
            const status = statusEl.value;
            const owner = ownerEl.value;
            const project = projectFilterEl.value;
            const haystack = [decision.id, decision.title, decision.context, decision.decision, decision.owner, decision.project].map(normalized).join(' ');
            return (!search || haystack.includes(search))
              && (!status || decision.status === status)
              && (!owner || decision.owner === owner)
              && (!project || decision.project === project);
          }

          function listMarkup(decision, active) {
            const activeStyle = active ? 'background: #16203a; border: 1px solid #4f8cff;' : '';
            return '<article class="card" data-slug="' + esc(decision.slug) + '" style="cursor: pointer; margin-bottom: 12px; ' + activeStyle + '">'
              + '<div style="display:flex; justify-content:space-between; align-items:center;">'
              + '<span class="chip">' + esc(decision.id) + '</span>'
              + '<span class="chip" style="margin-right:0;">' + esc(decision.status) + '</span>'
              + '</div>'
              + '<h3 style="margin-top: 10px; font-size: 1rem;">' + esc(decision.title) + '</h3>'
              + '<div class="tiny muted">' + esc(decision.date) + ' · ' + esc(decision.owner) + '</div>'
              + '</article>';
          }

          function swimlaneMarkup(projectName, decisions) {
            return '<div class="swimlane">'
              + '<div class="swimlane-header">'
              + '<span class="swimlane-title">' + esc(projectName) + '</span>'
              + '<a href="/decisions/projects/' + encodeURIComponent(projectName) + '" class="button">View Project</a>'
              + '</div>'
              + decisions.map(d => listMarkup(d, d.slug === selectedSlug)).join('')
              + '</div>';
          }

          function detailMarkup(decision) {
            if (!decision) return '<h2>Decision detail</h2><div class="muted">No decision selected.</div>';
            return '<div style="display: flex; justify-content: space-between; gap: 12px; align-items: start; flex-wrap: wrap;">'
              + '<div><h2>' + esc(decision.id) + ' — ' + esc(decision.title) + '</h2><div class="muted">' + esc(decision.status) + ' · ' + esc(decision.date) + ' · ' + esc(decision.owner) + ' · Project: ' + esc(decision.project) + '</div></div>'
              + '<a href="/decisions/' + encodeURIComponent(decision.slug) + '" class="button">Dedicated route</a>'
              + '</div>'
              + '<div class="button-row" style="margin-top: 12px;">'
              + '<button class="button" type="button" data-record-followup="' + esc(decision.slug) + '">Record follow-up decision</button>'
              + '<button class="button" type="button" data-duplicate-decision="' + esc(decision.slug) + '">Use as template</button>'
              + '</div>'
              + renderDecisionActionComposerClient(decision)
              + '<div class="grid list" style="margin-top: 16px;">'
              + '<section class="panel"><h3>Context</h3>' + paragraphizeClient(decision.context) + '</section>'
              + '<section class="panel"><h3>Decision</h3>' + paragraphizeClient(decision.decision) + '</section>'
              + '<section class="panel"><h3>Options considered</h3><pre>' + esc(decision.options || 'Not available.') + '</pre></section>'
              + '<section class="panel"><h3>Consequences</h3><pre>' + esc(decision.consequences || 'Not available.') + '</pre></section>'
              + '<section class="panel"><h3>Follow-up tasks</h3><pre>' + esc(decision.followUpTasks || 'None listed.') + '</pre></section>'
              + '</div>'
              + actionPanelMarkup(decision);
          }

          function renderDecisionActionComposerClient(decision) {
            const decisionType = decision.decisionType || { label: 'Nuanced', options: [], allowsBinary: false, allowsOptionSelection: false };
            const optionsList = Array.isArray(decisionType.options) ? decisionType.options : [];
            const responses = Array.isArray(decision.responses) ? decision.responses : [];
            const responseMarkup = responses.length
              ? '<div class="stack" style="margin-top: 12px;">' + responses.slice().reverse().map((response) => '<article class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><strong>' + esc(response.outcome || response.selectedOption || 'Nuanced response') + '</strong><span class="tiny muted">' + esc(response.createdAt || '') + '</span></div><div class="tiny muted">' + esc(response.responder || 'MB Operator') + (response.selectedOption ? ' · Option: ' + esc(response.selectedOption) : '') + '</div>' + (response.notes ? '<p style="margin:8px 0 0;">' + esc(response.notes) + '</p>' : '<p class="muted tiny" style="margin:8px 0 0;">No notes added.</p>') + '</article>').join('') + '</div>'
              : '<p class="muted">No responses recorded yet. Use the controls above.</p>';
            return '<section class="panel">'
              + '<div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap;">'
              + '<div><h3>Respond here</h3><p class="muted">Type: ' + esc(decisionType.label || 'Nuanced') + '. Notes are always available; controls only expose what this decision actually needs.</p></div>'
              + '<div class="chip" style="margin-right:0;">Action required</div>'
              + '</div>'
              + '<form data-decision-response-form="' + esc(decision.slug) + '" class="stack" style="margin-top:12px;">'
              + (decisionType.allowsBinary
                  ? '<div class="button-row"><button class="button" type="button" data-decision-outcome="approve">Yes / Approve</button><button class="button" type="button" data-decision-outcome="reject">No / Reject</button><button class="button" type="button" data-decision-outcome="note">Notes only</button></div>'
                  : decisionType.allowsOptionSelection
                    ? '<div class="button-row"><span class="chip" style="margin-right:0;">Choose an option below, then save</span><button class="button" type="button" data-decision-outcome="note">Notes only</button></div>'
                    : '<div class="button-row"><span class="chip" style="margin-right:0;">Nuanced response</span><button class="button" type="button" data-decision-outcome="note">Notes only</button></div>')
              + '<input type="hidden" name="outcome" value="" />'
              + (decisionType.allowsOptionSelection
                  ? '<label class="stack"><span class="muted">Choose one of the recorded options</span><select name="selectedOption"><option value="">No option selected</option>' + optionsList.map((option) => '<option value="' + esc(option) + '">' + esc(option) + '</option>').join('') + '</select></label>'
                  : '')
              + '<label class="stack"><span class="muted">Notes / nuance (always available)</span><textarea name="notes" placeholder="Why this call makes sense, caveats, partial approval, follow-up asks, etc."></textarea></label>'
              + '<label class="stack"><span class="muted">Responder</span><input name="responder" type="text" value="MB Operator" /></label>'
              + '<div class="button-row"><button class="button" type="submit">Save response</button></div>'
              + '<p class="muted tiny" data-decision-response-result>Saved responses write to docs/decisions/responses/' + esc(decision.id) + '.responses.json.</p>'
              + '</form>'
              + '<div style="margin-top:16px;"><h3 style="margin-bottom:8px;">Recorded responses</h3>' + responseMarkup + '</div>'
              + '</section>';
          }

          async function submitDecisionResponse(decision, form) {
            const resultEl = form.querySelector('[data-decision-response-result]');
            const buttons = Array.from(form.querySelectorAll('button'));
            buttons.forEach((button) => { button.disabled = true; });
            if (resultEl) resultEl.textContent = 'Saving response…';
            const formData = new FormData(form);
            const body = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
            try {
              const response = await fetch('/api/decisions/' + encodeURIComponent(decision.slug) + '/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              const result = await response.json();
              if (!response.ok || !result.ok) throw new Error(result.error || 'Failed to save response');
              const refreshed = await (await fetch('/api/decisions')).json();
              payload = refreshed;
              selectedSlug = decision.slug;
              render();
              detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (error) {
              if (resultEl) resultEl.textContent = error.message;
            } finally {
              buttons.forEach((button) => { button.disabled = false; });
            }
          }

          function openDrawerWith(data, message) {
            if (!createFormEl) return;
            const fields = ['id', 'title', 'project', 'owner', 'status', 'date', 'context', 'decision'];
            fields.forEach((name) => {
              if (!(name in data)) return;
              const input = createFormEl.elements.namedItem(name);
              if (input) input.value = data[name];
            });
            drawerEl.classList.add('open');
            if (starterResultEl) starterResultEl.textContent = message || 'Decision draft loaded.';
          }

          function nextDecisionId() {
            const ids = (payload?.items || []).map((item) => {
              const match = String(item.id || '').match(/^DEC-(\d+)$/i);
              return match ? Number(match[1]) : null;
            }).filter((value) => Number.isFinite(value));
            const next = (ids.length ? Math.max(...ids) : 0) + 1;
            return 'DEC-' + String(next).padStart(3, '0');
          }

          function starterData(template) {
            const today = new Date().toISOString().slice(0, 10);
            return {
              id: nextDecisionId(),
              title: template.title,
              project: 'Motherbrain',
              owner: 'MB-Sam',
              status: template.status,
              date: today,
              context: template.context,
              decision: template.decision
            };
          }

          async function submitCreateDecision(event) {
            event.preventDefault();
            createSubmitEl.disabled = true;
            createResultEl.textContent = 'Creating decision…';
            const formData = new FormData(createFormEl);
            const data = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));

            try {
              const response = await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              const result = await response.json();
              if (!response.ok || !result.ok) throw new Error(result.error || 'Failed');

              const refreshed = await (await fetch('/api/decisions')).json();
              payload = refreshed;
              selectedSlug = result.slug;
              render();
              createFormEl.reset();
              createResultEl.innerHTML = 'Recorded <a href="/decisions/' + encodeURIComponent(result.slug) + '">' + result.decisionId + '</a> — decision captured.';
              detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => drawerEl.classList.remove('open'), 1500);
            } catch (err) {
              createResultEl.textContent = err.message;
            } finally {
              createSubmitEl.disabled = false;
            }
          }

          async function submitDecisionResponse(event) {
            event.preventDefault();
            const selected = (payload?.items || []).find((item) => item.slug === selectedSlug);
            const form = event.currentTarget;
            const submit = document.getElementById('decision-response-submit');
            const result = document.getElementById('decision-response-result');
            if (!selected) {
              if (result) result.textContent = 'No decision selected.';
              return;
            }
            submit.disabled = true;
            result.textContent = 'Saving response…';
            try {
              const response = await fetch('/api/decisions/' + encodeURIComponent(selected.slug) + '/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
              });
              const body = await response.json();
              if (!response.ok || !body.ok) throw new Error(body.error || 'Failed to save response');
              const refreshed = await (await fetch('/api/decisions')).json();
              payload = refreshed;
              render();
              const resultAfter = document.getElementById('decision-response-result');
              if (resultAfter) resultAfter.textContent = 'Response saved. Refresh-safe history updated.';
            } catch (error) {
              result.textContent = error.message;
            } finally {
              submit.disabled = false;
            }
          }

          function render() {
            const filtered = (payload?.items || []).filter(matches);
            const selected = filtered.find((d) => d.slug === selectedSlug) || filtered[0] || null;
            if (selected) selectedSlug = selected.slug;

            const projects = [...new Set(filtered.map(d => d.project))].sort();
            swimlanesEl.innerHTML = projects.length 
              ? projects.map(p => swimlaneMarkup(p, filtered.filter(d => d.project === p))).join('')
              : '<p class="muted">No decisions match filters.</p>';

            detailEl.innerHTML = detailMarkup(selected);
            summaryEls.visible.textContent = String(filtered.length);
            summaryEls.proposed.textContent = String(filtered.filter((d) => d.status === 'Proposed').length);
            summaryEls.owners.textContent = String(new Set(filtered.map((d) => d.owner).filter(Boolean)).size);
            summaryEls.followups.textContent = String(filtered.reduce((sum, d) => sum + String(d.followUpTasks || '').split('\\n').filter(Boolean).length, 0));

            const activeFilters = [searchEl.value && 'search', statusEl.value && 'status', ownerEl.value && 'owner', projectFilterEl.value && 'project'].filter(Boolean);
            stateEl.textContent = activeFilters.length ? 'Showing ' + filtered.length + ' filtered decision(s).' : 'Showing all decisions.';
            
            const nextUrl = new URL(window.location.href);
            if (selectedSlug) nextUrl.searchParams.set('selected', selectedSlug);
            else nextUrl.searchParams.delete('selected');
            window.history.replaceState({}, '', nextUrl);
          }

          drawerToggleEl.addEventListener('click', () => drawerEl.classList.toggle('open'));
          drawerCloseEl.addEventListener('click', () => drawerEl.classList.remove('open'));

          function wire() {
            [searchEl, statusEl, ownerEl, projectFilterEl].forEach((el) => el.addEventListener('input', render));
            createFormEl.addEventListener('submit', submitCreateDecision);
            clearEl.addEventListener('click', () => {
              searchEl.value = ''; statusEl.value = ''; ownerEl.value = ''; projectFilterEl.value = '';
              render();
            });
            Array.from(document.querySelectorAll('[data-decision-starter]')).forEach((button) => {
              button.addEventListener('click', () => {
                const index = Number(button.getAttribute('data-decision-starter'));
                const template = starterTemplates[index];
                if (!template) return;
                openDrawerWith(starterData(template), 'Starter loaded: ' + template.label + '. Finish it and hit record.');
              });
            });
            if (blankDecisionEl) {
              blankDecisionEl.addEventListener('click', () => {
                openDrawerWith({
                  id: nextDecisionId(),
                  title: '',
                  project: 'Motherbrain',
                  owner: 'MB-Sam',
                  status: 'Proposed',
                  date: new Date().toISOString().slice(0, 10),
                  context: '',
                  decision: ''
                }, 'Blank decision draft opened.');
              });
            }
            swimlanesEl.addEventListener('click', (e) => {
              const article = e.target.closest('[data-slug]');
              if (article) { selectedSlug = article.getAttribute('data-slug'); render(); }
            });
            detailEl.addEventListener('click', (event) => {
              const outcomeButton = event.target.closest('[data-decision-outcome]');
              if (outcomeButton) {
                const form = outcomeButton.closest('form');
                const outcomeInput = form?.elements?.namedItem('outcome');
                if (outcomeInput) outcomeInput.value = outcomeButton.getAttribute('data-decision-outcome') || '';
              }

              const followup = event.target.closest('[data-record-followup]');
              const duplicate = event.target.closest('[data-duplicate-decision]');
              const sourceSlug = followup?.getAttribute('data-record-followup') || duplicate?.getAttribute('data-duplicate-decision');
              if (!sourceSlug) return;
              const source = (payload?.items || []).find((item) => item.slug === sourceSlug);
              if (!source) return;
              openDrawerWith({
                id: nextDecisionId(),
                title: followup ? 'Follow-up: ' + source.title : source.title,
                project: source.project || 'Motherbrain',
                owner: source.owner || 'MB-Sam',
                status: followup ? 'Proposed' : source.status,
                date: new Date().toISOString().slice(0, 10),
                context: source.context || '',
                decision: followup ? 'Follow-up to ' + source.id + ': ' : source.decision || ''
              }, followup ? 'Follow-up decision draft loaded.' : 'Template copied from ' + source.id + '.');
            });
            detailEl.addEventListener('submit', (event) => {
              const form = event.target.closest('[data-decision-response-form]');
              if (!form) return;
              event.preventDefault();
              const decision = (payload?.items || []).find((item) => item.slug === selectedSlug);
              if (!decision) return;
              submitDecisionResponse(decision, form);
            });
            render();
          }

          wire();
        })();
      </script>`
  });
}

function renderBoardSwimlane(projectName, cardsByStatus, statusOrder) {
  const projectCards = Object.values(cardsByStatus).flat();
  if (!projectCards.length) return '';
  const effectiveStatusOrder = statusOrder.filter((status) => status !== 'Archive');
  return `<div class="swimlane">
    <div class="swimlane-header">
      <span class="swimlane-title">${escapeHtml(projectName)}</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <span class="chip">${projectCards.length} card(s)</span>
        <a href="/projects/${encodeURIComponent(projectName)}" class="button">View Project</a>
      </div>
    </div>
    <div class="board-row">
      ${effectiveStatusOrder.map((status) => {
        const cards = cardsByStatus[status] || [];
        return `<div class="board-col">
          <div class="status-badge">${escapeHtml(status)} (${cards.length})</div>
          ${cards.map((card) => `<article class="card" style="padding: 12px; margin-bottom: 0; flex: 0 0 auto;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; gap: 8px;">
              <span class="chip" style="margin-right:4px; font-size:0.7rem;">${escapeHtml(card.id)}</span>
              <span class="chip" style="margin-right:0; font-size:0.7rem;">${escapeHtml(card.priority || 'Unknown')}</span>
            </div>
            <h3 style="font-size: 0.95rem; margin: 0 0 8px;"><a href="/cards/${encodeURIComponent(card.slug)}">${escapeHtml(card.title)}</a></h3>
            <div class="tiny muted">${escapeHtml(card.owner || 'Unknown')}</div>
          </article>`).join('')}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderDecisionSwimlane(projectName, decisions, selectedSlug) {
  if (!decisions.length) return '';
  return `<div class="swimlane">
    <div class="swimlane-header">
      <span class="swimlane-title">${escapeHtml(projectName)}</span>
      <a href="/decisions/projects/${encodeURIComponent(projectName)}" class="button">View Project</a>
    </div>
    ${decisions.map((decision) => `<article class="card" data-slug="${escapeHtml(decision.slug)}" style="cursor: pointer; margin-bottom: 12px;${decision.slug === selectedSlug ? ' background: #16203a; border: 1px solid #4f8cff;' : ''}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="chip">${escapeHtml(decision.id)}</span>
        <span class="chip" style="margin-right:0;">${escapeHtml(decision.status)}</span>
      </div>
      <h3 style="margin-top: 10px; font-size: 1rem;">${escapeHtml(decision.title)}</h3>
      <div class="tiny muted">${escapeHtml(decision.date)} · ${escapeHtml(decision.owner)}</div>
    </article>`).join('')}
  </div>`;
}

function renderDecisionActionComposer(decision, { compact = false } = {}) {
  const decisionType = classifyDecisionType(decision);
  const optionsList = Array.isArray(decisionType.options) ? decisionType.options : [];
  const responses = Array.isArray(decision.responses) ? decision.responses : [];
  const responseItems = responses.length
    ? `<div class="stack" style="margin-top: 12px;">${responses.slice().reverse().map((response) => `<article class="card-item"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><strong>${escapeHtml(response.outcome || response.selectedOption || 'Nuanced response')}</strong><span class="tiny muted">${escapeHtml(response.createdAt || '')}</span></div><div class="tiny muted">${escapeHtml(response.responder || 'MB Operator')}${response.selectedOption ? ` · Option: ${escapeHtml(response.selectedOption)}` : ''}</div>${response.notes ? `<p style="margin:8px 0 0;">${escapeHtml(response.notes)}</p>` : '<p class="muted tiny" style="margin:8px 0 0;">No notes added.</p>'}</article>`).join('')}</div>`
    : '<p class="muted">No responses recorded yet. Use the controls above.</p>';

  return `<section class="panel">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap;">
      <div>
        <h2>${compact ? 'Respond here' : 'Respond to this decision'}</h2>
        <p class="muted">Type: ${escapeHtml(decisionType.label)}. Notes are always available; controls only expose what this decision actually needs.</p>
      </div>
      <div class="chip" style="margin-right:0;">Durably saved</div>
    </div>
    <form data-decision-response-form="${escapeHtml(decision.slug)}" class="stack" style="margin-top:12px;">
      ${decisionType.allowsBinary ? `<div class="button-row">
        <button class="button" type="button" data-decision-outcome="approve">Yes / Approve</button>
        <button class="button" type="button" data-decision-outcome="reject">No / Reject</button>
        <button class="button" type="button" data-decision-outcome="note">Notes only</button>
      </div>` : decisionType.allowsOptionSelection ? `<div class="button-row"><span class="chip" style="margin-right:0;">Choose an option below, then save</span><button class="button" type="button" data-decision-outcome="note">Notes only</button></div>` : `<div class="button-row"><span class="chip" style="margin-right:0;">Nuanced response</span><button class="button" type="button" data-decision-outcome="note">Notes only</button></div>`}
      <input type="hidden" name="outcome" value="" />
      ${decisionType.allowsOptionSelection ? `<label class="stack"><span class="muted">Choose one of the recorded options</span><select name="selectedOption"><option value="">No option selected</option>${optionsList.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select></label>` : ''}
      <label class="stack"><span class="muted">Notes / nuance (always available)</span><textarea name="notes" placeholder="Why this call makes sense, caveats, partial approval, follow-up asks, etc."></textarea></label>
      <label class="stack"><span class="muted">Responder</span><input name="responder" type="text" value="MB Operator" /></label>
      <div class="button-row">
        <button class="button" type="submit">Save response</button>
      </div>
      <p class="muted tiny" data-decision-response-result>Saved responses write to <code>docs/decisions/responses/${escapeHtml(decision.id)}.responses.json</code>.</p>
    </form>
    <div style="margin-top:16px;">
      <h3 style="margin-bottom:8px;">Recorded responses</h3>
      ${responseItems}
    </div>
  </section>`;
}

function renderDecisionDetail(model, slug) {
  const decision = findBySlug(model.decisions, slug);
  if (!decision) return notFound('/decisions', 'Decision not found');
  const decisionData = JSON.stringify(decisionApiShape(decision)).replace(/</g, '\\u003c');
  return shell({
    title: decision.id,
    currentPath: '/decisions',
    body: `
      <section class="hero">
        <div><h1>${escapeHtml(decision.id)} — ${escapeHtml(decision.title)}</h1><p>${escapeHtml(decision.status)} · ${escapeHtml(decision.date)} · ${escapeHtml(decision.owner)}</p></div>
        <a href="/decisions">← Back to decisions</a>
      </section>
      ${renderDecisionActionComposer(decision)}
      <section class="grid list">
        <article class="panel"><h2>Context</h2>${paragraphize(decision.context)}</article>
        <article class="panel"><h2>Options considered</h2><pre>${escapeHtml(decision.options || 'Not available.')}</pre></article>
        <article class="panel"><h2>Decision</h2>${paragraphize(decision.decision)}</article>
        <article class="panel"><h2>Consequences</h2><pre>${escapeHtml(decision.consequences || 'Not available.')}</pre></article>
        <article class="panel"><h2>Follow-up tasks</h2><pre>${escapeHtml(decision.followUpTasks || 'None listed.')}</pre></article>
      </section>
      <script>
        (() => {
          const form = document.querySelector('[data-decision-response-form]');
          if (!form) return;
          const outcomeButtons = Array.from(form.querySelectorAll('[data-decision-outcome]'));
          const outcomeInput = form.elements.namedItem('outcome');
          const resultEl = form.querySelector('[data-decision-response-result]');

          outcomeButtons.forEach((button) => {
            button.addEventListener('click', () => {
              if (outcomeInput) outcomeInput.value = button.getAttribute('data-decision-outcome') || '';
            });
          });

          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const buttons = Array.from(form.querySelectorAll('button'));
            buttons.forEach((button) => { button.disabled = true; });
            if (resultEl) resultEl.textContent = 'Saving response…';
            const formData = new FormData(form);
            const body = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
            try {
              const response = await fetch('/api/decisions/${encodeURIComponent(decision.slug)}/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              const result = await response.json();
              if (!response.ok || !result.ok) throw new Error(result.error || 'Failed to save response');
              window.location.reload();
            } catch (error) {
              if (resultEl) resultEl.textContent = error.message;
              buttons.forEach((button) => { button.disabled = false; });
            }
          });
        })();
      </script>`
  });
}

function renderUpdates(model) {
  const authorOptions = [...new Set(model.updates.map((update) => update.author).filter(Boolean))].sort();
  const initialSelected = model.updates[0]?.slug ?? '';

  const initialData = JSON.stringify({
    generatedAt: model.generatedAt,
    count: model.updates.length,
    items: model.updates.map(updateApiShape)
  }).replace(/</g, '\u003c');

  return shell({
    title: 'Updates',
    currentPath: '/updates',
    body: `
      <section class="hero">
        <div>
          <h1>Updates timeline</h1>
          <p>API-backed reverse chronological activity from <code>docs/updates</code>.</p>
        </div>
        <div class="muted" id="updates-generated-at">Generated ${escapeHtml(model.generatedAt)}</div>
      </section>
      <section class="grid stats" id="updates-summary">
        <article class="card"><div class="muted">Visible updates</div><div class="kpi" data-summary="visible">${model.updates.length}</div></article>
        <article class="card"><div class="muted">Authors</div><div class="kpi" data-summary="authors">${authorOptions.length}</div></article>
        <article class="card"><div class="muted">With findings</div><div class="kpi" data-summary="findings">${model.updates.filter((update) => update.findings).length}</div></article>
        <article class="card"><div class="muted">Latest date</div><div class="kpi" style="font-size: 1.1rem;" data-summary="latest">${escapeHtml(model.updates[0]?.date || 'Unknown')}</div></article>
      </section>
      <section class="panel">
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end;">
          <label class="stack">
            <span class="muted">Search</span>
            <input id="updates-search" type="search" placeholder="Title, summary, findings, direction" style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #0d1322; color: #e8ecf3;" />
          </label>
          <label class="stack">
            <span class="muted">Author</span>
            <select id="updates-author" style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #0d1322; color: #e8ecf3;">
              <option value="">All authors</option>
              ${authorOptions.map((author) => `<option value="${escapeHtml(author)}">${escapeHtml(author)}</option>`).join('')}
            </select>
          </label>
          <label class="stack">
            <span class="muted">Section</span>
            <select id="updates-section" style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #0d1322; color: #e8ecf3;">
              <option value="">All section types</option>
              <option value="findings">Has findings</option>
              <option value="direction">Has direction</option>
              <option value="summary">Has summary</option>
            </select>
          </label>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
          <button id="updates-clear" type="button" style="padding: 10px 12px; border-radius: 10px; border: 1px solid #334466; background: #16203a; color: #e8ecf3; cursor: pointer;">Clear filters</button>
          <div class="muted" id="updates-filter-state">Showing all updates.</div>
        </div>
      </section>
      <section class="grid" style="grid-template-columns: minmax(320px, 440px) minmax(0, 1fr); align-items: start;">
        <article class="panel">
          <h2>Timeline entries</h2>
          <div class="stack" id="updates-list"></div>
        </article>
        <article class="panel" id="update-detail-panel">
          <h2>Update detail</h2>
          <div class="muted">Select an update to inspect its full record.</div>
        </article>
      </section>
      <script id="updates-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const embedded = document.getElementById('updates-data');
          const initial = embedded ? JSON.parse(embedded.textContent) : null;
          const listEl = document.getElementById('updates-list');
          const detailEl = document.getElementById('update-detail-panel');
          const searchEl = document.getElementById('updates-search');
          const authorEl = document.getElementById('updates-author');
          const sectionEl = document.getElementById('updates-section');
          const clearEl = document.getElementById('updates-clear');
          const stateEl = document.getElementById('updates-filter-state');
          const generatedEl = document.getElementById('updates-generated-at');
          const summaryEls = {
            visible: document.querySelector('[data-summary="visible"]'),
            authors: document.querySelector('[data-summary="authors"]'),
            findings: document.querySelector('[data-summary="findings"]'),
            latest: document.querySelector('[data-summary="latest"]')
          };
          let payload = initial;
          let selectedSlug = new URL(window.location.href).searchParams.get('selected') || ${JSON.stringify(initialSelected)};

          const normalized = (value) => String(value || '').toLowerCase();

          function esc(value) {
            return String(value || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          function paragraphizeClient(text, fallback = 'Not available.') {
            const value = String(text || '').trim();
            if (!value) return '<p class="muted">' + esc(fallback) + '</p>';
            return value
              .split(/\n\s*\n/)
              .map((block) => '<p>' + esc(block).replace(/\n/g, '<br />') + '</p>')
              .join('');
          }

          function hasRequestedSection(update) {
            if (!sectionEl.value) return true;
            if (sectionEl.value === 'findings') return Boolean(String(update.findings || '').trim());
            if (sectionEl.value === 'direction') return Boolean(String(update.direction || '').trim());
            if (sectionEl.value === 'summary') return Boolean(String(update.summary || '').trim());
            return true;
          }

          function matches(update) {
            const search = normalized(searchEl.value).trim();
            const author = authorEl.value;
            const haystack = [update.id, update.title, update.summary, update.findings, update.direction, update.author]
              .map(normalized)
              .join(' ');
            return (!search || haystack.includes(search))
              && (!author || update.author === author)
              && hasRequestedSection(update);
          }

          function listMarkup(update, active) {
            const activeStyle = active ? 'background: #16203a; border-radius: 10px; padding: 12px;' : '';
            const sectionCount = Array.isArray(update.sections) ? update.sections.length : 0;
            return '<article class="card-item" data-slug="' + esc(update.slug) + '" style="cursor: pointer; border-top: 1px solid #26304a; padding-top: 12px; ' + activeStyle + '">'
              + '<div><span class="chip">' + esc(update.date || 'Unknown') + '</span><span class="chip">' + esc(update.author || 'Unknown') + '</span></div>'
              + '<h3 style="margin-top: 10px;">' + esc(update.title) + '</h3>'
              + '<div class="muted">' + sectionCount + ' section(s) · ' + esc(update.id) + '</div>'
              + '<p>' + esc(String(update.summary || update.findings || update.direction || 'No summary available.').replace(/\s+/g, ' ').trim().slice(0, 180)) + '</p>'
              + '<div style="display: flex; gap: 10px; flex-wrap: wrap;">'
              + '<a href="/updates?selected=' + encodeURIComponent(update.slug) + '">Permalink</a>'
              + '<button type="button" data-select="' + esc(update.slug) + '" style="padding: 8px 10px; border-radius: 8px; border: 1px solid #334466; background: #0d1322; color: #e8ecf3; cursor: pointer;">Inspect here</button>'
              + '</div>'
              + '</article>';
          }

          function sectionMarkup(section) {
            const bulletItems = Array.isArray(section.bulletItems) ? section.bulletItems : [];
            return '<section class="panel">'
              + '<h3>' + esc(section.heading) + '</h3>'
              + (bulletItems.length
                  ? '<ul>' + bulletItems.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul>'
                  : paragraphizeClient(section.body, 'Not available.'))
              + '</section>';
          }

          function detailMarkup(update) {
            if (!update) {
              return '<h2>Update detail</h2><div class="muted">No updates match the current filters.</div>';
            }
            const sections = Array.isArray(update.sections) ? update.sections : [];
            const metadata = update.metadata && Object.keys(update.metadata).length
              ? '<pre>' + esc(JSON.stringify(update.metadata, null, 2)) + '</pre>'
              : '<p class="muted">No extra metadata.</p>';
            return '<div style="display: flex; justify-content: space-between; gap: 12px; align-items: start; flex-wrap: wrap;">'
              + '<div><h2>' + esc(update.title) + '</h2><div class="muted">' + esc(update.date || 'Unknown date') + ' · ' + esc(update.author || 'Unknown author') + ' · ' + esc(update.id) + '</div></div>'
              + '<div style="display: flex; gap: 10px; flex-wrap: wrap;">'
              + '<a href="/api/updates/' + encodeURIComponent(update.slug) + '">Open JSON</a>'
              + '<a href="file://' + encodeURI(update.filePath || '') + '">Open source markdown</a>'
              + '</div>'
              + '</div>'
              + '<div class="grid list" style="margin-top: 16px;">'
              + '<section class="panel"><h3>Summary</h3>' + paragraphizeClient(update.summary, 'No summary available.') + '</section>'
              + sections.map(sectionMarkup).join('')
              + '<section class="panel"><h3>Metadata</h3>' + metadata + '</section>'
              + '<section class="panel"><h3>Source file</h3><pre>' + esc(update.filePath || 'Not available.') + '</pre></section>'
              + '</div>';
          }

          function render() {
            const filtered = (payload?.items || []).filter(matches);
            const selected = filtered.find((update) => update.slug === selectedSlug) || filtered[0] || null;
            if (selected) selectedSlug = selected.slug;
            listEl.innerHTML = filtered.length
              ? filtered.map((update) => listMarkup(update, update.slug === selectedSlug)).join('')
              : '<p class="muted">No updates match the current filters.</p>';
            detailEl.innerHTML = detailMarkup(selected);
            summaryEls.visible.textContent = String(filtered.length);
            summaryEls.authors.textContent = String(new Set(filtered.map((update) => update.author).filter(Boolean)).size);
            summaryEls.findings.textContent = String(filtered.filter((update) => String(update.findings || '').trim()).length);
            summaryEls.latest.textContent = filtered[0]?.date || 'Unknown';
            const activeFilters = [searchEl.value && 'search', authorEl.value && 'author', sectionEl.value && 'section'].filter(Boolean);
            stateEl.textContent = activeFilters.length
              ? 'Showing ' + filtered.length + ' filtered update(s).'
              : 'Showing all updates.';
            const nextUrl = new URL(window.location.href);
            if (selectedSlug) nextUrl.searchParams.set('selected', selectedSlug);
            else nextUrl.searchParams.delete('selected');
            window.history.replaceState({}, '', nextUrl);
          }

          async function loadUpdates() {
            try {
              const response = await fetch('/api/updates');
              if (!response.ok) throw new Error('updates api failed');
              return await response.json();
            } catch {
              return initial;
            }
          }

          function wire() {
            [searchEl, authorEl, sectionEl].forEach((el) => el.addEventListener('input', render));
            clearEl.addEventListener('click', () => {
              searchEl.value = '';
              authorEl.value = '';
              sectionEl.value = '';
              render();
            });
            listEl.addEventListener('click', (event) => {
              const button = event.target.closest('[data-select]');
              const article = event.target.closest('[data-slug]');
              const slug = button?.getAttribute('data-select') || article?.getAttribute('data-slug');
              if (!slug) return;
              selectedSlug = slug;
              render();
            });
            generatedEl.textContent = 'Generated ' + (payload?.generatedAt || 'unknown');
            render();
          }

          loadUpdates().then((nextPayload) => {
            payload = nextPayload || initial;
            wire();
          });
        })();
      </script>`
  });
}

function renderProjectView(model, projectName) {
  const projectCards = model.cards.filter(c => c.project === projectName);
  const initialData = JSON.stringify({
    projectName,
    statusOrder: model.statusOrder,
    cards: projectCards.map(cardApiShape)
  }).replace(/</g, '\\u003c');

  return shell({
    title: `Project: ${projectName}`,
    currentPath: '/board',
    body: `
      <section class="hero">
        <div>
          <h1>Project: ${escapeHtml(projectName)}</h1>
          <p>Dedicated project view showing swimlane for ${projectCards.length} card(s).</p>
        </div>
        <a href="/board" class="button" >← Back to Board</a>
      </section>

      <style>
        .board-row {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(280px, 1fr);
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 12px;
        }
        .board-col { display: flex; flex-direction: column; gap: 12px; min-height: 100px; }
        .status-badge {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #98a3bb;
          margin-bottom: 8px;
          padding-left: 4px;
        }
      </style>

      <div class="board-row" id="project-board"></div>

      <script id="project-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const initial = JSON.parse(document.getElementById('project-data').textContent);
          const boardEl = document.getElementById('project-board');

          function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

          boardEl.innerHTML = initial.statusOrder.map(status => {
            const cards = initial.cards.filter(c => c.status === status);
            return '<div class="board-col">'
              + '<div class="status-badge">' + esc(status) + ' (' + cards.length + ')</div>'
              + cards.map(card => {
                  return '<article class="card" style="padding: 12px; margin-bottom: 0;">'
                    + '<div style="display:flex; justify-content:space-between; margin-bottom: 8px;">'
                    + '<span class="chip" style="font-size:0.7rem;">' + esc(card.id) + '</span>'
                    + '<span class="chip" style="font-size:0.7rem;">' + esc(card.priority) + '</span>'
                    + '</div>'
                    + '<h3 style="font-size: 0.95rem; margin: 0 0 8px;"><a href="/cards/' + encodeURIComponent(card.slug) + '">' + esc(card.title) + '</a></h3>'
                    + '<div class="tiny muted">' + esc(card.owner) + '</div>'
                    + '</article>';
                }).join('')
              + '</div>';
          }).join('');
        })();
      </script>`
  });
}

function renderProjectDecisionsView(model, projectName) {
  const projectDecisions = model.decisions.filter(d => d.project === projectName);
  const initialData = JSON.stringify({
    projectName,
    decisions: projectDecisions.map(decisionApiShape)
  }).replace(/</g, '\\u003c');

  return shell({
    title: `Project Decisions: ${projectName}`,
    currentPath: '/decisions',
    body: `
      <section class="hero">
        <div>
          <h1>Project Decisions: ${escapeHtml(projectName)}</h1>
          <p>Dedicated view for ${projectDecisions.length} decision(s) in ${escapeHtml(projectName)}.</p>
        </div>
        <a href="/decisions" class="button">← Back to Decisions</a>
      </section>

      <div class="grid list" id="project-decisions-list"></div>

      <script id="project-decisions-data" type="application/json">${initialData}</script>
      <script>
        (() => {
          const initial = JSON.parse(document.getElementById('project-decisions-data').textContent);
          const listEl = document.getElementById('project-decisions-list');

          function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

          listEl.innerHTML = initial.decisions.map(d => {
            return '<article class="panel">'
              + '<h2>' + esc(d.id) + ' — ' + esc(d.title) + '</h2>'
              + '<div class="muted" style="margin-bottom: 12px;">' + esc(d.status) + ' · ' + esc(d.date) + ' · ' + esc(d.owner) + '</div>'
              + '<div class="section-copy">'
              + '<h3>Decision</h3><p>' + esc(d.decision) + '</p>'
              + '</div>'
              + '<div style="margin-top: 12px;"><a href="/decisions/' + encodeURIComponent(d.slug) + '" class="button">View Full Detail</a></div>'
              + '</article>';
          }).join('') || '<p class="muted">No decisions found for this project.</p>';
        })();
      </script>`
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

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function cardApiShape(card) {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    status: card.status,
    priority: card.priority,
    owner: card.owner,
    project: card.project,
    assignedCoder: card.assignedCoder,
    startTime: card.startTime,
    estimate: card.estimate,
    completionTime: card.completionTime,
    updatedAt: card.updatedAt,
    summary: card.summary,
    objective: card.objective,
    whyItMatters: card.whyItMatters,
    scope: card.scope,
    outOfScope: card.outOfScope,
    steps: card.steps,
    blockers: card.blockers,
    artifacts: card.artifacts,
    updateLog: card.updateLog,
    filePath: card.filePath,
    allowedNextStatuses: allowedNextStatuses(card.status)
  };
}

function decisionApiShape(decision) {
  const decisionType = classifyDecisionType(decision);
  const responseHistory = Array.isArray(decision.responses) ? decision.responses : [];
  return {
    id: decision.id,
    slug: decision.slug,
    title: decision.title,
    status: decision.status,
    date: decision.date,
    owner: decision.owner,
    project: decision.project,
    context: decision.context,
    options: decision.options,
    optionsList: decision.optionsList,
    decision: decision.decision,
    consequences: decision.consequences,
    followUpTasks: decision.followUpTasks,
    responses: responseHistory,
    latestResponse: latestDecisionResponse(decision),
    responseHistory,
    decisionType,
    filePath: decision.filePath
  };
}

function listDecisionOptions(decision) {
  const raw = String(decision?.options || '');
  const titled = [...raw.matchAll(/^###\s+(.+)$/gm)].map((match) => match[1].trim()).filter(Boolean);
  if (titled.length) return titled;
  return raw
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function decisionActionPanelMarkup(decision, { compact = false } = {}) {
  const options = listDecisionOptions(decision);
  const latest = decision.latestResponse;
  const history = Array.isArray(decision.responseHistory) ? decision.responseHistory : [];
  return `<article class="panel" id="decision-action-panel">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
      <div>
        <h3 style="margin-bottom:6px;">Respond now</h3>
        <p class="muted">Approve or reject on the real route, capture notes, and keep a visible response trail.</p>
      </div>
      ${latest ? `<div class="chip" style="margin-right:0;">Latest: ${escapeHtml(latest.action)}${latest.option ? ` · ${escapeHtml(latest.option)}` : ''}</div>` : '<div class="chip" style="margin-right:0;">No response yet</div>'}
    </div>
    <form id="decision-response-form" class="stack" style="margin-top:12px;">
      <div class="button-row">
        <button class="button" type="button" data-decision-action="approve">Approve</button>
        <button class="button" type="button" data-decision-action="reject">Reject</button>
      </div>
      <input type="hidden" name="action" value="${escapeHtml(latest?.action || '')}" />
      <label class="stack">
        <span class="muted">Operator</span>
        <input name="actor" type="text" value="Adam" />
      </label>
      ${options.length ? `<label class="stack"><span class="muted">Option selected</span><select name="option"><option value="">No specific option</option>${options.map((option) => `<option value="${escapeHtml(option)}"${latest?.option === option ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label>` : '<input type="hidden" name="option" value="" />'}
      <label class="stack">
        <span class="muted">Notes</span>
        <textarea name="note" placeholder="Why this call, constraints, follow-up, objections, operator context...">${escapeHtml(latest?.note || '')}</textarea>
      </label>
      <div class="button-row" style="align-items:center;">
        <button class="button" id="decision-response-submit" type="submit">Save response</button>
        <span class="muted tiny" id="decision-response-result">Choose approve/reject, add note or option, then save.</span>
      </div>
    </form>
    <section class="stack" style="margin-top:16px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
        <h3 style="margin:0;">Response history</h3>
        <span class="muted tiny">${history.length} entr${history.length === 1 ? 'y' : 'ies'}</span>
      </div>
      <div id="decision-response-history">${history.length ? history.slice().reverse().map((entry) => `<article class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><strong>${escapeHtml(entry.action)}</strong><span class="tiny muted">${escapeHtml(entry.createdAt)} · ${escapeHtml(entry.actor || 'operator')}</span></div>${entry.option ? `<div class="tiny" style="margin-top:8px;">Option: ${escapeHtml(entry.option)}</div>` : ''}${entry.note ? `<p style="margin:8px 0 0;">${escapeHtml(entry.note)}</p>` : '<p class="muted" style="margin:8px 0 0;">No note recorded.</p>'}</article>`).join('') : '<p class="muted">No responses recorded yet.</p>'}</div>
    </section>
    ${compact ? '' : '<p class="muted tiny" style="margin-top:10px;">This response log is file-backed, so refresh survives.</p>'}
  </article>`;
}

function updateApiShape(update) {
  return {
    id: update.id,
    slug: update.slug,
    title: update.title,
    date: update.date,
    author: update.author,
    summary: update.summary,
    metadata: update.metadata,
    sections: update.sections,
    findings: update.findings,
    direction: update.direction,
    filePath: update.filePath
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const model = loadDashboardModel(root);
  const metricsLimit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 50)));

  if (req.method === 'POST' && url.pathname === '/api/cards') {
    try {
      const body = await readJsonBody(req);
      const result = createCardFromTemplate({ rootDir: root, ...body });
      if (result.ok) {
        const refreshedModel = loadDashboardModel(root);
        const createdCard = findBySlug(refreshedModel.cards, result.slug);
        json(res, result.statusCode || 201, { ...result, card: createdCard ? cardApiShape(createdCard) : null });
      } else {
        json(res, result.statusCode || 400, result);
      }
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/decisions') {
    try {
      const body = await readJsonBody(req);
      const result = createDecisionFromTemplate({ rootDir: root, ...body });
      if (result.ok) {
        const refreshedModel = loadDashboardModel(root);
        const createdDecision = findBySlug(refreshedModel.decisions, result.slug);
        json(res, result.statusCode || 201, { ...result, decision: createdDecision ? decisionApiShape(createdDecision) : null });
      } else {
        json(res, result.statusCode || 400, result);
      }
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/decisions/') && url.pathname.endsWith('/responses')) {
    const slug = decodeURIComponent(url.pathname.slice('/api/decisions/'.length, -'/responses'.length));
    const decision = findBySlug(model.decisions, slug);
    if (!decision) {
      json(res, 404, { ok: false, error: 'Decision not found' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const result = appendDecisionResponse({
        rootDir: root,
        slug,
        outcome: body.action || body.outcome,
        selectedOption: body.option || body.selectedOption,
        notes: body.note || body.notes,
        responder: body.actor || body.responder
      });
      if (!result.ok) {
        json(res, result.statusCode || 400, result);
        return;
      }
      const refreshedModel = loadDashboardModel(root);
      const refreshedDecision = findBySlug(refreshedModel.decisions, slug);
      json(res, result.statusCode || 201, { ...result, decision: refreshedDecision ? decisionApiShape(refreshedDecision) : null });
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/cards/') && url.pathname.endsWith('/status')) {
    const slug = decodeURIComponent(url.pathname.slice('/api/cards/'.length, -'/status'.length));

    try {
      const body = await readJsonBody(req);
      const result = transitionCardStatus({
        rootDir: root,
        slug,
        nextStatus: body.status,
        expectedCurrentStatus: body.expectedCurrentStatus
      });
      json(res, result.statusCode || 200, result);
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/decisions/') && url.pathname.endsWith('/respond')) {
    const slug = decodeURIComponent(url.pathname.slice('/api/decisions/'.length, -'/respond'.length));

    try {
      const body = await readJsonBody(req);
      const result = appendDecisionResponse({
        rootDir: root,
        slug,
        outcome: body.outcome,
        selectedOption: body.selectedOption,
        notes: body.notes,
        responder: body.responder
      });
      if (!result.ok) {
        json(res, result.statusCode || 400, result);
        return;
      }
      const refreshedModel = loadDashboardModel(root);
      const decision = findBySlug(refreshedModel.decisions, result.slug);
      json(res, result.statusCode || 201, { ...result, decision: decision ? decisionApiShape(decision) : null });
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/updates') {
    try {
      const body = await readJsonBody(req);
      const result = await appendUpdate({ ...body, updatesDir: path.join(root, 'docs/updates') });
      json(res, 201, { ok: true, ...result });
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/health') {
    json(res, 200, {
      ok: true,
      app: 'mb-kanban-dashboard',
      pid: process.pid,
      host,
      port,
      root,
      startedAt,
      uptimeMs: Math.round(process.uptime() * 1000),
      routes: [
        '/',
        '/metrics',
        '/board',
        '/cards/:id',
        '/decisions',
        '/decisions/projects/:projectName',
        '/decisions/:id',
        '/updates',
        '/api/summary',
        '/api/board',
        '/api/cards',
        'POST /api/cards',
        '/api/cards/:id',
        'POST /api/cards/:id/status',
        '/api/decisions',
        'POST /api/decisions',
        '/api/decisions/:id',
        'POST /api/decisions/:id/respond',
        '/api/updates',
        '/api/updates/:id',
        '/api/metrics/summary',
        '/api/metrics/runs',
        '/api/metrics/comparison',
        '/api/metrics/timeline'
      ]
    });
    return;
  }

  if (url.pathname === '/api/metrics/summary') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      json(res, 200, {
        generatedAt: new Date().toISOString(),
        dbPath: metrics.dbPath,
        projectId: metrics.projectId,
        summary: metrics.summary,
        byStatus: metrics.byStatus,
        byOwner: metrics.byOwner
      });
    } catch (error) {
      json(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/api/metrics/runs') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      json(res, 200, {

        generatedAt: new Date().toISOString(),
        dbPath: metrics.dbPath,
        projectId: metrics.projectId,
        count: metrics.recentRuns.length,
        items: metrics.recentRuns
      });
    } catch (error) {
      json(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/api/metrics/comparison') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      json(res, 200, {
        generatedAt: new Date().toISOString(),
        dbPath: metrics.dbPath,
        projectId: metrics.projectId,
        count: metrics.comparison.length,
        items: metrics.comparison
      });
    } catch (error) {
      json(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/api/metrics/timeline') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      json(res, 200, {
        generatedAt: new Date().toISOString(),
        dbPath: metrics.dbPath,
        projectId: metrics.projectId,
        count: metrics.timeline.length,
        items: metrics.timeline
      });
    } catch (error) {
      json(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/api/summary') {
    json(res, 200, model.summary);
    return;
  }

  if (url.pathname === '/api/board') {
    json(res, 200, {
      generatedAt: model.generatedAt,
      statusOrder: model.statusOrder,
      summary: model.summary,
      board: model.board.map((column) => ({
        status: column.status,
        count: column.cards.length,
        cards: column.cards.map(cardApiShape)
      }))
    });
    return;
  }

  if (url.pathname === '/api/cards') {
    json(res, 200, {
      generatedAt: model.generatedAt,
      count: model.cards.length,
      items: model.cards.map(cardApiShape)
    });
    return;
  }

  if (url.pathname.startsWith('/api/cards/')) {
    const card = findBySlug(model.cards, decodeURIComponent(url.pathname.slice('/api/cards/'.length)));

    if (!card) {
      json(res, 404, { ok: false, error: 'Card not found' });
      return;
    }

    json(res, 200, cardApiShape(card));
    return;
  }

  if (url.pathname === '/api/decisions') {
    json(res, 200, {
      generatedAt: model.generatedAt,
      count: model.decisions.length,
      items: model.decisions.map(decisionApiShape)
    });
    return;
  }

  if (url.pathname.startsWith('/api/decisions/')) {
    const decision = findBySlug(model.decisions, decodeURIComponent(url.pathname.slice('/api/decisions/'.length)));

    if (!decision) {
      json(res, 404, { ok: false, error: 'Decision not found' });
      return;
    }

    json(res, 200, decisionApiShape(decision));
    return;
  }

  if (url.pathname === '/api/updates') {
    json(res, 200, {
      generatedAt: model.generatedAt,
      count: model.updates.length,
      items: model.updates.map(updateApiShape)
    });
    return;
  }

  if (url.pathname.startsWith('/api/updates/')) {
    const update = findBySlug(model.updates, decodeURIComponent(url.pathname.slice('/api/updates/'.length)));

    if (!update) {
      json(res, 404, { ok: false, error: 'Update not found' });
      return;
    }

    json(res, 200, updateApiShape(update));
    return;
  }

  if (url.pathname === '/') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      sendHtml(res, 200, renderOverview(model, metrics));
    } catch (error) {
      sendHtml(res, 200, renderOverview(model, {
        summary: {},
        byStatus: [],
        byOwner: [],
        recentRuns: [],
        timeline: []
      }));
    }
    return;
  }

  if (url.pathname === '/metrics') {
    try {
      const metrics = loadMetricsSnapshot({ limit: metricsLimit });
      sendHtml(res, 200, renderMetricsScreen(model, metrics));
    } catch (error) {
      sendHtml(res, 200, shell({
        title: 'Metrics',
        currentPath: '/metrics',
        body: `<section class="hero"><div><h1>Metrics timeline & comparison</h1><p>Metrics screen could not load the SQLite metrics snapshot.</p></div></section><article class="panel"><h2>Metrics unavailable</h2><p class="muted">${escapeHtml(error.message)}</p></article>`
      }));
    }
    return;
  }

  if (url.pathname === '/board') {
    sendHtml(res, 200, renderBoard(model));
    return;
  }

  if (url.pathname.startsWith('/projects/')) {
    sendHtml(res, 200, renderProjectView(model, decodeURIComponent(url.pathname.slice('/projects/'.length))));
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

  if (url.pathname === '/decisions-v2-test') {
    const html = renderDecisions(model);
    const injected = html.replace('</h1>', '</h1><p class="muted">API-backed decisions screen with local filtering and in-page detail inspection.</p>');
    sendHtml(res, 200, injected);
    return;
  }

  if (url.pathname.startsWith('/decisions/projects/')) {
    sendHtml(res, 200, renderProjectDecisionsView(model, decodeURIComponent(url.pathname.slice('/decisions/projects/'.length))));
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
});

server.on('error', (error) => {
  console.error(`[mb-kanban-dashboard] failed to start on http://${host}:${port}: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`MB Kanban Dashboard listening on http://${host}:${port} (pid=${process.pid}, root=${root})`);
});
