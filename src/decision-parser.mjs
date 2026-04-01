import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

function normalizeNewlines(input) {
  return String(input ?? '').replace(/\r\n?/g, '\n');
}

function parseTopLevelSections(content) {
  const lines = normalizeNewlines(content).split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.*)$/);

    if (match) {
      if (current) {
        current.content = current.lines.join('\n').trim();
        delete current.lines;
        sections.push(current);
      }

      current = {
        heading: match[1].trim(),
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    current.content = current.lines.join('\n').trim();
    delete current.lines;
    sections.push(current);
  }

  return sections;
}

function parseChecklist(content) {
  return normalizeNewlines(content)
    .split('\n')
    .map((line) => line.match(/^\s*-\s*\[( |x)\]\s+(.*)$/i))
    .filter(Boolean)
    .map((match) => ({
      done: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
    }));
}

function parseOptions(content) {
  const lines = normalizeNewlines(content).split('\n');
  const options = [];
  let current = null;

  for (const line of lines) {
    const optionHeading = line.match(/^###\s+(.*)$/);

    if (optionHeading) {
      if (current) {
        current.description = current.lines.join('\n').trim();
        delete current.lines;
        options.push(current);
      }

      current = {
        title: optionHeading[1].trim(),
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    current.description = current.lines.join('\n').trim();
    delete current.lines;
    options.push(current);
  }

  if (options.length > 0) {
    return options;
  }

  return normalizeNewlines(content)
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((match, index) => ({
      title: `Option ${index + 1}`,
      description: match[1].trim(),
    }));
}

function trimInlineValue(value) {
  return value ? value.trim() : null;
}

export function parseDecisionMarkdown(markdown, sourcePath = null) {
  const content = normalizeNewlines(markdown).trim();
  const lines = content.split('\n');
  const titleLine = lines[0] ?? '';
  const titleMatch = titleLine.match(/^#\s+(DEC-\d+)\s+—\s+(.*)$/i);

  const record = {
    id: titleMatch?.[1] ?? null,
    title: titleMatch?.[2]?.trim() ?? null,
    status: null,
    date: null,
    owner: null,
    project: null,
    context: '',
    decision: '',
    why: '',
    consequences: '',
    followUpTasks: [],
    optionsConsidered: [],
    sections: {},
    raw: content,
    sourcePath,
  };

  for (const line of lines.slice(1)) {
    if (/^##\s+/.test(line)) {
      break;
    }

    let match = line.match(/^Status:\s*(.*)$/i);
    if (match) {
      record.status = trimInlineValue(match[1]);
      continue;
    }

    match = line.match(/^Date:\s*(.*)$/i);
    if (match) {
      record.date = trimInlineValue(match[1]);
      continue;
    }

    match = line.match(/^Owner:\s*(.*)$/i);
    if (match) {
      record.owner = trimInlineValue(match[1]);
      continue;
    }

    match = line.match(/^Project:\s*(.*)$/i);
    if (match) {
      record.project = trimInlineValue(match[1]);
    }
  }

  const sections = parseTopLevelSections(content);
  for (const section of sections) {
    record.sections[section.heading] = section.content;
  }

  record.context = record.sections.Context ?? '';
  record.decision = record.sections.Decision ?? '';
  record.why = record.sections.Why ?? '';
  record.consequences = record.sections.Consequences ?? '';
  record.followUpTasks = parseChecklist(record.sections['Follow-Up Tasks'] ?? '');
  record.optionsConsidered = parseOptions(record.sections['Options Considered'] ?? '');

  return record;
}

export async function parseDecisionFile(filePath) {
  const markdown = await readFile(filePath, 'utf8');
  return parseDecisionMarkdown(markdown, filePath);
}

export async function parseDecisionDirectory(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const decisionFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => path.join(directoryPath, entry.name))
    .sort((a, b) => a.localeCompare(b));

  const decisions = await Promise.all(decisionFiles.map((filePath) => parseDecisionFile(filePath)));
  return decisions;
}
