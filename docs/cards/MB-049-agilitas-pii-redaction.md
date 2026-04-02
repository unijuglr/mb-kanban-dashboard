# MB-049 — Agilitas: Security: PII Redaction Strategy

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: MB-Sam
Created: 2026-03-31
Last Updated: 2026-04-02

## Objective
Implement a robust PII redaction strategy to ensure sensitive customer data (Names, Phone Numbers, Emails) does not leak into the AI extraction pipeline.

## Why It Matters
Data privacy is non-negotiable for enterprise clients. Redacting PII *before* it leaves the local environment or enters the cloud extraction layer is critical for compliance.

## Scope
- Implementation of a pluggable redactor interface.
- Support for Microsoft Presidio (NLP-based) and regex-based fallbacks.
- Integration with the Agilitas Core AI Extraction Pipeline.

## Steps
- [x] Define PII entities for redaction (PERSON, PHONE, EMAIL, etc.).
- [x] Implement `PresidioRedactor` with a fallback mechanism for restricted environments.
- [x] Integrate `Redactor` into the `AgilitasExtractor` pre-processing step.
- [x] Verify PII safety via `scripts/qa_agilitas_pipeline.py`.

## Artifacts
- `services/agilitas-ai-core/redaction/presidio_redactor.py`
- `services/agilitas-ai-core/extractor.py` (integrated)
- `scripts/qa_agilitas_pipeline.py` (PII Check)
- `PROOF_MB_055.md` (Combined Proof)
