# MB-047 — Agilitas: Migration: .NET to Node/Python Track

Status: Done
Priority: P2 normal
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-03

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
- [x] Document the core logic of `Agilitas.Data` and `Agilitas.FileProcessor.Function`.
- [x] Port C# schema models to TypeScript/Python equivalents.
- [x] Extract the SQL initial scripts and prepare them for migration to the new DB.
- [x] Map existing .NET/OCI features to the new GCP-hosted AI-Core.

## Completion Notes
- This card is complete as a migration-track artifact/documentation milestone, not as full runtime parity with the legacy .NET/OCI stack.
- OCI aspect-level sentiment parity and object-storage trigger parity remain future implementation work if product scope requires them.

## Artifacts
- `migration/dotnet-extraction-log.md`
- `migration/sql-porting-script.sql`
- `docs/agilitas/mb-047-dotnet-feature-mapping.md`
- `PROOF_MB_047.md`

## Update Log
- 2026-04-03 — Card status reconciled to Done after current-tree audit confirmed artifacts, proof steps, and pushed feature-branch state are consistent.
- 2026-04-01 — Migration-track card created.
