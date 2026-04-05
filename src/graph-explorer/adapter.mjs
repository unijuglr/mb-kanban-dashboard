import fs from 'node:fs';
import path from 'node:path';

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCardMeta(markdown) {
  const readField = (label) => {
    const match = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'));
    return match ? match[1].trim() : 'Unknown';
  };
  return {
    id: ((markdown.split('\n')[0] || '').replace(/^#\s*/, '').split('—')[0] || '').trim() || 'MB-088',
    status: readField('Status'),
    updatedAt: readField('Last Updated')
  };
}

export function loadGraphExplorerModel(rootDir) {
  const proofPath = path.join(rootDir, 'docs', 'oln', 'proofs', 'mb-080-two-page-local-proof-2026-04-03.json');
  const mb088CardPath = path.join(rootDir, 'docs', 'cards', 'MB-088-oln-two-page-ingest-proof-into-local-neo4j.md');
  const proof = safeReadJson(proofPath) || {};
  const offline = proof.offline_contract_proof || {};
  const liveProbe = proof.live_neo4j_probe || {};
  const cardMeta = parseCardMeta(safeReadText(mb088CardPath));

  const nodes = [];
  const edges = [];
  const nodeById = new Map();
  const addNode = (node) => {
    if (!node || !node.id) return;
    if (!nodeById.has(node.id)) {
      nodeById.set(node.id, node);
      nodes.push(node);
    }
  };
  const addEdge = (edge) => {
    if (!edge || !edge.source || !edge.target) return;
    const id = edge.id || `${edge.source}->${edge.target}:${edge.type || 'RELATES_TO'}`;
    if (!edges.find((item) => item.id === id)) edges.push({ ...edge, id });
  };

  const primaryTitles = Array.isArray(offline.primary_titles) ? offline.primary_titles : [];
  const linkTitleGroups = Array.isArray(offline.primary_link_titles) ? offline.primary_link_titles : [];

  primaryTitles.forEach((title, index) => {
    addNode({
      id: `entity:${slug(title)}`,
      key: title,
      label: title,
      type: 'Primary Entity',
      group: 'primary',
      source: 'MB-080 offline proof',
      franchise: 'Star Wars',
      rank: index,
      properties: {
        title,
        role: index === 0 ? 'focus entity' : 'secondary focus entity',
        proofArtifact: proofPath,
        lukeOrTatooineSlice: true
      }
    });
  });

  linkTitleGroups.forEach((titles, sourceIndex) => {
    const sourceTitle = primaryTitles[sourceIndex];
    const sourceId = `entity:${slug(sourceTitle)}`;
    (Array.isArray(titles) ? titles : []).forEach((title) => {
      const targetId = `entity:${slug(title)}`;
      addNode({
        id: targetId,
        key: title,
        label: title,
        type: 'Linked Entity',
        group: 'linked',
        source: 'MB-080 offline proof',
        franchise: 'Star Wars',
        properties: {
          title,
          linkedFrom: sourceTitle,
          proofArtifact: proofPath
        }
      });
      addEdge({
        source: sourceId,
        target: targetId,
        type: 'MENTIONS',
        sourceTitle,
        targetTitle: title,
        proof: 'offline_contract_proof.primary_link_titles'
      });
    });
  });

  if (primaryTitles.includes('Luke Skywalker') && primaryTitles.includes('Tatooine') && offline.luke_mentions_tatooine) {
    addEdge({
      source: 'entity:luke-skywalker',
      target: 'entity:tatooine',
      type: 'MENTIONS',
      proof: 'offline_contract_proof.luke_mentions_tatooine',
      emphasis: 'verified'
    });
  }

  addNode({
    id: 'proof:mb-088-card',
    key: cardMeta.id,
    label: cardMeta.id,
    type: 'Proof Card',
    group: 'proof',
    source: 'docs/cards',
    franchise: 'OLN',
    properties: {
      status: cardMeta.status,
      updatedAt: cardMeta.updatedAt,
      file: mb088CardPath
    }
  });

  primaryTitles.forEach((title) => {
    addEdge({
      source: 'proof:mb-088-card',
      target: `entity:${slug(title)}`,
      type: 'VERIFIES',
      proof: cardMeta.id
    });
  });

  const typeCounts = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    source: {
      mode: 'proof-artifact',
      proofPath,
      cardPath: mb088CardPath,
      liveProbeAttempted: Boolean(liveProbe.attempted),
      liveProbeReason: liveProbe.reason || null
    },
    starter: {
      id: 'starter:luke-tatooine-proof-slice',
      label: 'Luke / Tatooine starter slice',
      description: 'Curated default subgraph from the committed MB-080 + MB-088 proof artifacts.',
      selectedId: 'entity:luke-skywalker',
      nodeIds: ['entity:luke-skywalker', 'entity:tatooine', 'proof:mb-088-card']
    },
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      typeCounts,
      primaryCount: nodes.filter((node) => node.group === 'primary').length,
      linkedCount: nodes.filter((node) => node.group === 'linked').length
    },
    filters: {
      groups: [...new Set(nodes.map((node) => node.group))],
      types: [...new Set(nodes.map((node) => node.type))],
      sources: [...new Set(nodes.map((node) => node.source))]
    },
    nodes,
    edges
  };
}
