/**
 * Swarm adapter — proxies to the agent-foundry metrics-api.
 *
 * The metrics-api runs at FOUNDRY_API_URL (default http://127.0.0.1:51920).
 * This adapter fetches from it and returns structured objects for the
 * Swarm dashboard views.
 */

const FOUNDRY_API_URL = process.env.FOUNDRY_API_URL || 'http://127.0.0.1:51920';

async function fetchFoundry(path) {
  const url = `${FOUNDRY_API_URL}${path}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return { error: `HTTP ${resp.status}`, url };
    return await resp.json();
  } catch (err) {
    return { error: err.message, url, offline: true };
  }
}

export async function loadSwarmOverview() {
  const [health, latest, jobs, models, handlers] = await Promise.all([
    fetchFoundry('/health'),
    fetchFoundry('/resources/latest'),
    fetchFoundry('/jobs?limit=20&all=true'),
    fetchFoundry('/models/scorecard'),
    fetchFoundry('/handlers/scorecard'),
  ]);
  return { health, resources: latest, jobs, models, handlers };
}

export async function loadSwarmResources(hours = 24) {
  return fetchFoundry(`/resources/history?hours=${hours}`);
}

export async function loadSwarmJobs(all = true, limit = 50) {
  return fetchFoundry(`/jobs?limit=${limit}&all=${all}`);
}

export async function loadSwarmJobDetail(jobId) {
  return fetchFoundry(`/jobs/${jobId}`);
}

export async function loadSwarmJobArtifact(jobId) {
  return fetchFoundry(`/jobs/${jobId}/artifact`);
}

export async function loadSwarmModels() {
  return fetchFoundry('/models/scorecard');
}

export async function loadSwarmHandlers() {
  return fetchFoundry('/handlers/scorecard');
}

export async function approveSwarmJob(jobId, by = 'adam') {
  return fetchFoundry(`/jobs/${jobId}/approve?by=${by}`);
}

export async function rejectSwarmJob(jobId) {
  return fetchFoundry(`/jobs/${jobId}/reject`);
}
