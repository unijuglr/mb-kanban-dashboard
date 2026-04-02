import fs from 'node:fs';
import path from 'node:path';
import { findBySlug, loadCards } from './app-data.mjs';

export const STATUS_ORDER = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Review', 'Done', 'Archive'];

const ALLOWED_TRANSITIONS = {
  Backlog: ['Ready', 'Archive'],
  Ready: ['Backlog', 'In Progress', 'Archive'],
  'In Progress': ['Ready', 'Blocked', 'Review', 'Archive'],
  Blocked: ['Ready', 'In Progress', 'Archive'],
  Review: ['In Progress', 'Done', 'Archive'],
  Done: ['Review', 'Archive'],
  Archive: ['Backlog']
};

function isoDateOnly(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function replaceSingleField(markdown, label, nextValue) {
  const pattern = new RegExp(`^${label}:\\s*.+$`, 'm');
  if (!pattern.test(markdown)) {
    throw new Error(`Missing required field: ${label}`);
  }
  return markdown.replace(pattern, `${label}: ${nextValue}`);
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required.`;
  }
  return null;
}

function normalizeCardId(value) {
  return String(value || '').trim().toUpperCase();
}

function slugifySegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function cardFileName(id, title) {
  const titleSlug = slugifySegment(title) || 'untitled-card';
  return `${id}-${titleSlug}.md`;
}

function cardTemplate(data) {
  const {
    id,
    title,
    status,
    priority,
    owner,
    project,
    assignedCoder,
    startTime,
    estimate,
    completionTime,
    created,
    lastUpdated,
    objective,
    whyItMatters,
    scope,
    outOfScope,
    steps,
    blockers,
    artifacts,
    updateLog
  } = data;
  return `# ${id} — ${title}

Status: ${status}
Priority: ${priority}
Owner: ${owner}
Project: ${project}
Assigned Coder: ${assignedCoder || 'Unknown'}
Start Time: ${startTime || 'Unknown'}
Estimate: ${estimate || 'Unknown'}
Completion Time: ${completionTime || 'Unknown'}
Created: ${created}
Last Updated: ${lastUpdated}

## Objective
${objective}

## Why It Matters
${whyItMatters}

## Scope
${scope}

## Out of Scope
${outOfScope}

## Steps
${steps}

## Blockers
${blockers}

## Artifacts
${artifacts}

## Update Log
${updateLog}
`;
}

export function allowedNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function transitionCardStatus({ rootDir, slug, nextStatus, expectedCurrentStatus }) {
  if (!STATUS_ORDER.includes(nextStatus)) {
    return {
      ok: false,
      code: 'invalid_status',
      statusCode: 400,
      error: `Unsupported status: ${nextStatus}`,
      allowedStatuses: STATUS_ORDER
    };
  }

  if (!expectedCurrentStatus || !STATUS_ORDER.includes(expectedCurrentStatus)) {
    return {
      ok: false,
      code: 'expected_status_required',
      statusCode: 400,
      error: 'expectedCurrentStatus is required and must be a valid status.',
      allowedStatuses: STATUS_ORDER
    };
  }

  const cards = loadCards(rootDir);
  const card = findBySlug(cards, slug);

  if (!card) {
    return {
      ok: false,
      code: 'card_not_found',
      statusCode: 404,
      error: 'Card not found.'
    };
  }

  if (card.status !== expectedCurrentStatus) {
    return {
      ok: false,
      code: 'stale_status',
      statusCode: 409,
      error: `Card status is ${card.status}, not ${expectedCurrentStatus}.`,
      currentStatus: card.status,
      allowedNextStatuses: allowedNextStatuses(card.status)
    };
  }

  if (card.status === nextStatus) {
    return {
      ok: true,
      changed: false,
      statusCode: 200,
      cardId: card.id,
      slug: card.slug,
      filePath: card.filePath,
      status: card.status,
      lastUpdated: card.updatedAt,
      allowedNextStatuses: allowedNextStatuses(card.status)
    };
  }

  const allowed = allowedNextStatuses(card.status);
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      code: 'invalid_transition',
      statusCode: 409,
      error: `Transition ${card.status} -> ${nextStatus} is not allowed.`,
      currentStatus: card.status,
      requestedStatus: nextStatus,
      allowedNextStatuses: allowed
    };
  }

  const original = fs.readFileSync(card.filePath, 'utf8');
  let updated = replaceSingleField(original, 'Status', nextStatus);
  updated = replaceSingleField(updated, 'Last Updated', isoDateOnly());

  if (updated === original) {
    return {
      ok: true,
      changed: false,
      statusCode: 200,
      cardId: card.id,
      slug: card.slug,
      filePath: card.filePath,
      status: card.status,
      lastUpdated: card.updatedAt,
      allowedNextStatuses: allowedNextStatuses(card.status)
    };
  }

  fs.writeFileSync(card.filePath, updated);
  const refreshedCard = findBySlug(loadCards(rootDir), slug);

  return {
    ok: true,
    changed: true,
    statusCode: 200,
    cardId: refreshedCard.id,
    slug: refreshedCard.slug,
    filePath: path.relative(rootDir, refreshedCard.filePath),
    previousStatus: card.status,
    status: refreshedCard.status,
    lastUpdated: refreshedCard.updatedAt,
    allowedNextStatuses: allowedNextStatuses(refreshedCard.status)
  };
}

export function createCardFromTemplate({
  rootDir,
  id,
  title,
  owner,
  project = 'Motherbrain',
  priority = 'P2 normal',
  status = 'Backlog',
  assignedCoder = 'Unknown',
  startTime = 'Unknown',
  estimate = 'Unknown',
  completionTime = 'Unknown',
  objective,
  whyItMatters = 'Document why this work matters.',
  scope = '- [ ] define scope',
  outOfScope = '- [ ] list explicit non-goals',
  steps = '- [ ] draft implementation plan',
  blockers = '- None currently.',
  artifacts = '- None yet.',
  updateLog
}) {
  const normalizedId = normalizeCardId(id);
  const today = isoDateOnly();
  const validationErrors = [
    requireNonEmptyString(normalizedId, 'id'),
    requireNonEmptyString(title, 'title'),
    requireNonEmptyString(owner, 'owner'),
    requireNonEmptyString(objective, 'objective'),
    requireNonEmptyString(project, 'project')
  ].filter(Boolean);

  if (!/^MB-\d+$/.test(normalizedId)) {
    validationErrors.push('id must look like MB-###.');
  }

  if (!STATUS_ORDER.includes(status)) {
    validationErrors.push(`status must be one of: ${STATUS_ORDER.join(', ')}`);
  }

  if (validationErrors.length) {
    return {
      ok: false,
      code: 'validation_error',
      statusCode: 400,
      error: validationErrors.join(' ')
    };
  }

  const cards = loadCards(rootDir);
  if (cards.some((card) => card.id === normalizedId || card.slug === encodeURIComponent(normalizedId.toLowerCase()))) {
    return {
      ok: false,
      code: 'duplicate_card',
      statusCode: 409,
      error: `Card ${normalizedId} already exists.`
    };
  }

  const cardsDir = path.join(rootDir, 'docs', 'cards');
  fs.mkdirSync(cardsDir, { recursive: true });

  const fileName = cardFileName(normalizedId, title);
  const absolutePath = path.join(cardsDir, fileName);

  if (fs.existsSync(absolutePath)) {
    return {
      ok: false,
      code: 'file_exists',
      statusCode: 409,
      error: `Card file already exists: ${fileName}`
    };
  }

  const markdown = cardTemplate({
    id: normalizedId,
    title: String(title).trim(),
    status,
    priority: String(priority).trim() || 'P2 normal',
    owner: String(owner).trim(),
    project: String(project).trim() || 'Motherbrain',
    assignedCoder: String(assignedCoder).trim(),
    startTime: String(startTime).trim(),
    estimate: String(estimate).trim(),
    completionTime: String(completionTime).trim(),
    created: today,
    lastUpdated: today,
    objective: String(objective).trim(),
    whyItMatters: String(whyItMatters).trim(),
    scope: String(scope).trim(),
    outOfScope: String(outOfScope).trim(),
    steps: String(steps).trim(),
    blockers: String(blockers).trim(),
    artifacts: String(artifacts).trim(),
    updateLog: String(updateLog || `- ${today} — Card created from template.`).trim()
  });

  fs.writeFileSync(absolutePath, markdown);
  const createdCard = findBySlug(loadCards(rootDir), encodeURIComponent(normalizedId.toLowerCase()));

  return {
    ok: true,
    changed: true,
    statusCode: 201,
    cardId: createdCard?.id || normalizedId,
    slug: createdCard?.slug || encodeURIComponent(normalizedId.toLowerCase()),
    filePath: path.relative(rootDir, absolutePath),
    status,
    created: today,
    lastUpdated: today
  };
}
