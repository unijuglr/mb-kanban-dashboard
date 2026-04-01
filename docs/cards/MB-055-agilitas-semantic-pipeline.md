# MB-055 — Agilitas: Engineering: Semantic Extraction Pipeline replacement

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01

## Objective
Replace Azure-specific semantic extraction logic with a model-agnostic pipeline (Vertex/Motherbrain).

## Why It Matters
Agilitas's value is in its high-fidelity signal extraction. This must work identically across GCP (Gemini) and Motherbrain (Local LLMs) without Azure proprietary APIs.

## Scope
- Abstraction layer for LLM calls (LiteLLM or similar).
- Porting 7-dimension extraction prompts to model-agnostic templates.
- Comparative evaluation between Gemini 1.5 Pro (GCP) and Llama 3 (Motherbrain).

## Steps
- [ ] Implement `services/agilitas-ai-core/llm_client.py` with multi-provider support.
- [ ] Refactor existing .NET prompts to agnostic YAML/JSON templates.
- [ ] Conduct bakeoff between GCP and Local models using the Golden Dataset.

## Artifacts
- `services/agilitas-ai-core/prompts/`
- `services/agilitas-ai-core/llm_client.py`
