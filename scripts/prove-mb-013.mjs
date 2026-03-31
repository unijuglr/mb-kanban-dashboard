import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoardReadModel } from '../src/board-read-model.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const model = loadBoardReadModel(rootDir);

if (!Array.isArray(model.board) || model.board.length !== model.statusOrder.length) {
  throw new Error('Expected board columns to match status order.');
}

if (model.summary.cardCount !== model.cards.length) {
  throw new Error('Card summary count mismatch.');
}

if (model.summary.decisionCount !== model.decisions.length) {
  throw new Error('Decision summary count mismatch.');
}

if (model.summary.updateCount !== model.updates.length) {
  throw new Error('Update summary count mismatch.');
}

console.log(JSON.stringify({
  generatedAt: model.generatedAt,
  summary: model.summary,
  board: model.board.map((column) => ({
    status: column.status,
    count: column.cards.length,
    cards: column.cards.map((card) => card.id)
  })),
  decisions: model.decisions.map((decision) => ({
    id: decision.id,
    title: decision.title,
    status: decision.status
  })),
  updates: model.updates.map((update) => ({
    id: update.id,
    date: update.date,
    title: update.title
  }))
}, null, 2));
