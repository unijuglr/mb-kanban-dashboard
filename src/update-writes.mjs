import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_UPDATES_DIR = path.resolve(process.cwd(), 'docs/updates');

/**
 * Appends a new update to the docs/updates directory.
 * 
 * @param {Object} options
 * @param {string} options.title - Update title (e.g., "Feature X Implemented")
 * @param {string} [options.date] - YYYY-MM-DD (defaults to today)
 * @param {string} [options.author] - Author name (defaults to "Sam")
 * @param {string} [options.summary] - Short summary of the update
 * @param {string[]} [options.bullets] - List of bullet points for the update
 * @param {string} [options.updatesDir] - Directory to write to
 */
export async function appendUpdate({
  title,
  date = new Date().toISOString().split('T')[0],
  author = 'Sam',
  summary = '',
  bullets = [],
  updatesDir = DEFAULT_UPDATES_DIR
}) {
  if (!title) {
    throw new Error('Update title is required');
  }

  // Create filename: YYYY-MM-DD-slugified-title.md
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(updatesDir, fileName);

  // Construct Markdown content
  let content = `# ${title}\n\n`;
  content += `Date: ${date}\n`;
  content += `Author: ${author}\n\n`;
  
  if (summary) {
    content += `## Summary\n\n${summary}\n\n`;
  }

  if (bullets && bullets.length > 0) {
    content += `## Details\n\n`;
    for (const bullet of bullets) {
      content += `- ${bullet}\n`;
    }
    content += `\n`;
  }

  // Ensure directory exists
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, content, 'utf8');

  return {
    success: true,
    fileName,
    filePath,
    title,
    date
  };
}
