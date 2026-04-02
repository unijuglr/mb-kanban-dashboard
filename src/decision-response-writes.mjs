import fs from 'node:fs';
import path from 'node:path';
import { parseDecisionMarkdown } from './decision-parser.mjs';

function decisionsDir(rootDir) {
  return path.join(rootDir, 'docs', 'decisions');
}

function responsesDir(rootDir) {
  return path.join(decisionsDir(rootDir), 'responses');
}

function responseFilePath(rootDir, decisionId) {
  return path.join(responsesDir(rootDir), `${String(decisionId || '').trim().toUpperCase()}.responses.json`);
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeOutcome(value) {
  const text = normalizeText(value).toLowerCase();
  if (!text) return null;
  if (['approve', 'approved', 'yes', 'accept', 'accepted'].includes(text)) return 'approve';
  if (['reject', 'rejected', 'no', 'decline', 'declined'].includes(text)) return 'reject';
  if (['option', 'choose-option', 'choice'].includes(text)) return 'option';
  if (['note', 'notes', 'comment', 'response'].includes(text)) return 'note';
  return text;
}

function slugForId(id) {
  return encodeURIComponent(String(id || '').toLowerCase());
}

function listDecisionFiles(rootDir) {
  const dir = decisionsDir(rootDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name));
}

function findDecisionBySlug(rootDir, slug) {
  for (const filePath of listDecisionFiles(rootDir)) {
    const parsed = parseDecisionMarkdown(fs.readFileSync(filePath, 'utf8'), filePath);
    const decisionSlug = slugForId(parsed.id || path.basename(filePath, '.md'));
    if (decisionSlug === String(slug || '').trim()) {
      return {
        id: parsed.id || path.basename(filePath, '.md').toUpperCase(),
        slug: decisionSlug,
        filePath
      };
    }
  }
  return null;
}

export function loadDecisionResponses(rootDir, decisionId) {
  return readJsonArray(responseFilePath(rootDir, decisionId));
}

export function appendDecisionResponse({ rootDir, slug, outcome, selectedOption = '', notes = '', responder = 'MB Operator' }) {
  const decision = findDecisionBySlug(rootDir, slug);

  if (!decision) {
    return {
      ok: false,
      code: 'decision_not_found',
      statusCode: 404,
      error: 'Decision not found.'
    };
  }

  const normalizedOutcome = normalizeOutcome(outcome);
  const normalizedOption = normalizeText(selectedOption);
  const normalizedNotes = normalizeText(notes);
  const normalizedResponder = normalizeText(responder) || 'MB Operator';

  if (!normalizedOutcome && !normalizedOption && !normalizedNotes) {
    return {
      ok: false,
      code: 'validation_error',
      statusCode: 400,
      error: 'Provide an approval/rejection, a selected option, or notes.'
    };
  }

  fs.mkdirSync(responsesDir(rootDir), { recursive: true });
  const filePath = responseFilePath(rootDir, decision.id);
  const existing = readJsonArray(filePath);
  const record = {
    id: `${decision.id.toLowerCase()}-resp-${existing.length + 1}`,
    decisionId: decision.id,
    decisionSlug: decision.slug,
    createdAt: new Date().toISOString(),
    responder: normalizedResponder,
    outcome: normalizedOutcome,
    selectedOption: normalizedOption,
    notes: normalizedNotes
  };

  existing.push(record);
  fs.writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`);

  return {
    ok: true,
    changed: true,
    statusCode: 201,
    decisionId: decision.id,
    slug: decision.slug,
    response: record,
    filePath: path.relative(rootDir, filePath)
  };
}
