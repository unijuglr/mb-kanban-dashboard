import fs from 'node:fs';
import path from 'node:path';

function storePath(rootDir) {
  return path.join(rootDir, 'data', 'decision-responses.json');
}

function ensureStore(rootDir) {
  const filePath = storePath(rootDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ decisions: {} }, null, 2) + '\n');
  }
  return filePath;
}

function readStore(rootDir) {
  const filePath = ensureStore(rootDir);
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.decisions !== 'object') {
      return { decisions: {} };
    }
    return parsed;
  } catch {
    return { decisions: {} };
  }
}

function writeStore(rootDir, data) {
  const filePath = ensureStore(rootDir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  return filePath;
}

function normalizeSlug(value) {
  return encodeURIComponent(String(value || '').trim().toLowerCase());
}

function normalizeAction(value) {
  const action = String(value || '').trim().toLowerCase();
  if (action === 'approve') return 'approve';
  if (action === 'reject') return 'reject';
  return '';
}

function requireNonEmpty(value, field) {
  if (!String(value || '').trim()) throw new Error(`${field} is required.`);
}

export function loadDecisionResponseEnvelope(rootDir, slug) {
  const normalizedSlug = normalizeSlug(slug);
  const store = readStore(rootDir);
  const record = store.decisions[normalizedSlug] || { responses: [] };
  const responses = Array.isArray(record.responses) ? record.responses : [];
  const latest = responses[responses.length - 1] || null;
  return {
    slug: normalizedSlug,
    latest,
    responses
  };
}

export function appendDecisionResponse(rootDir, slug, payload) {
  const normalizedSlug = normalizeSlug(slug);
  const action = normalizeAction(payload?.action);
  requireNonEmpty(action, 'action');
  requireNonEmpty(payload?.actor || 'operator', 'actor');

  const note = String(payload?.note || '').trim();
  const option = String(payload?.option || '').trim();
  if (!note && !option) {
    throw new Error('note or option is required.');
  }

  const response = {
    id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    option: option || null,
    note: note || null,
    actor: String(payload?.actor || 'operator').trim(),
    createdAt: new Date().toISOString()
  };

  const store = readStore(rootDir);
  const existing = store.decisions[normalizedSlug] || { responses: [] };
  const responses = Array.isArray(existing.responses) ? existing.responses : [];
  store.decisions[normalizedSlug] = {
    responses: [...responses, response]
  };
  const filePath = writeStore(rootDir, store);

  return {
    ok: true,
    changed: true,
    response,
    count: store.decisions[normalizedSlug].responses.length,
    filePath
  };
}
