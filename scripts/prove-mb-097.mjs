import { loadGraphExplorerModel } from '../src/graph-explorer/adapter.mjs';
import { rankGraphForIntent } from '../src/graph-explorer/scoring.mjs';

function bfsPath(graph, startId, targetId) {
  const neighbors = new Map();
  for (const edge of graph.edges) {
    if (!neighbors.has(edge.source)) neighbors.set(edge.source, []);
    if (!neighbors.has(edge.target)) neighbors.set(edge.target, []);
    neighbors.get(edge.source).push({ nodeId: edge.target });
    neighbors.get(edge.target).push({ nodeId: edge.source });
  }

  const queue = [[startId]];
  const seen = new Set([startId]);
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === targetId) return path;
    for (const neighbor of (neighbors.get(current) || [])) {
      if (!seen.has(neighbor.nodeId)) {
        seen.add(neighbor.nodeId);
        queue.push([...path, neighbor.nodeId]);
      }
    }
  }
  return null;
}

const root = process.cwd();
const model = loadGraphExplorerModel(root);
const start = 'entity:luke-skywalker';
const target = 'entity:tatooine';

console.log('Testing MB-097 Pathfinding Logic...');
const path = bfsPath(model, start, target);

if (path && path.length > 1) {
  console.log('✅ Path found:', path.join(' -> '));
} else {
  console.error('❌ Pathfinding failed between', start, 'and', target);
  process.exit(1);
}

const ranking = rankGraphForIntent(model, { intentMode: 'path', selectedId: start });
if (ranking.intentMode === 'path' && ranking.visibleNodeLimit === model.nodes.length) {
  console.log('✅ Path intent mode ranking verified (adaptive expansion works).');
} else {
  console.error('❌ Path intent mode ranking mismatch.');
  process.exit(1);
}

console.log('✅ MB-097 Logic Proof Passed.');
