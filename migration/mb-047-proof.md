# MB-047 proof: Agilitas .NET migration refresh

Date: 2026-04-02
Branch target: `feat/mb-047-agilitas-migration-refresh`

## What was inspected
External read-only source tree:
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/1 Db initial script.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/2 Add emotions.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/3 Add Pain Points.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/AgilitasDbContext.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/TranscriptRequestMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/EmotionMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/PainPointCategoryMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/PainPointIssueMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/TranscriptRequestEmotionMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/TranscriptRequestPainPointMap.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/TranscriptParsing/TranscriptParser.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Sentiment/SentimentAnalyzer.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/OracleGenerativeAiInferenceAiClient.cs`

Repo sources inspected:
- `docs/cards/MB-047-agilitas-migration-track.md`
- `migration/dotnet-extraction-log.md`
- `docs/agilitas/ai-strategy.md`
- `docs/agilitas/motherbrain-local-stack-plan.md`
- `docs/cards/MB-046-agilitas-gcp-prototype.md`
- `src/agilitas/schemas/models.ts`
- `src/agilitas/schemas/models.py`

## What was produced
1. `migration/sql-porting-script.sql`
   - durable Cloud SQL/PostgreSQL migration artifact
   - preserves the .NET schema intent
   - fixes legacy SQL defects
   - includes seed data for emotions and pain points

2. `docs/agilitas/dotnet-to-gcp-feature-map.md`
   - maps .NET/OCI features to current GCP-hosted AI-Core + Motherbrain architecture
   - separates what should be preserved from what should be replaced

3. `migration/mb-047-proof.md`
   - this proof log and evidence summary

## Evidence highlights
### Legacy SQL defect found and corrected
In legacy `SQL/3 Add Pain Points.sql`, `IsPredefined` is incorrectly single-quoted in two table definitions:
- `'IsPredefined' BOOLEAN not null`

That would not be a valid identifier definition for the intended schema. The repo artifact corrects this as:
- `is_predefined boolean not null`

### Legacy/provider boundary retained, provider implementation replaced
`SentimentAnalyzer.cs` shows two analysis modes:
- `FullTranscript`
- `UserOnly`

The new mapping keeps that behavior at the architecture level, but routes inference into:
- GCP/Vertex for hosted AI-Core
- local Ollama on Motherbrain for private/cheap runs

### Schema intent preserved
The EF mappings confirm these durable entities:
- transcript requests
- error log
- emotions
- transcript<->emotion links
- pain-point categories
- pain-point issues
- transcript<->pain-point links

Those are all represented in `migration/sql-porting-script.sql`.

## QA evidence
QA was executed by static verification against the produced artifact:
- confirm the migration file contains all 7 relational tables
- confirm status and operation enum checks are present
- confirm expected seed counts are documented
- confirm feature-map doc names both GCP-hosted AI-Core and Motherbrain-local paths

See command/output captured in git history and terminal session for the exact check.

## Honest status call
This card's remaining repo-local/documentation work is complete.
What is **not** done here:
- no live Cloud SQL deployment
- no live Vertex AI implementation
- no OCI benchmark run
- no DTS/Rockler work
