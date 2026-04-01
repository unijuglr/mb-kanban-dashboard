# MB-039 — Agilitas: Platform: Core AI Extraction (Azure/Motherbrain)

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Implement the "Layered Hybrid AI Architecture" for Signal Extraction (Pain Points, Sentiment, Emotion, Effort, Competitors, Innovation) using Azure OpenAI with a local Motherbrain fallback/shadow mode.

## Why It Matters
This is the "AI-Core" nervous system. It transforms raw transcripts into the structured JSON data required for all downstream financial and operational logic.

## Scope
- Implementation of the 7-dimension extraction prompt (Category, Issue, Sentiment, Emotion, Effort, Competitors, Innovation).
- Integration with Azure Language Service for upstream PII redaction.
- Development of the "Motherbrain Shadow" track using local Ollama (Llama 3 / DeepSeek) to compare performance and cost vs Azure.
- Validation against the Golden Dataset (synthetic + real-world).

## Steps
- [ ] Port prompt logic from .NET prototype to a cleaner Python/Node service.
- [ ] Implement Azure Language Service PII redaction middleware.
- [ ] Set up local Ollama shadow evaluation (Motherbrain track).
- [ ] Validate extraction accuracy against 90% success criteria in `docs/eval.txt`.

## Artifacts
- `services/agilitas-ai-core/`
- `eval/golden-dataset-v1.json`
