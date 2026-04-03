# PROOF_MB_078 — Agilitas runnable local proof pipeline on Motherbrain

Date: 2026-04-03
Card: MB-078
Status: PASS (pipeline artifact set complete; live Ollama unavailable during this run)

## What changed
- Upgraded `scripts/qa_agilitas_pipeline.py` from a narrow extractor check into a real one-command local proof runner.
- The script now:
  - loads the checked-in synthetic retail transcript
  - wraps plain text into the Agilitas normalized transcript shape
  - redacts PII locally before analysis
  - runs extraction via requested local provider with honest deterministic fallback
  - calculates KPIs deterministically
  - generates a recommended action
  - writes a durable JSON proof artifact to disk
- Wrote the first durable output artifact at `docs/agilitas/motherbrain-local-proof-output.json`.

## Why this counts
MB-078 asked for a runnable local proof pipeline artifact set on Motherbrain without paid services and excluding DTS. That is now present in repo form:
- one executable runner command
- one checked-in transcript fixture
- one durable output artifact shape
- one proof doc showing honest runtime results

## Command run
```bash
python3 scripts/qa_agilitas_pipeline.py
```

## Observed result
The pipeline executed end-to-end and wrote the JSON artifact successfully.

### Runtime truth
- No paid services were used.
- Presidio was not installed locally, so the fallback regex redactor was used.
- Live Ollama was **not** reachable at `http://127.0.0.1:11434` during this run.
- The script did **not** fake success; it recorded `providerUsed: deterministic-fallback` and preserved the Ollama connection-refused warning in the artifact.

## Proof points
### 1) PII redaction happened before extraction
From `docs/agilitas/motherbrain-local-proof-output.json`:

```json
"pii_checks": {
  "email_redacted": true,
  "phone_redacted": true,
  "raw_email_present_in_input": true,
  "raw_phone_present_in_input": true
}
```

And the redacted transcript contains:

```text
My email is <EMAIL_ADDRESS> and my cell is <PHONE_NUMBER> if someone needs to follow up.
```

### 2) Extraction contract was satisfied
The artifact includes all 7 required dimensions:
- sentiment
- pain_points
- emotion
- effort
- competitors
- innovation
- summary

Observed extraction snapshot:

```json
{
  "sentiment": "Negative",
  "pain_points": [
    "Honestly, it has been rough.",
    "We lost two afternoons on setup, and support responses felt slow when we asked for help.",
    "Mostly frustration."
  ],
  "emotion": "Frustration",
  "effort": "Medium",
  "competitors": ["CompetitorCo"],
  "innovation": [
    "If the product had a guided checklist and a clearer handoff between setup steps, we would probably stay."
  ],
  "summary": "Pain points: Honestly, it has been rough., We lost two afternoons on setup, and support responses felt slow when we asked for help.; Competitors: CompetitorCo; Requested improvements: If the product had a guided checklist and a clearer handoff between setup steps, we would probably stay.",
  "providerUsed": "deterministic-fallback",
  "deterministic": true
}
```

### 3) KPI scoring and action generation completed
Observed KPI snapshot:

```json
{
  "churn_probability": 0.6667,
  "revenue_loss_potential": 8000.0,
  "effort_score": 0.5
}
```

Observed action snapshot:

```json
{
  "loop_type": "Outer Loop",
  "priority": "High",
  "department": "Product Management",
  "recommendation": "Escalate to Product Management for immediate review and resolution."
}
```

## Additional QA run results
These adjacent checks still pass after the MB-078 changes:

```bash
python3 scripts/test_agilitas_redaction.py
python3 scripts/test_agilitas_ingestor.py
```

Observed results:
- redaction test: PASS using `FallbackRedactor`
- ingestor normalization test: PASS for Zoom JSON and Teams VTT fixtures

## Files updated
- `scripts/qa_agilitas_pipeline.py`
- `docs/agilitas/motherbrain-local-proof-output.json`
- `PROOF_MB_078.md`
- `mb_tasks.json`
- `MB_SAM_RUNTIME.md`
- `docs/cards/MB-078-agilitas-runnable-local-proof-pipeline-on-motherbrain.md`

## Outcome
MB-078 should be marked **done**.

Caveat: this is a durable and runnable local proof pipeline artifact set, not proof that live Motherbrain Ollama was up at the moment of this run. The artifact records that truth explicitly instead of pretending otherwise.
