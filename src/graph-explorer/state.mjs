import { DEFAULT_GRAPH_INTENT_MODE, sanitizeIntentMode } from './scoring.mjs';

export const GRAPH_EXPLORER_STORAGE_KEY = 'mb.graphExplorer.v1';

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function sanitizePersistedGraphState(value, graph) {
  const allowedIds = new Set((graph?.nodes || []).map((node) => node.id));
  const selectedId = nonEmptyString(value?.selectedId);
  const searchQuery = typeof value?.searchQuery === 'string' ? value.searchQuery.slice(0, 200) : '';
  const intentMode = sanitizeIntentMode(value?.intentMode);
  return {
    selectedId: selectedId && allowedIds.has(selectedId) ? selectedId : null,
    searchQuery,
    intentMode,
    hasStoredContext: Boolean((selectedId && allowedIds.has(selectedId)) || searchQuery || intentMode !== DEFAULT_GRAPH_INTENT_MODE)
  };
}

export function serializeGraphState({ selectedId = null, searchQuery = '', intentMode = DEFAULT_GRAPH_INTENT_MODE } = {}) {
  return {
    selectedId: nonEmptyString(selectedId),
    searchQuery: typeof searchQuery === 'string' ? searchQuery.slice(0, 200) : '',
    intentMode: sanitizeIntentMode(intentMode)
  };
}

export function resolveInitialGraphState({ graph, urlSelectedId = null, urlIntentMode = null, persistedState = null } = {}) {
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
  const intentMode = sanitizeIntentMode(urlIntentMode || safePersisted.intentMode || starter.intentMode || DEFAULT_GRAPH_INTENT_MODE);
  const starterMode = !deepLinkedId && !safePersisted.hasStoredContext && !searchQuery;

  return {
    selectedId,
    searchQuery,
    intentMode,
    starterMode,
    starterNodeIds,
    source: deepLinkedId ? 'deep-link' : safePersisted.hasStoredContext ? 'persisted' : 'starter'
  };
}
