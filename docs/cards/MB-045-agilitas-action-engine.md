# MB-045 — Agilitas: Actions & Outcomes: Inner/Outer Loop Engine

Status: Done
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Implement the "Action Generation" engine using LLM + RAG (Retrieval-Augmented Generation) to drive prioritized resolutions.

## Why It Matters
This is where the platform "closes the loop." It takes the extracted signals and computed KPIs and generates a department-specific, policy-grounded recommendation.

## Scope
- RAG framework (Langfuse/DeepEval integration) to synthesize extracted data with client policies.
- Mapping signals to "Inner Loop" (Agent assist/Knowledge management) and "Outer Loop" (Product fix/Jira push).
- Integration points for 3rd party tool-pushing (e.g., Jira, Slack, Salesforce).
- Department-specific recommendation generation (IT, Marketing, Product, Finance).

## Steps
- [ ] Build the RAG retrieval layer for client-specific "Source of Truth" docs.
- [ ] Implement the prompt architecture for "Action Generator" using computed KPIs as context.
- [ ] Set up the Jira/External tool push-service prototype.
- [ ] Audit for "Factual Groundedness" and "Hallucination Rate" against success criteria.

## Artifacts
- `services/agilitas-action-engine/`
- `prompts/action-generator-v1.yaml`
