# MB-049 — Agilitas: Security: PII Redaction Strategy (Presidio / GCP DLP)

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Implement a privacy-first PII redaction layer to ensure no customer PII reaches LLMs (local or cloud).

## Why It Matters
Agilitas processes sensitive conversations. Enterprise compliance requires consistent redaction of Names, Phones, Emails, and SSNs.

## Scope
- Local PII detection using Microsoft Presidio (Motherbrain).
- Optional GCP Cloud DLP for enterprise-grade redaction (GCP).
- Reversibility strategy (redact/unredact for internal lookup tables).

## Steps
- [ ] Configure Presidio with custom PII recognizers (Industry-specific terms).
- [ ] Implement "Redaction Wrapper" in AI Core service.
- [ ] Test redaction accuracy on real PII-rich synthetic datasets.

## Artifacts
- `services/agilitas-ai-core/redaction/`
- `docs/agilitas/pii-strategy.md`
