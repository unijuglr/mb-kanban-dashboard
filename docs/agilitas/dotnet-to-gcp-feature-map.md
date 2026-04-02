# Agilitas .NET / OCI -> GCP AI-Core + Motherbrain feature map

Created: 2026-04-02  
Related card: MB-047

## Goal
Map the useful, already-working behavior from the legacy `AgilitasTranscriptAnalyzer` .NET/OCI implementation into the current repo architecture without dragging OCI-specific assumptions forward.

## Sources inspected
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/TranscriptParsing/TranscriptParser.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Sentiment/SentimentAnalyzer.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/OracleGenerativeAiInferenceAiClient.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/AgilitasDbContext.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/*.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/*.sql`
- `docs/agilitas/ai-strategy.md`
- `docs/agilitas/motherbrain-local-stack-plan.md`
- `docs/cards/MB-046-agilitas-gcp-prototype.md`
- `src/agilitas/schemas/models.ts`
- `src/agilitas/schemas/models.py`

## Executive summary
The legacy system breaks into four reusable layers:
1. transcript normalization/parsing
2. AI inference over transcript text
3. relational persistence for requests, emotions, and pain points
4. orchestration/runtime concerns tied to OCI and .NET hosting

For the new stack, the right move is to preserve layers 1-3 semantically while replacing layer 4 with:
- **GCP-hosted AI-Core** for cloud reasoning and demo hosting
- **Motherbrain-local execution** for low-cost private processing
- **Cloud SQL + optional Neo4j** instead of direct carry-forward of the original MySQL-ish schema

## Feature map

| Legacy .NET / OCI feature | Source evidence | Current/new home | Migration decision |
|---|---|---|---|
| `TranscriptParser.Parse()` extracts metadata and conversation parts from raw transcript text | `TranscriptParser.cs` | `services/agilitas_ingestor/normalizer.py` + repo transcript schema | Keep behavior, but normalize across Zoom/Teams/plain text instead of one parser entrypoint |
| `Transcript`, `TranscriptPart`, `TranscriptPartType` domain model | `TranscriptData.cs`, `TranscriptPart.cs`, `TranscriptPartType.cs` | `src/agilitas/schemas/models.ts` and `src/agilitas/schemas/models.py` | Already ported; preserve as canonical interchange schema |
| `SentimentAnalyzer` calling Oracle AI Language for full transcript or customer-only text | `SentimentAnalyzer.cs` | `services/agilitas-ai-core/extractor.py` plus local/cloud provider switch | Preserve the analysis mode idea; provider becomes Vertex AI or Ollama-backed extraction instead of Oracle sentiment APIs |
| Oracle Generative AI chat client | `OracleGenerativeAiInferenceAiClient.cs` | `services/agilitas-ai-core/llm_client.py` and future GCP adapter | Replace OCI SDK client entirely; keep message-oriented inference boundary |
| Reference tables for emotions and pain points | `SQL/2 Add emotions.sql`, `SQL/3 Add Pain Points.sql`, EF mapping files | Cloud SQL seed data in `migration/sql-porting-script.sql` | Preserve vocabulary and relationships; fix SQL defects and convert to PostgreSQL/Cloud SQL |
| Transcript request + error log persistence | `SQL/1 Db initial script.sql`, `AgilitasDbContext.cs`, `TranscriptRequest*.cs` | Cloud SQL operational tables | Preserve table intent and enum semantics; rename to snake_case for new stack |
| Join entities linking transcripts to emotions/pain points | `TranscriptRequestEmotionMap.cs`, `TranscriptRequestPainPointMap.cs` | Cloud SQL joins and optional Neo4j edges | Keep both: SQL for durability/reporting, graph for traversal/pattern analysis |
| OCI auth, compartment, model IDs, SDK transport | `OracleGenerativeAiInferenceAiClient.cs` | GCP Secret Manager / Vertex auth for cloud; local Ollama config for Motherbrain | Drop OCI-specific infrastructure completely |
| Azure/Function-host style ingestion runtime | `Agilitas.FileProcessor.Function/*` | local runner + future Cloud Run/GKE | Replace hosting/runtime, keep pipeline intent |

## Recommended target architecture by concern

### 1) Transcript ingest + normalization
**Legacy behavior to preserve**
- Extract `dateTime`, `agent`, `customer`, `fullTranscript`, `customerTranscript`, `parts`
- Support customer-only analysis paths

**New placement**
- `services/agilitas_ingestor/normalizer.py`
- `src/agilitas/schemas/models.py`
- `src/agilitas/schemas/models.ts`

**Why**
The repo already treats normalized transcript data as the stable contract. That is the correct successor to the .NET parser models.

### 2) AI extraction / sentiment / reasoning
**Legacy behavior to preserve**
- Analyze either full transcript or customer-only transcript
- Return structured sentiment-like output, not just free text
- Use a provider abstraction instead of baking prompt logic into callers

**New placement**
- Cloud path: GCP-hosted AI-Core on Vertex/Gemini per `docs/agilitas/ai-strategy.md` and MB-046
- Local/private path: Motherbrain via Ollama per `docs/agilitas/motherbrain-local-stack-plan.md`
- Shared contract: 7-dimension extraction JSON

**Decision**
Do **not** port Oracle SDK logic. Port only the inference boundary and the structured-output expectation.

### 3) Data persistence
**Legacy behavior to preserve**
- durable transcript request record
- durable processing/error log
- seeded reference vocabulary for emotions and pain points
- many-to-many links between transcript requests and extracted labels

**New placement**
- Cloud SQL as the system-of-record relational store
- Neo4j as an optional projection for relationship-heavy exploration

**Decision**
Use Cloud SQL tables for transactional truth. Project into Neo4j only when graph queries add value.

### 4) Runtime/orchestration
**Legacy behavior to preserve**
- asynchronous-ish processing pipeline from input transcript -> analysis -> persistence

**New placement**
- local runner / direct Python execution first
- Cloud Run / GKE later for demoable hosted flow

**Decision**
Preserve the pipeline sequence, not the .NET/Azure/OCI hosting shape.

## Concrete mapping: old entities to new stores

### Cloud SQL tables
| Legacy entity | New table | Notes |
|---|---|---|
| `TranscriptRequests` | `transcript_requests` | Keep status + insert time |
| `ErrorLog` | `error_log` | Keep operation enum semantics |
| `Emotions` | `emotions` | Seeded reference table |
| `TranscriptRequestEmotions` | `transcript_request_emotions` | Join table |
| `PainPointCategories` | `pain_point_categories` | Seeded reference table |
| `PainPointIssues` | `pain_point_issues` | Join to category |
| `TranscriptRequestPainPoints` | `transcript_request_pain_points` | Join table |

### Optional Neo4j projection
| Cloud SQL concept | Neo4j projection |
|---|---|
| transcript request | `(:Transcript {id, file_name, status, insert_time})` |
| emotion assignment | `(:Transcript)-[:HAS_EMOTION]->(:Emotion)` |
| pain-point issue assignment | `(:Transcript)-[:HAS_PAIN_POINT]->(:PainPointIssue)` |
| issue-to-category hierarchy | `(:PainPointIssue)-[:IN_CATEGORY]->(:PainPointCategory)` |

## Specific legacy observations worth keeping
1. **Customer-only analysis is intentional, not incidental.**  
   The .NET `SentimentAnalyzer` explicitly supports `UserOnly`. Preserve that switch in the new extractor path because it reduces agent-noise contamination.

2. **The SQL seed lists are business assets.**  
   The emotion and pain-point vocabularies are not random scaffolding; they are part of the original domain design and should be treated as canonical starting taxonomy.

3. **The old SQL scripts are not migration-ready as written.**  
   The legacy pain-point script incorrectly uses single quotes around `IsPredefined`, which would break on a real migration path. The repo-local migration artifact fixes that rather than cargo-culting broken SQL.

4. **OCI implementation detail should be discarded aggressively.**  
   The valuable part is the message-oriented structured inference boundary, not the OCI SDK, compartment IDs, or credential model.

## Recommended next follow-on implementation after MB-047
1. add a Cloud SQL migration runner for `migration/sql-porting-script.sql`
2. add a tiny ingestion proof that writes one normalized transcript row plus linked pain points/emotions
3. add a provider adapter layer that exposes the old full-transcript vs customer-only analysis choice explicitly
4. project a small subset of transcript/emotion/pain-point links into Neo4j only if graph analysis is needed for a demo or OLN-style querying

## Out of scope for this card
- live Cloud SQL deployment
- Vertex AI implementation
- OCI benchmark execution
- DTS / Rockler-specific mapping
