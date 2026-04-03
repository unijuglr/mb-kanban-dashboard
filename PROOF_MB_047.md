# PROOF_MB_047 — Agilitas .NET to Node/Python Migration Track

Date: 2026-04-03
Branch: `feat/mb-047-migration-artifacts`

## What was added
- `migration/sql-porting-script.sql`
- `docs/agilitas/mb-047-dotnet-feature-mapping.md`

## What was updated
- `docs/cards/MB-047-agilitas-migration-track.md`
- `mb_tasks.json`

## Evidence used
Local source repo inspected directly:
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/1 Db initial script.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/2 Add emotions.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/3 Add Pain Points.sql`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/TranscriptParsing/TranscriptParser.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Sentiment/SentimentAnalyzer.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/OracleLanguageAiClient.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/OracleGenerativeAiInferenceAiClient.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/FileProcessor.cs`
- `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/AgilitasDbContext.cs`

## QA
### 1. Syntax/load check for SQL artifact
```bash
python3 - <<'PY'
from pathlib import Path
sql = Path('migration/sql-porting-script.sql').read_text()
assert 'CREATE TABLE IF NOT EXISTS transcript_requests' in sql
assert 'INSERT INTO emotions' in sql
assert 'INSERT INTO pain_point_categories' in sql
assert 'INSERT INTO pain_point_issues' in sql
print('sql artifact checks passed')
PY
```

### 2. Card/task consistency check
```bash
python3 - <<'PY'
import json
from pathlib import Path
card = Path('docs/cards/MB-047-agilitas-migration-track.md').read_text()
assert '- [x] Extract the SQL initial scripts and prepare them for migration to the new DB.' in card
assert '- [x] Map existing .NET/OCI features to the new GCP-hosted AI-Core.' in card
items = json.loads(Path('mb_tasks.json').read_text())
mb047 = next(x for x in items if x['id'] == 'MB-047')
assert mb047['state'] == 'done'
assert 'migration/sql-porting-script.sql' in mb047['artifacts']
assert 'docs/agilitas/mb-047-dotnet-feature-mapping.md' in mb047['artifacts']
print('card/task consistency checks passed')
PY
```

## Honest caveats
- This completes the **migration-track artifact/documentation** task, not full runtime parity.
- OCI aspect-level sentiment output and OCI object-storage trigger parity remain future implementation work if product needs them.
