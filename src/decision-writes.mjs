import fs from 'node:fs';
import path from 'node:path';
import { findBySlug, loadDecisions } from './app-data.mjs';

function isoDateOnly(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required.`;
  }
  return null;
}

function normalizeDecisionId(value) {
  return String(value || '').trim().toUpperCase();
}

function slugifySegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function decisionFileName(id, title) {
  const titleSlug = slugifySegment(title) || 'untitled-decision';
  return `${id}-${titleSlug}.md`;
}

function decisionTemplate({
  id,
  title,
  status,
  date,
  owner,
  context,
  optionsConsidered,
  decision,
  why,
  consequences,
  followUpTasks
}) {
  return `# ${id} — ${title}

Status: ${status}
Date: ${date}
Owner: ${owner}

## Context
${context}

## Options Considered
${optionsConsidered}

## Decision
${decision}

## Why
${why}

## Consequences
${consequences}

## Follow-Up Tasks
${followUpTasks}
`;
}

export function createDecisionFromTemplate({
  rootDir,
  id,
  title,
  owner,
  status = 'Proposed',
  date,
  context,
  optionsConsidered = '### Option A\nKeep the current approach.\n\n### Option B\nAdopt the proposed change.',
  decision,
  why = 'Document why this decision is the right call right now.',
  consequences = '- capture expected consequences here',
  followUpTasks = '- [ ] document follow-up work'
}) {
  const normalizedId = normalizeDecisionId(id);
  const normalizedDate = String(date || isoDateOnly()).trim();
  const validationErrors = [
    requireNonEmptyString(normalizedId, 'id'),
    requireNonEmptyString(title, 'title'),
    requireNonEmptyString(owner, 'owner'),
    requireNonEmptyString(context, 'context'),
    requireNonEmptyString(decision, 'decision')
  ].filter(Boolean);

  if (!/^DEC-\d+$/.test(normalizedId)) {
    validationErrors.push('id must look like DEC-###.');
  }

  if (!normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    validationErrors.push('date must look like YYYY-MM-DD.');
  }

  if (validationErrors.length) {
    return {
      ok: false,
      code: 'validation_error',
      statusCode: 400,
      error: validationErrors.join(' ')
    };
  }

  const decisions = loadDecisions(rootDir);
  if (decisions.some((item) => item.id === normalizedId || item.slug === encodeURIComponent(normalizedId.toLowerCase()))) {
    return {
      ok: false,
      code: 'duplicate_decision',
      statusCode: 409,
      error: `Decision ${normalizedId} already exists.`
    };
  }

  const decisionsDir = path.join(rootDir, 'docs', 'decisions');
  fs.mkdirSync(decisionsDir, { recursive: true });

  const fileName = decisionFileName(normalizedId, title);
  const absolutePath = path.join(decisionsDir, fileName);

  if (fs.existsSync(absolutePath)) {
    return {
      ok: false,
      code: 'file_exists',
      statusCode: 409,
      error: `Decision file already exists: ${fileName}`
    };
  }

  const markdown = decisionTemplate({
    id: normalizedId,
    title: String(title).trim(),
    status: String(status || 'Proposed').trim() || 'Proposed',
    date: normalizedDate,
    owner: String(owner).trim(),
    context: String(context).trim(),
    optionsConsidered: String(optionsConsidered).trim(),
    decision: String(decision).trim(),
    why: String(why).trim(),
    consequences: String(consequences).trim(),
    followUpTasks: String(followUpTasks).trim()
  });

  fs.writeFileSync(absolutePath, markdown);
  const createdDecision = findBySlug(loadDecisions(rootDir), encodeURIComponent(normalizedId.toLowerCase()));

  return {
    ok: true,
    changed: true,
    statusCode: 201,
    decisionId: createdDecision?.id || normalizedId,
    slug: createdDecision?.slug || encodeURIComponent(normalizedId.toLowerCase()),
    filePath: path.relative(rootDir, absolutePath),
    status: createdDecision?.status || String(status || 'Proposed').trim() || 'Proposed',
    date: createdDecision?.date || normalizedDate
  };
}
