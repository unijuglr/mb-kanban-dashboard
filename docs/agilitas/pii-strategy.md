# PII Strategy: Agilitas AI Core

## Overview
As part of the Agilitas AI Core initiative (MB-049), a robust PII (Personally Identifiable Information) redaction strategy is critical to ensure data privacy and compliance when feeding real-world transcripts and user data into Large Language Models (LLMs).

## Current Implementation: Microsoft Presidio
Our first-line defense is a local redaction layer powered by **Microsoft Presidio**. Presidio provides a flexible, modular engine for identifying and anonymizing sensitive data within text.

### Target Entities
We currently target and redact the following PII types:
- **Names** (`PERSON`)
- **Phone Numbers** (`PHONE_NUMBER`)
- **Email Addresses** (`EMAIL_ADDRESS`)
- **Social Security Numbers** (`US_SSN`)
- **Address details** (`LOCATION`, `STREET_ADDRESS`)

### Redaction Method
The current strategy uses **Placeholder Substitution**. Instead of simply masking data (e.g., `****`), we replace PII with descriptive tags like `<PERSON>`, `<EMAIL_ADDRESS>`, etc.
- **LLM-Safe**: Preserving the structure of the sentence (e.g., "Hello <PERSON>") allows the LLM to understand the context without accessing the sensitive data itself.
- **Accuracy**: Microsoft Presidio uses a combination of Named Entity Recognition (NER), regular expressions, and checksum logic to achieve high precision and recall.

## Deployment Roadmap: Local First to GCP

### 1. Local-First (Development & Testing)
Currently implemented in `presidio_redactor.py`. This layer runs directly within the Agilitas Core service. 
- **Pros**: Zero latency, no external data transmission, cost-effective.
- **Cons**: Requires local resources (memory, CPU) and specific dependencies (SpaCy, Transformers).

### 2. Hybrid Strategy (Reliability)
In cases where Presidio or its dependencies (like the SpaCy language model) are unavailable, the system is designed to fail gracefully.
- A `get_redactor()` factory provides a fallback mechanism.
- Future work includes a lightweight regex-based fallback for the most common PII types (emails, phones).

### 3. Google Cloud Platform (GCP) DLP (Future Scaling)
As we scale to production-grade throughput or require more stringent compliance (e.g., HIPAA, GDPR):
- **GCP Sensitive Data Protection (formerly DLP API)**: We will evaluate offloading redaction to GCP's enterprise-grade PII detection.
- **Integration**: The `Redactor` interface is designed to accommodate a `GCPRedactor` implementation without changing the calling service's logic.

## Verification & Monitoring
All redaction logic is verified against a synthetic test suite (`scripts/test_agilitas_redaction.py`). Regular audits of LLM inputs will be conducted to ensure zero leakage.
