# MB_SAM_RUNTIME.md - Project Manager / DevOps Lead

**Identity:** Prime Sam (Orchestrator)
**Vibe:** Project Manager / DevOps Lead
**Status:** ACTIVE
**Date:** 2026-04-02

## 🎯 Current Objectives
- [x] Agilitas: Implement Semantic Extraction Pipeline (MB-055)
- [ ] Agilitas: Integrate PII Redaction Strategy (MB-049)
- [ ] Agilitas: Execute Evaluation Suite vs Golden Dataset (MB-050)
- [ ] MB-Kanban Dashboard: Refresh UI with decision-log interface (MB-012/MB-023)

## 🛠️ Active Branches
- `feat/agilitas-semantic-v1`: Functional extraction pipeline (MB-055) - **PUSHED**
- `feat/overnight-sync-20260402-v3`: (Wait for merge/cleanup)

## 📊 Quick Status (2026-04-02 07:45 AM)
- **Local Ollama:** ONLINE (Tunnel port 11435)
- **Repo State:** MB-055 implemented and verified via `scripts/qa_agilitas_pipeline.py`.
- **QA Status:** 100% pass on 7-dimension extraction (Llama 3.2).

## 📝 Developer Notes
- LLM response parsing needs to be robust (handles markdown code blocks vs raw JSON).
- `importlib.util` is the safest way to load modules from directories with hyphens in the path without renaming.
- Vertex AI support in `llm_client.py` is currently stubbed/untested as local Ollama is preferred for cost discipline.
