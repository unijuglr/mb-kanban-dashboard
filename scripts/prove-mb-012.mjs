import path from 'node:path';
import { readUpdatesTimeline, summarizeUpdatesTimeline } from '../src/updatesTimeline.js';

const updatesDir = path.resolve(process.cwd(), 'docs/updates');
const timeline = readUpdatesTimeline(updatesDir);
const summary = summarizeUpdatesTimeline(timeline);

if (timeline.length === 0) {
  throw new Error('Expected at least one update entry.');
}

if (!timeline.every((entry) => entry.title && entry.fileName)) {
  throw new Error('Expected every entry to include title and fileName.');
}

if (!timeline.every((entry) => Array.isArray(entry.sections) && entry.sections.length > 0)) {
  throw new Error('Expected every entry to expose parsed sections.');
}

console.log(JSON.stringify({ summary, firstEntry: timeline[0] }, null, 2));
