# Motherbrain dev-readiness checklist

Purpose: unblock coders working on both OLN and Agilitas with one shared local-first preflight.

## 1) Host + access
- [ ] SSH access to `motherbrain.local` works for the assigned coder/operator.
- [ ] Repo is present on Motherbrain at the agreed path and on the expected branch.
- [ ] `openclaw gateway` status is known if remote agent work depends on it.
- [ ] If working from laptop, confirm the local tunnel to Motherbrain model runtime is alive when needed.

## 2) Docker baseline
- [ ] Docker Desktop / Docker Engine is installed and starts cleanly on Motherbrain.
- [ ] `docker ps` works without permission errors.
- [ ] Required images can start without port collisions:
  - OLN: Neo4j (`7474`, `7687`), Temporal (`7233`), Temporal UI (`8088`)
  - Agilitas: local service containers from `infra/agilitas/docker-compose.yaml`
- [ ] Compose files are the source of truth for local startup; no mystery manual containers left running.

## 3) Storage + paths
- [ ] Shared data volume choice is explicit before coding starts (`/Volumes/hellastuff` vs `/Volumes/hellastuff 1`).
- [ ] Required writable directories exist for OLN persistence:
  - `/Volumes/hellastuff/oln/neo4j/data`
  - `/Volumes/hellastuff/oln/neo4j/logs`
  - `/Volumes/hellastuff/oln/neo4j/import`
  - `/Volumes/hellastuff/oln/neo4j/plugins`
  - `/Volumes/hellastuff/oln/temporal/postgres-data`
- [ ] External log path exists if using host-level logs: `/Volumes/external-logs`.
- [ ] Free disk space is checked on the selected volume before large ingest/demo runs.

## 4) Model/runtime access
- [ ] Ollama on Motherbrain is reachable from the host.
- [ ] Container-to-model path is confirmed for Agilitas (`OLLAMA_HOST` currently expects host access).
- [ ] If using the laptop tunnel, `http://127.0.0.1:11435` responds before local coding work begins.
- [ ] The required local model names are agreed up front; do not let coders discover missing models mid-run.

## 5) Service healthchecks
- [ ] Neo4j accepts connections after startup.
- [ ] Temporal responds on `7233` and Temporal UI loads on `8088`.
- [ ] Agilitas containers boot without immediate dependency or import errors.
- [ ] Any required env file or inline env vars are present before the first run.

## 6) Logs + debugging surface
- [ ] Every shared service has one obvious first place to look for logs:
  - container logs via `docker logs` / compose logs
  - Neo4j logs under mounted log volume
  - host-level logs under `/Volumes/external-logs` when applicable
- [ ] A coder can answer within 2 minutes: which process failed, where its logs live, and what port/path it expected.
- [ ] Do not start implementation work until at least one success/failure log path has been verified for each stack.

## 7) Known blockers to clear first
- [ ] Motherbrain gateway persistence is still a known risk from MB-022; do not assume reboot-safe availability until verified.
- [ ] Storage root ambiguity (`hellastuff` vs `hellastuff 1`) must be resolved before hard-coding mounts or docs.
- [ ] Ollama/model path assumptions must be checked before container work, especially if model storage is being relocated.
- [ ] Port conflicts or stale containers must be cleared before asking coders to debug application code.

## 8) Minimum go/no-go rule
Coder work is unblocked only when all of the following are true:
- [ ] Docker starts the required shared services
- [ ] chosen storage paths are writable and have space
- [ ] model endpoint is reachable from the execution context
- [ ] logs are easy to find
- [ ] current blockers are written down, not tribal knowledge

## Project-specific note
- OLN and Agilitas should share this readiness baseline, then branch into their own runbooks for first ingest/demo execution.
- This checklist intentionally excludes DTS work and paid/cloud dependencies.
