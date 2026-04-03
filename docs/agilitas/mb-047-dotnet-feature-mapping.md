# MB-047 .NET/OCI Feature Mapping to the Current Agilitas Stack

Date: 2026-04-03  
Source: `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer`

## Why this exists
MB-047 still had one unchecked migration step: map the existing .NET/OCI feature surface to the current Node/Python/GCP-hosted Agilitas architecture. This document closes that planning gap with file-level evidence from the local .NET codebase.

## Source components inspected
- `Agilitas.Data/FileProcessor.cs`
- `Agilitas.Data/TranscriptParsing/TranscriptParser.cs`
- `Agilitas.Data/Sentiment/SentimentAnalyzer.cs`
- `Agilitas.Data/OracleLanguageAiClient.cs`
- `Agilitas.Data/OracleGenerativeAiInferenceAiClient.cs`
- `Agilitas.Data/AgilitasDbContext.cs`
- `Agilitas.Data/Database/Mappings/*.cs`
- `SQL/1 Db initial script.sql`
- `SQL/2 Add emotions.sql`
- `SQL/3 Add Pain Points.sql`

## High-confidence mapping table

| Legacy .NET / OCI capability | Source evidence | Current MB target | Migration status | Notes |
| --- | --- | --- | --- | --- |
| Transcript parsing from raw call text into structured parts | `TranscriptParsing/TranscriptParser.cs` | `services/agilitas_ingestor/normalizer.py` + `src/agilitas/schemas/models.py`/`.ts` | Partially migrated | Current Python path normalizes Zoom JSON / Teams VTT / text, but the exact legacy header-and-speaker parser is not ported 1:1. |
| Transcript domain schema (`Transcript`, `TranscriptPart`, categories/issues) | `TranscriptData.cs`, DB model classes | `src/agilitas/schemas/models.py` and `.ts` | Migrated | Already captured by `migration/dotnet-extraction-log.md`. |
| Relational persistence for transcript requests, error log, emotions, pain points | `AgilitasDbContext.cs` + DB mappings + SQL scripts | `migration/sql-porting-script.sql` | Migrated as execution artifact | New script ports the MySQL/EF schema into Postgres-friendly DDL for Cloud SQL. |
| Aspect-level sentiment analysis via OCI Language | `Sentiment/SentimentAnalyzer.cs` + `OracleLanguageAiClient.cs` | `services/agilitas-ai-core/extractor.py` | Adapted, not parity-complete | Current extractor returns overall sentiment/emotion/effort and supports deterministic fallback. It does **not** yet reproduce OCI's aspect-level sentiment response shape. |
| LLM extraction of emotions, pain points, extra info | `FileProcessor.cs` using `OracleGenerativeAiInferenceAiClient` | `services/agilitas-ai-core/extractor.py` + `services/agilitas-business-engine/scoring_engine.py` + `services/agilitas-action-engine/generator.py` | Migrated conceptually | Current stack splits one monolithic step into extraction, deterministic scoring, and action generation. |
| OCI Generative AI chat completion | `OracleGenerativeAiInferenceAiClient.cs` | `services/agilitas-ai-core/llm_client.py` | Migrated with provider swap | OCI provider replaced by Ollama and Vertex AI adapters. This is the clean benchmark seam for future Oracle re-add if wanted. |
| OCI object storage ingest / move-to-success / move-to-failed flow | `FileProcessor.cs` + `OCI.Tools/Storage/*` | Not yet ported in current repo | Gap | Current repo proves local file-based QA flows, not OCI event/object storage ingestion parity. |
| Batch processing of multiple transcripts | `FileProcessor.ProcessNewFileFromStorageAsync()` | `services/agilitas_ingestor/batch_processor.py` | Migrated | MB-092 now covers multi-file batch transcript runs. |
| PII/privacy processing | not explicit in .NET source reviewed | `services/agilitas-ai-core/redaction/presidio_redactor.py` | Improved beyond source | Current stack adds explicit PII redaction layer before extraction. |

## Recommended target architecture by legacy feature

### 1. TranscriptParser.cs
**Keep in Python.**
- Best home: `services/agilitas_ingestor/normalizer.py`
- Reason: transcript ingestion/normalization is already Python-first.
- Follow-up if parity is needed: add a `normalize_legacy_plaintext()` path that matches the legacy regex behavior for:
  - `Date:` / `Time:` / `Agent:` / `Customer:` headers
  - `[system prompt]`, `Agent:`, `Customer:` sections
  - `customerTranscript` derivation from customer-only parts

### 2. SentimentAnalyzer.cs + OracleLanguageAiClient.cs
**Keep the public contract in Python, not OCI-specific C#.**
- Best home: `services/agilitas-ai-core/extractor.py`
- Provider targets:
  - local/private: Ollama via `llm_client.py`
  - cloud/high-reasoning: Vertex AI via `llm_client.py`
  - offline safety: deterministic fallback already exists
- Honest gap:
  - OCI's aspect-level sentiment (`document + aspects + scores`) is richer than the current extractor output.
  - If parity matters, add an optional `aspects` array to the Python extraction result and backfill it with model/deterministic logic.

### 3. OracleGenerativeAiInferenceAiClient.cs
**Do not port as OCI-specific code. Port the interface seam only.**
- Best home: existing `services/agilitas-ai-core/llm_client.py`
- Current equivalent behavior:
  - prompt in
  - provider-specific call
  - text out
- Benchmarking hook:
  - If Oracle benchmarking becomes worthwhile later, add an `oracle` provider to `AgilitasLLMClient.complete()` rather than rebuilding a separate .NET service.

### 4. FileProcessor.cs orchestration
**Split responsibility across current services instead of recreating the old monolith.**
- Legacy file processor responsibilities:
  1. read transcript from storage
  2. insert request record
  3. parse transcript
  4. get emotions
  5. get pain points
  6. get extra info
  7. save results
  8. move source object to success/failed path
- Current target split:
  - ingest/normalize: `services/agilitas_ingestor/normalizer.py` / `batch_processor.py`
  - extract AI dimensions: `services/agilitas-ai-core/extractor.py`
  - deterministic business logic: `services/agilitas-business-engine/scoring_engine.py`
  - recommended actions: `services/agilitas-action-engine/generator.py`
  - persistence/bootstrap: `migration/sql-porting-script.sql`

## OCI-specific features worth retaining only as ideas

### Keep as portable product ideas
- Aspect-level sentiment breakdown
- Structured JSON extraction contracts
- Provider abstraction between local/cloud models
- Storage-triggered pipeline entrypoint

### Do **not** carry forward as hard dependencies
- OCI object storage SDK coupling
- OCI auth/environment assumptions
- OCI-specific generative inference client wrappers
- .NET EF mapping layer as the canonical domain source

## Decision summary
1. **Cloud SQL relational schema is worth preserving.** It is now captured in `migration/sql-porting-script.sql`.
2. **OCI client implementations are not worth porting verbatim.** The modern seam is `llm_client.py` with pluggable providers.
3. **Transcript parsing should stay Python-side.** If exact old behavior matters, port only the parser logic, not the whole .NET service shape.
4. **The old monolithic file processor should remain decomposed.** Current MB services are cleaner and more testable.

## MB-047 completion claim supported by this file
This mapping document is sufficient to mark the card step **"Map existing .NET/OCI features to the new GCP-hosted AI-Core"** complete, with one explicit caveat: aspect-level OCI sentiment parity is still a product enhancement opportunity, not a blocker for the migration-track documentation task.
