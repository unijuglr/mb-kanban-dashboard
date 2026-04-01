# MB-047 — Agilitas: Migration: .NET to Node/Python Track

Status: Ready
Priority: P2 normal
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Extract and migrate logic from the AgilitasTranscriptAnalyzer (.NET) and related UI prototypes into the main platform architecture.

## Why It Matters
"Don't reinvent the wheel." The .NET/OCI code contains working schemas, sentiment analysis, and Oracle AI integrations that should be ported, not re-written from scratch.

## Scope
- Porting schema definitions (PainPointCategory, PainPointIssue, TranscriptData).
- Extracting the "SentimentAnalyzer" and "TranscriptParser" logic.
- Assessing the "OCI.Generativeaiinference" track for alternative model (Oracle) benchmarking.
- Migrating/Refining the SQL initial scripts into the new data store (Cloud SQL / Neo4j).

## Steps
- [ ] Document the core logic of `Agilitas.Data` and `Agilitas.FileProcessor.Function`.
- [ ] Port C# schema models to TypeScript/Python equivalents.
- [ ] Extract the SQL initial scripts and prepare them for migration to the new DB.
- [ ] Map existing .NET/OCI features to the new GCP-hosted AI-Core.

## Artifacts
- `migration/dotnet-extraction-log.md`
- `migration/sql-porting-script.sql`
