# OLN Neo4j on Motherbrain — Live Proof Attempt (2026-04-03)

Owner: Prime Sam  
Scope: MB-087 and MB-088 only, excluding DTS.

## Outcome
Live OLN proof is still **blocked by Motherbrain Docker daemon availability**.

What was confirmed honestly:
- the real OLN volume root on Motherbrain is `/Volumes/hellastuff 1/oln`
- `/Volumes/hellastuff/oln` does not exist
- required ports `7474` and `7687` were free before startup attempt
- Docker CLI and Compose plugin are installed on Motherbrain
- the repo-side boot path still fails at the host layer because the Docker daemon is not running

Because Neo4j never came up, schema application, ingest, proof queries, and idempotence rerun could not complete.

## Commands run
### 1. Inspect host and choose the real OLN root
```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 darthg@motherbrain.local '
  echo "HOST=$(hostname)";
  echo "DOCKER=$(command -v docker || true)";
  echo "COMPOSE_V=$(docker compose version 2>/dev/null || true)";
  echo "VOLUMES:";
  ls -ld /Volumes/hellastuff /Volumes/"hellastuff 1" /Volumes/hellastuff/oln /Volumes/"hellastuff 1"/oln /Volumes/external-logs 2>&1 || true
'
```

Observed:
```text
HOST=MotherBrain.local
DOCKER=/usr/local/bin/docker
COMPOSE_V=
VOLUMES:
ls: /Volumes/hellastuff/oln: No such file or directory
drwxr-xr-x@  6 darthg  staff   192 Apr  2 12:32 /Volumes/external-logs
drwxr-xr-x   3 root    wheel    96 Mar  3 11:04 /Volumes/hellastuff
drwxrwxrwx@ 48 darthg  staff  1536 Apr  2 12:32 /Volumes/hellastuff 1
drwxrwxrwx   4 darthg  staff   128 Apr  2 12:32 /Volumes/hellastuff 1/oln
```

Conclusion: use `/Volumes/hellastuff 1/oln`.

### 2. Verify Docker tooling and free ports
```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 darthg@motherbrain.local \
  'docker --version; docker-compose --version 2>/dev/null || true; docker compose version 2>/dev/null || true'

ssh -o BatchMode=yes darthg@motherbrain.local 'lsof -i :7474 || true; echo ---; lsof -i :7687 || true'
```

Observed:
```text
Docker version 27.4.0, build bde2b89
Docker Compose version v2.31.0-desktop.2
```

Observed for port check:
```text
---
```

Conclusion: tooling exists; ports were free.

### 3. Stage the exact compose/setup/schema payload on Motherbrain
A temporary proof workspace was created at `/tmp/mb-087-088-proof` and populated with:
- `infra/motherbrain/docker-compose.yaml`
- `infra/motherbrain/setup.sh`
- `infra/neo4j/schema.cypher`
- `infra/motherbrain/oln.env`

First env attempt used:
```text
OLN_BASE_VOLUME=/Volumes/hellastuff 1/oln
```

Compose rejected that path shape because the env-file value contains spaces.

### 4. Retry with a space-free symlink target
```bash
ssh -o BatchMode=yes darthg@motherbrain.local '
  ln -sfn "/Volumes/hellastuff 1/oln" /tmp/oln-proof-volume
  printf "OLN_BASE_VOLUME=/tmp/oln-proof-volume\n" > /tmp/mb-087-088-proof/infra/motherbrain/oln.env
  cd /tmp/mb-087-088-proof
  bash infra/motherbrain/setup.sh
  docker compose --env-file infra/motherbrain/oln.env -f infra/motherbrain/docker-compose.yaml up -d neo4j
  echo "--- LOGS ---"
  docker logs oln-neo4j --tail 120
  echo "--- SCHEMA ---"
  docker exec -i oln-neo4j cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher
'
```

Observed setup output before failure:
```text
OLN_BASE_VOLUME=/tmp/oln-proof-volume
```

Observed blocker output:
```text
Cannot connect to the Docker daemon at unix:///Users/motherbrain/.docker/run/docker.sock. Is the docker daemon running?
Cannot connect to the Docker daemon at unix:///Users/motherbrain/.docker/run/docker.sock. Is the docker daemon running?
```

### 5. Verify daemon context reality
```bash
ssh -o BatchMode=yes darthg@motherbrain.local '
  whoami
  echo HOME=$HOME
  id
  env | egrep "DOCKER|HOME" || true
  docker context ls || true
  ls -ld /var/run/docker.sock /Users/darthg/.docker/run/docker.sock /Users/motherbrain/.docker/run/docker.sock 2>&1 || true
'
```

Observed:
```text
darthg
HOME=/Users/darthg
uid=502(darthg) gid=20(staff) groups=20(staff),12(everyone),61(localaccounts),79(_appserverusr),80(admin),81(_appserveradm),704(com.apple.sharepoint.group.4),706(com.apple.sharepoint.group.6),702(com.apple.sharepoint.group.2),33(_appstore),98(_lpadmin),100(_lpoperator),204(_developer),250(_analyticsusers),395(com.apple.access_ftp),398(com.apple.access_screensharing-disabled),399(com.apple.access_ssh-disabled),400(com.apple.access_remote_ae),701(com.apple.sharepoint.group.1),705(com.apple.sharepoint.group.5),703(com.apple.sharepoint.group.3)
HOME=/Users/darthg
NAME              DESCRIPTION                               DOCKER ENDPOINT                                     ERROR
default           Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                         
desktop-linux *   Docker Desktop                            unix:///Users/motherbrain/.docker/run/docker.sock   
lrwxr-xr-x  1 darthg       staff   42 Apr  2 13:28 /Users/darthg/.docker/run/docker.sock -> /Users/motherbrain/.docker/run/docker.sock
srw-rw-rw-@ 1 motherbrain  staff    0 Mar  8 20:36 /Users/motherbrain/.docker/run/docker.sock
lrwxr-xr-x  1 root         daemon  42 Mar 23 08:01 /var/run/docker.sock -> /Users/motherbrain/.docker/run/docker.sock
```

And direct daemon checks still failed:
```bash
ssh -o BatchMode=yes darthg@motherbrain.local 'docker --context default ps 2>&1 || true; echo ---; docker ps 2>&1 || true'
```

Observed:
```text
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
---
Cannot connect to the Docker daemon at unix:///Users/motherbrain/.docker/run/docker.sock. Is the docker daemon running?
```

## Honest status by card
### MB-087
Blocked at host runtime. Real OLN root was identified, but Neo4j could not be started because Motherbrain's Docker daemon was unavailable.

### MB-088
Still blocked on MB-087. No live Neo4j meant:
- schema could not be applied
- `scripts/run_oln_local_ingest.py` was not run against a live graph
- Luke/Tatooine proof queries could not be executed
- idempotence rerun could not be performed

## Durable next step
On Motherbrain itself, get Docker Desktop / daemon running first, then rerun exactly:
```bash
cd /tmp/mb-087-088-proof
bash infra/motherbrain/setup.sh
docker compose --env-file infra/motherbrain/oln.env -f infra/motherbrain/docker-compose.yaml up -d neo4j
docker logs oln-neo4j --tail 120
docker exec -i oln-neo4j cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher
```

Once Neo4j is genuinely up, run from the real repo checkout:
```bash
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
python3 scripts/run_oln_local_ingest.py --sample data/oln/samples/wookieepedia-test.xml
```
Then run the proof queries from `docs/oln/motherbrain-first-ingest-runbook.md` and save the outputs beside this file.
