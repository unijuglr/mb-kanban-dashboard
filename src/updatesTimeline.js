import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_UPDATES_DIR = path.resolve(process.cwd(), 'docs/updates');

function normalizeKey(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function splitSections(lines) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.*)$/);
    if (match) {
      current = { heading: match[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  return sections.map((section) => ({
    heading: section.heading,
    key: normalizeKey(section.heading),
    body: section.lines.join('\n').trim(),
    bulletItems: section.lines
      .map((line) => line.match(/^[-*]\s+(.*)$/)?.[1]?.trim())
      .filter(Boolean),
  }));
}

function parseFrontMatter(lines) {
  const metadata = {};

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    if (line.startsWith('## ')) {
      break;
    }

    const match = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.+)$/);
    if (match) {
      metadata[normalizeKey(match[1])] = match[2].trim();
    }
  }

  return metadata;
}

export function parseUpdateFile(content, filePath = '') {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const title = lines.find((line) => line.startsWith('# '))?.replace(/^#\s+/, '').trim() || path.basename(filePath, path.extname(filePath));
  const metadata = parseFrontMatter(lines.slice(1));
  const sections = splitSections(lines);
  const summarySection = sections.find((section) => section.key === 'summary');

  return {
    id: path.basename(filePath || title, path.extname(filePath || '')),
    filePath,
    fileName: path.basename(filePath || ''),
    title,
    date: metadata.date || null,
    author: metadata.author || null,
    summary: summarySection?.body || null,
    metadata,
    sections,
    content,
  };
}

export function readUpdatesTimeline(updatesDir = DEFAULT_UPDATES_DIR) {
  const entries = fs
    .readdirSync(updatesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(updatesDir, entry.name))
    .map((filePath) => parseUpdateFile(fs.readFileSync(filePath, 'utf8'), filePath));

  return entries.sort((left, right) => {
    const leftDate = left.date || '';
    const rightDate = right.date || '';

    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }

    return right.fileName.localeCompare(left.fileName);
  });
}

export function summarizeUpdatesTimeline(updates) {
  return {
    count: updates.length,
    latestDate: updates[0]?.date || null,
    titles: updates.map((update) => update.title),
  };
}
