export const GRAPH_INTENT_MODES = ['facts', 'story', 'relationships', 'debug'];
export const DEFAULT_GRAPH_INTENT_MODE = 'facts';

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export function sanitizeIntentMode(value) {
  return GRAPH_INTENT_MODES.includes(value) ? value : DEFAULT_GRAPH_INTENT_MODE;
}

function buildDegreeMap(graph) {
  const degreeById = new Map((graph?.nodes || []).map((node) => [node.id, 0]));
  for (const edge of graph?.edges || []) {
    degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
  }
  return degreeById;
}

function starterSet(graph) {
  return new Set(Array.isArray(graph?.starter?.nodeIds) ? graph.starter.nodeIds : []);
}

function nodeReasons(node, { degree, starter, selectedId, query }) {
  const q = String(query || '').trim().toLowerCase();
  const haystack = [node.label, node.type, node.group, JSON.stringify(node.properties || {})].join(' ').toLowerCase();
  return {
    degree,
    starter: starter.has(node.id) ? 1 : 0,
    primary: node.group === 'primary' ? 1 : 0,
    linked: node.group === 'linked' ? 1 : 0,
    proof: node.group === 'proof' ? 1 : 0,
    verified: node.properties?.lukeOrTatooineSlice ? 1 : 0,
    selected: node.id === selectedId ? 1 : 0,
    searchHit: q && haystack.includes(q) ? 1 : 0,
    storyBias: /skywalker|tatooine|star wars/i.test([node.label, node.type, JSON.stringify(node.properties || {})].join(' ')) ? 1 : 0
  };
}

function edgeReasons(edge, { degreeById, starter, selectedId }) {
  return {
    selected: edge.source === selectedId || edge.target === selectedId ? 1 : 0,
    verified: edge.emphasis === 'verified' || edge.type === 'VERIFIES' ? 1 : 0,
    mentions: edge.type === 'MENTIONS' ? 1 : 0,
    verifies: edge.type === 'VERIFIES' ? 1 : 0,
    starter: starter.has(edge.source) && starter.has(edge.target) ? 1 : 0,
    connectivity: (degreeById.get(edge.source) || 0) + (degreeById.get(edge.target) || 0)
  };
}

function scoreNodeForIntent(intentMode, reasons) {
  switch (intentMode) {
    case 'story':
      return reasons.degree * 1.2 + reasons.storyBias * 5 + reasons.primary * 3 + reasons.linked * 2 + reasons.starter * 1.5 + reasons.searchHit * 2 + reasons.selected * 2;
    case 'relationships':
      return reasons.degree * 2.5 + reasons.selected * 4 + reasons.searchHit * 2 + reasons.starter + reasons.primary;
    case 'debug':
      return reasons.degree * 2 + reasons.proof * 4 + reasons.verified * 3 + reasons.selected * 2 + reasons.searchHit;
    case 'facts':
    default:
      return reasons.verified * 5 + reasons.proof * 4 + reasons.primary * 3 + reasons.starter * 2 + reasons.degree * 1.1 + reasons.searchHit * 2 + reasons.selected * 2;
  }
}

function scoreEdgeForIntent(intentMode, reasons) {
  switch (intentMode) {
    case 'story':
      return reasons.mentions * 4 + reasons.starter * 2 + reasons.selected * 2 + reasons.connectivity * 0.8;
    case 'relationships':
      return reasons.selected * 5 + reasons.connectivity * 1.5 + reasons.mentions * 3 + reasons.verifies * 1;
    case 'debug':
      return reasons.verifies * 5 + reasons.verified * 3 + reasons.connectivity * 1.2 + reasons.selected * 1.5;
    case 'facts':
    default:
      return reasons.verified * 5 + reasons.verifies * 3 + reasons.selected * 2 + reasons.starter * 2 + reasons.connectivity * 0.8;
  }
}

export function rankGraphForIntent(graph, { intentMode = DEFAULT_GRAPH_INTENT_MODE, selectedId = null, query = '' } = {}) {
  const safeIntent = sanitizeIntentMode(intentMode);
  const degreeById = buildDegreeMap(graph);
  const starter = starterSet(graph);

  const rankedNodes = (graph?.nodes || []).map((node) => {
    const reasons = nodeReasons(node, {
      degree: degreeById.get(node.id) || 0,
      starter,
      selectedId,
      query
    });
    return {
      id: node.id,
      label: node.label,
      score: round(scoreNodeForIntent(safeIntent, reasons)),
      reasons
    };
  }).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  const rankedEdges = (graph?.edges || []).map((edge) => {
    const reasons = edgeReasons(edge, { degreeById, starter, selectedId });
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      score: round(scoreEdgeForIntent(safeIntent, reasons)),
      reasons
    };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const visibleNodeLimit = safeIntent === 'debug' ? graph?.nodes?.length || 0 : safeIntent === 'relationships' ? 8 : 6;
  const visibleNodeIds = rankedNodes.slice(0, visibleNodeLimit).map((node) => node.id);

  return {
    intentMode: safeIntent,
    visibleNodeLimit,
    selectedId,
    query,
    rankedNodes,
    rankedEdges,
    visibleNodeIds,
    rankingSummary: {
      topNodeIds: rankedNodes.slice(0, 3).map((node) => node.id),
      topEdgeIds: rankedEdges.slice(0, 3).map((edge) => edge.id)
    }
  };
}
