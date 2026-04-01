# MB-050 — Agilitas: Evaluation: Golden Dataset & Regression Testing

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Establish a fixed "Golden Dataset" and automated evaluation suite for extraction and scoring accuracy.

## Why It Matters
Prompt changes or model updates (GCP vs Motherbrain) must be validated to prevent regression in KPI calculation and action generation.

## Scope
- Curated set of "Ground Truth" transcripts (10-20 examples).
- Manual "Ideal Response" JSON for each.
- Automated similarity/consistency score script (Cosine Similarity + LLM-as-a-Judge).

## Steps
- [ ] Collate sample transcripts into `eval/golden/`.
- [ ] Create `eval/benchmark.py` to compare system output vs. ground truth.
- [ ] CI/CD integration: Fail if extraction accuracy drops below 85%.

## Artifacts
- `eval/golden/`
- `eval/benchmark.py`
- `docs/eval-report.md`
