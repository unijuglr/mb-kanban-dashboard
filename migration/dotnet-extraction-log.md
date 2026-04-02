# .NET Extraction Log - Agilitas Migration (MB-047)

**Date:** 2026-04-01
**Source Path:** `/Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer`
**Task:** Porting core C# schemas (PainPointCategory, PainPointIssue, TranscriptData) to TypeScript and Python.

## Extracted C# Models

### PainPointCategory.cs
Path: `Agilitas.Data/Database/Models/PainPointCategory.cs`
```csharp
namespace Agilitas.Data.Database.Models;

public class PainPointCategory
{
    public int Id { get; set; }
    public int IsPredefined { get; set; }
    public string Name { get; set; }
    public virtual ICollection<PainPointIssue> Issues { get; set; }
}
```

### PainPointIssue.cs
Path: `Agilitas.Data/Database/Models/PainPointIssue.cs`
```csharp
namespace Agilitas.Data.Database.Models;

public class PainPointIssue
{
    public int Id { get; set; }
    public int IsPredefined { get; set; }
    public string Name { get; set; }
    public int CategoryId { get; set; }
    public virtual PainPointCategory Category { get; set; }
}
```

### TranscriptData.cs (and related)
Path: `Agilitas.Data/TranscriptParsing/TranscriptData.cs`
```csharp
public class Transcript
{
    public DateTime DateTime { get; set; }
    public string? Agent { get; set; }
    public string? Customer { get; set; }
    public string FullTranscript { get; set; }
    public string CustomerTranscript { get; set; }
    public List<TranscriptPart> Parts { get; set; }
}

public class TranscriptPart
{
    public TranscriptPartType Type { get; set; }
    public string Text { get; set; }
}

public enum TranscriptPartType
{
    SystemPrompt,
    Agent,
    Customer
}
```

## Migration Actions
1. Created TypeScript interfaces in `src/agilitas/schemas/models.ts`.
2. Created Python TypedDicts/Classes in `src/agilitas/schemas/models.py`.
3. Verified path mapping between .NET project structure and MB-Kanban-Dashboard.

## Notes
- The .NET project uses Entity Framework style navigation properties (virtual ICollection). These are flattened or represented as arrays/IDs in the new schemas.
- `TranscriptData.cs` actually contains a `Transcript` class.
- Added `TranscriptPart` and `TranscriptPartType` to ensure full porting of the transcript structure.

## 2026-04-02 Follow-on Extraction
- Inspected legacy SQL scripts under `SQL/` plus EF mapping files under `Agilitas.Data/Database/Mappings/`.
- Produced `migration/sql-porting-script.sql` as a Cloud SQL/PostgreSQL-ready artifact that preserves transcript/error/emotion/pain-point entities and seed values.
- Produced `docs/agilitas/dotnet-to-gcp-feature-map.md` to map .NET/OCI behaviors onto the current GCP-hosted AI-Core + Motherbrain-local architecture.
- Captured proof and QA notes in `migration/mb-047-proof.md`.
