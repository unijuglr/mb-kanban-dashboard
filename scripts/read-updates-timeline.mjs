import path from 'node:path';
import { readUpdatesTimeline, summarizeUpdatesTimeline } from '../src/updatesTimeline.js';

const updatesDir = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(process.cwd(), 'docs/updates');

const timeline = readUpdatesTimeline(updatesDir);
const summary = summarizeUpdatesTimeline(timeline);

console.log(JSON.stringify({ summary, timeline }, null, 2));
