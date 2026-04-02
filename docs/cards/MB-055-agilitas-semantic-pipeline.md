# MB-055 — Agilitas: Engineering: Semantic Extraction Pipeline replacement

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: MB-Sam
Created: 2026-03-31
Last Updated: 2026-04-02

## Objective
Replace the initial extraction stub with a production-grade semantic extraction pipeline capable of multi-provider (local/cloud) processing.

## Why It Matters
This is the core "intelligence" of the Agilitas engine. Without this, the platform is just a transcript storage tool.

## Scope
- Implement a model-agnostic LLM client.
- Create a structured extractor following the 7-dimension schema.
- Support local (Ollama) and cloud (Vertex AI) backends.
- Add automated QA to verify extraction accuracy.

## Steps
- [x] Port C# sentiment/pain point logic into the new pipeline.
- [x] Implement `AgilitasLLMClient` with local Motherbrain (Ollama) support.
- [x] Implement `AgilitasExtractor` with JSON-structured output.
- [x] Create and run `scripts/qa_agilitas_pipeline.py`.
- [x] Verify local model (Llama 3.2) correctly extracts all 7 dimensions.

## Artifacts
- `services/agilitas-ai-core/llm_client.py`
- `services/agilitas-ai-core/extractor.py`
- `scripts/qa_agilitas_pipeline.py`
- `PROOF_MB_055.md`
