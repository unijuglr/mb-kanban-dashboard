import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDecisionDirectory } from '../src/decision-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const decisionsDir = path.join(__dirname, '..', 'docs', 'decisions');

const decisions = await parseDecisionDirectory(decisionsDir);

const summary = decisions.map((decision) => ({
  id: decision.id,
  title: decision.title,
  status: decision.status,
  options: decision.optionsConsidered.length,
  followUps: decision.followUpTasks.length,
}));

console.log(JSON.stringify({ count: decisions.length, summary }, null, 2));
