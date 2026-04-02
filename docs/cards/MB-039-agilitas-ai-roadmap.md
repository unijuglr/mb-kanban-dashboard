# MB-039 — Agilitas: Platform: Core AI Extraction (GCP/Motherbrain)

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Implement the "Layered Hybrid AI Architecture" for Signal Extraction (Pain Points, Sentiment, Emotion, Effort, Competitors, Innovation) using GCP (Vertex AI / Gemini) with a local Motherbrain fallback/shadow mode. **No Azure dependency.**

## Why It Matters
This is the "AI-Core" nervous system. It transforms raw transcripts into the structured JSON data required for all downstream financial and operational logic.

## Scope
- Implementation of the 7-dimension extraction prompt (Category, Issue, Sentiment, Emotion, Effort, Competitors, Innovation).
- Integration with local/GCP PII redaction strategy (presidio or custom regex/LLM).
- Development of the "Motherbrain Shadow" track using local Ollama (Llama 3 / DeepSeek) to compare performance and cost vs GCP.
- Validation against the Golden Dataset (synthetic + real-world).

## Steps
- [ ] Port prompt logic from .NET prototype to a cleaner Python/Node service.
- [ ] Implement PII redaction middleware (GCP DLP or local Presidio).
- [ ] Set up local Ollama shadow evaluation (Motherbrain track).
- [ ] Validate extraction accuracy against 90% success criteria in `docs/eval.txt`.

## Artifacts
- `services/agilitas-ai-core/`
- `eval/golden-dataset-v1.json`
