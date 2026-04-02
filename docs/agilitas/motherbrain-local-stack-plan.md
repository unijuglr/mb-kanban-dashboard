# Agilitas on Motherbrain: Smallest Runnable Local Stack Plan

Created: 2026-04-02  
Related cards: MB-073, MB-076

## Goal
Define the smallest practical Agilitas stack that can run fully local on Motherbrain with zero paid API usage and prove a transcript can move from raw input to actionable output.

## Non-Negotiables
- local-only execution on Motherbrain
- zero paid APIs
- no DTS work
- smallest runnable stack first
- prefer existing repo components over new infrastructure

## Recommended First-Cut Stack
Skip container orchestration for the first proof. Use direct local Python execution plus Ollama.

### Required components
1. **Input transcript file**
   - synthetic local transcript checked into the repo
   - format for v1: plain text or simple Teams/Zoom source fixture

2. **Normalization step**
   - use `services/agilitas_ingestor/normalizer.py`
   - output: normalized `TranscriptData` shape from `src/agilitas/schemas/models.py`
   - success target: produce `fullTranscript`, `customerTranscript`, `agent`, `customer`, `parts`

3. **PII redaction step**
   - use `services/agilitas-ai-core/redaction/presidio_redactor.py`
   - preferred mode: Presidio if installed locally
   - acceptable v1 fallback: bundled regex fallback already exposed via `get_redactor()`
   - success target: known email/phone/name values are replaced before LLM call

4. **Local extraction step**
   - use `services/agilitas-ai-core/extractor.py`
   - provider: local Ollama only (`use_cloud=False`)
   - output: 7-dimension extraction JSON

5. **Deterministic scoring step**
   - use `services/agilitas-business-engine/scoring_engine.py`
   - output: churn probability, revenue loss potential, effort score

6. **Action generation step**
   - use `services/agilitas-action-engine/generator.py`
   - output: loop type, priority, department, recommendation

7. **Simple output surface**
   - for v1, a single JSON artifact written to disk is enough
   - optional second artifact: markdown summary for human review

## Explicitly Not Required for v1
- Docker Compose
- service-to-service networking
- UI/dashboard polish
- cloud storage
- GCP / Vertex / paid APIs
- DTS pipeline integration
- production auth, queues, or observability

## Why this is the right minimum
The existing repo already has the core units for normalize -> redact/extract -> score -> recommend. The fastest path to proof is one local runner script that calls them in process. Anything larger is ceremony before evidence.

## Exact Transcript-In -> Output Flow

### Input
A local transcript fixture enters from one of these paths:
- `data/demo/*.txt` for plain text proof, or
- a synthetic Zoom JSON / Teams VTT fixture created during implementation

### Golden path
1. **Load transcript fixture**
   - read raw local file
2. **Normalize**
   - if source is Zoom JSON: `AgilitasNormalizer.normalize_zoom_json()`
   - if source is Teams VTT: `AgilitasNormalizer.normalize_teams_vtt()`
   - if source is plain text: wrap into minimal normalized shape in the runner for v1
3. **Select analysis text**
   - use `customerTranscript` when available
   - fall back to `fullTranscript` if needed
4. **Redact PII**
   - run through `get_redactor().redact(...)`
5. **Extract dimensions locally**
   - `AgilitasExtractor(use_cloud=False, redact_pii=True).extract_dimensions(...)`
   - Ollama model returns JSON for:
     - sentiment
     - pain_points
     - emotion
     - effort
     - competitors
     - innovation
     - summary
6. **Score**
   - `calculate_kpis(extraction_data, customer_metadata)`
   - v1 metadata can be static JSON in the runner, e.g. `{"ltv": 12000}`
7. **Generate action**
   - `AgilitasActionEngine().generate_action(kpis, extraction_data)`
8. **Write result artifact**
   - single JSON file containing:
     - source transcript metadata
     - normalized transcript snapshot
     - redacted analysis text
     - extraction JSON
     - KPI JSON
     - recommendation JSON

## Proposed v1 Artifact Shape
```json
{
  "run_id": "2026-04-02T09:00:00Z-demo-retail-001",
  "source": {
    "path": "data/demo/transcript_retail.txt",
    "format": "plain_text"
  },
  "normalized": {
    "agent": "AE",
    "customer": "Customer",
    "fullTranscript": "...",
    "customerTranscript": "..."
  },
  "redacted_transcript": "...",
  "extraction": {
    "sentiment": "Negative",
    "pain_points": ["..."],
    "emotion": "Frustrated",
    "effort": "High",
    "competitors": ["..."],
    "innovation": ["..."],
    "summary": "..."
  },
  "kpis": {
    "churn_probability": 0.8333,
    "revenue_loss_potential": 10000.0,
    "effort_score": 1.0
  },
  "action": {
    "loop_type": "Outer Loop",
    "priority": "Critical",
    "department": "Product Management",
    "recommendation": "Escalate to Product Management for immediate review and resolution."
  }
}
```

## Motherbrain Environment Requirements
### Required
- Python environment that can import the Agilitas modules
- local Ollama reachable from Motherbrain or from Adam’s laptop via the existing tunnel model
- at least one local Ollama model pulled, preferably `llama3.2:latest`
- writable local output directory for proof artifacts

### Nice to have, not blocking v1
- Presidio + SpaCy model installed locally
- a dedicated runner script, e.g. `scripts/run_agilitas_local_demo.py`
- a canonical synthetic transcript fixture with embedded PII test tokens

## Known Risks / Blockers
1. **Current transcript fixture looks unhealthy**
   - `data/demo/transcript_retail.txt` currently appears to contain an Ollama error string rather than a usable transcript
   - implementation should either repair that asset or introduce a clean synthetic fixture

2. **Endpoint mismatch risk**
   - `services/agilitas-ai-core/llm_client.py` targets `http://127.0.0.1:11435/api/generate`
   - `infra/agilitas/docker-compose.yaml` references `host.docker.internal:11434`
   - v1 should standardize on one local path; for Motherbrain-local direct execution, avoid Docker and make the runner prove the chosen endpoint explicitly

3. **Normalization gap for plain text**
   - the normalizer currently supports Zoom JSON and Teams VTT, not raw txt
   - easiest fix is a tiny runner-side wrapper for plain text demo fixtures

## Success Criteria
MB-073 should count as successful when all of the following are true:
- one synthetic transcript can be processed fully local with no cloud calls
- PII is demonstrably redacted before extraction
- extraction JSON includes all 7 required dimensions
- KPI calculation runs deterministically from extraction output
- action recommendation is produced from the KPI payload
- a single run writes a reviewable artifact to disk
- a second local run with the same input completes without manual patching

## Proof Expectations
The implementation proof for this plan should include:
1. exact command used to run the local stack
2. the input transcript fixture path
3. the generated output artifact path
4. a snippet proving PII redaction happened
5. the extraction JSON
6. the KPI + action JSON
7. confirmation that no paid API credentials were required

## Recommended Next Build Order
1. create/fix one clean synthetic transcript fixture
2. add one local runner script that executes the full pipeline in process
3. harden the Ollama endpoint choice
4. write a proof doc with command, output, and screenshots/snippets

## Hand-off Notes for Coders
- keep this as one process first; do not split into multiple services yet
- do not spend time on Docker unless direct local execution works first
- prefer deterministic fixtures over live data
- keep all proof artifacts local and checked into repo where safe
