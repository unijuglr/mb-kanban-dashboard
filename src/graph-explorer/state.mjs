export const GRAPH_EXPLORER_STORAGE_KEY = 'mb.graphExplorer.v1';

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function sanitizePersistedGraphState(value, graph) {
  const allowedIds = new Set((graph?.nodes || []).map((node) => node.id));
  const selectedId = nonEmptyString(value?.selectedId);
  const searchQuery = typeof value?.searchQuery === 'string' ? value.searchQuery.slice(0, 200) : '';
  return {
    selectedId: selectedId && allowedIds.has(selectedId) ? selectedId : null,
    searchQuery,
    hasStoredContext: Boolean((selectedId && allowedIds.has(selectedId)) || searchQuery)
  };
}

export function serializeGraphState({ selectedId = null, searchQuery = '' } = {}) {
  return {
    selectedId: nonEmptyString(selectedId),
    searchQuery: typeof searchQuery === 'string' ? searchQuery.slice(0, 200) : ''
  };
}

export function resolveInitialGraphState({ graph, urlSelectedId = null, persistedState = null } = {}) {
  const allowedIds = new Set((graph?.nodes || []).map((node) => node.id));
  const starter = graph?.starter || {};
  const safePersisted = sanitizePersistedGraphState(persistedState, graph);
  const deepLinkedId = nonEmptyString(urlSelectedId);
  const starterSelectedId = nonEmptyString(starter.selectedId);
  const starterNodeIds = Array.isArray(starter.nodeIds)
    ? starter.nodeIds.filter((nodeId) => allowedIds.has(nodeId))
    : [];

  const selectedId = (deepLinkedId && allowedIds.has(deepLinkedId) && deepLinkedId)
    || safePersisted.selectedId
    || (starterSelectedId && allowedIds.has(starterSelectedId) && starterSelectedId)
    || graph?.nodes?.[0]?.id
    || null;

  const searchQuery = safePersisted.searchQuery;
  const starterMode = !deepLinkedId && !safePersisted.hasStoredContext && !searchQuery;

  return {
    selectedId,
    searchQuery,
    starterMode,
    starterNodeIds,
    source: deepLinkedId ? 'deep-link' : safePersisted.hasStoredContext ? 'persisted' : 'starter'
  };
}
