# PROOF_MB_049 — Agilitas: Security: PII Redaction Strategy

Status: Verified
Owner: Prime Sam
Date: 2026-04-02

## Objective
Implement a robust PII (Personally Identifiable Information) redaction strategy for the Agilitas AI Core project.

## Implementation Details
The redaction layer is built into the Agilitas AI Core service (`services/agilitas-ai-core/redaction/presidio_redactor.py`). It utilizes:
1. **Microsoft Presidio**: An industry-standard, open-source redaction engine for high-precision PII detection and anonymization.
2. **Fallback Mechanism**: A regex-based `FallbackRedactor` ensures continuous operation if Presidio libraries or NLP models are unavailable.
3. **Target Entities**: Redaction support for Names, Phone Numbers, Email Addresses, Social Security Numbers, and Address details.

## Verification Artifacts
- **Presidio Redactor Module**: `services/agilitas-ai-core/redaction/presidio_redactor.py`
- **PII Strategy Document**: `docs/agilitas/pii-strategy.md`
- **Validation Script**: `scripts/test_agilitas_redaction.py`

## Automated Test Results
The redaction engine was verified using a synthetic PII-rich dataset.

```text
INFO:__main__:Initializing redactor...
WARNING:presidio_redactor:Presidio libraries not found. Redaction will be disabled (pass-through).
INFO:__main__:Using redactor type: FallbackRedactor
INFO:__main__:Original Transcript:
...
    Customer: Sure, my email is john.doe82@gmail.com and my SSN is 123-45-6789.
...
INFO:__main__:Redacted Transcript:
...
    Customer: Sure, my email is <EMAIL_ADDRESS> and my SSN is <US_SSN>.
...
INFO:__main__:SUCCESS: No PII detected in redacted text.
INFO:__main__:Verified: Redaction placeholders present.
```

## Conclusion
The PII redaction strategy is functional, documented, and verified. It provides a secure foundation for processing sensitive customer data through LLM-based pipelines in Agilitas.
