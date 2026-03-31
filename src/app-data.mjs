import fs from 'node:fs';
import path from 'node:path';

const STATUS_ORDER = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Review', 'Done'];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dirPath, name));
}

function parseField(markdown, label) {
  const match = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'));
  return match ? match[1].trim() : 'Unknown';
}

function parseSection(markdown, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)`, 'mi'));
  return match ? match[1].trim() : '';
}

function parseTitle(markdown) {
  const firstLine = markdown.split('\n')[0] || '';
  const clean = firstLine.replace(/^#\s*/, '').trim();
  const parts = clean.split('—').map((part) => part.trim());
  return {
    id: parts[0] || 'UNKNOWN',
    title: parts.slice(1).join(' — ') || clean || 'Untitled'
  };
}

function summarize(text, max = 140) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function slugForId(id) {
  return encodeURIComponent(id.toLowerCase());
}

export function loadCards(rootDir) {
  const cardsDir = path.join(rootDir, 'docs', 'cards');
  return listMarkdownFiles(cardsDir).map((filePath) => {
    const markdown = readText(filePath);
    const titleInfo = parseTitle(markdown);
    const objective = parseSection(markdown, 'Objective');
    return {
      id: titleInfo.id,
      slug: slugForId(titleInfo.id),
      title: titleInfo.title,
      status: parseField(markdown, 'Status'),
      priority: parseField(markdown, 'Priority'),
      owner: parseField(markdown, 'Owner'),
      updatedAt: parseField(markdown, 'Last Updated'),
      summary: summarize(objective || parseSection(markdown, 'Why It Matters') || 'No summary yet.'),
      objective,
      whyItMatters: parseSection(markdown, 'Why It Matters'),
      scope: parseSection(markdown, 'Scope'),
      outOfScope: parseSection(markdown, 'Out of Scope'),
      steps: parseSection(markdown, 'Steps'),
      blockers: parseSection(markdown, 'Blockers'),
      artifacts: parseSection(markdown, 'Artifacts'),
      updateLog: parseSection(markdown, 'Update Log'),
      filePath,
      raw: markdown
    };
  });
}

export function loadDecisions(rootDir) {
  const decisionsDir = path.join(rootDir, 'docs', 'decisions');
  return listMarkdownFiles(decisionsDir).map((filePath) => {
    const markdown = readText(filePath);
    const titleInfo = parseTitle(markdown);
    return {
      id: titleInfo.id,
      slug: slugForId(titleInfo.id),
      title: titleInfo.title,
      status: parseField(markdown, 'Status'),
      date: parseField(markdown, 'Date'),
      owner: parseField(markdown, 'Owner'),
      context: parseSection(markdown, 'Context'),
      options: parseSection(markdown, 'Options Considered'),
      decision: parseSection(markdown, 'Decision'),
      consequences: parseSection(markdown, 'Consequences'),
      followUpTasks: parseSection(markdown, 'Follow-Up Tasks'),
      filePath,
      raw: markdown
    };
  });
}

export function loadUpdates(rootDir) {
  const updatesDir = path.join(rootDir, 'docs', 'updates');
  return listMarkdownFiles(updatesDir)
    .map((filePath) => {
      const markdown = readText(filePath);
      const titleInfo = parseTitle(markdown);
      return {
        id: path.basename(filePath, '.md'),
        slug: slugForId(path.basename(filePath, '.md')),
        title: titleInfo.title || titleInfo.id,
        date: parseField(markdown, 'Date'),
        author: parseField(markdown, 'Author'),
        summary: parseSection(markdown, 'Summary'),
        findings: parseSection(markdown, 'Findings'),
        direction: parseSection(markdown, 'New Program Direction'),
        filePath,
        raw: markdown
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id.localeCompare(a.id));
}

export function loadDashboardModel(rootDir) {
  const cards = loadCards(rootDir);
  const decisions = loadDecisions(rootDir);
  const updates = loadUpdates(rootDir);

  const board = STATUS_ORDER.map((status) => ({
    status,
    cards: cards.filter((card) => card.status === status)
  }));

  const unknownStatuses = cards
    .filter((card) => !STATUS_ORDER.includes(card.status))
    .map((card) => card.status)
    .filter((value, index, all) => all.indexOf(value) === index);

  return {
    generatedAt: new Date().toISOString(),
    board,
    cards,
    decisions,
    updates,
    statusOrder: STATUS_ORDER,
    summary: {
      cardCount: cards.length,
      decisionCount: decisions.length,
      updateCount: updates.length,
      activeCount: cards.filter((card) => card.status === 'In Progress').length,
      blockedCount: cards.filter((card) => card.status === 'Blocked').length,
      doneCount: cards.filter((card) => card.status === 'Done').length,
      unknownStatuses
    }
  };
}

export function findBySlug(items, slug) {
  return items.find((item) => item.slug === slug) || null;
}
