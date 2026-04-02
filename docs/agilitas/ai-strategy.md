# Agilitas Core AI: Layered Hybrid AI Architecture

## Overview
Agilitas utilizes a **Layered Hybrid AI Architecture** to balance cost, performance, and data privacy. This strategy leverages both cloud-scale models (Google Cloud Vertex AI / Gemini) and local, privacy-preserving models (Ollama on Motherbrain).

## Architecture Layers

### Layer 1: High-Reasoning & Synthesis (GCP Gemini)
- **Purpose**: Complex extraction, multi-lingual processing, and high-level synthesis of customer insights.
- **Provider**: Google Cloud Platform (Vertex AI).
- **Model**: Gemini 1.5 Pro / Flash.
- **Use Case**: Initial processing of raw transcripts where complex reasoning is required to identify nuanced "Pain Points" and "Innovation" opportunities.

### Layer 2: Private & Local Processing (Motherbrain Ollama)
- **Purpose**: Privacy-sensitive data handling, low-latency inferencing, and cost-reduction for repetitive tasks.
- **Provider**: Local hardware (Mac Studio "Motherbrain").
- **Model**: Llama 3 (8B/70B) or Mistral/Mistral-Nemo via Ollama.
- **Use Case**: Re-tagging, sentiment validation, and PII scrubbing before data is synced to the cloud.

### Layer 3: Evaluation & Refinement (The Golden Dataset)
- **Purpose**: Continuous improvement of extraction accuracy.
- **Implementation**: A "Golden Dataset" of curated transcripts and ground-truth extractions used to benchmark model performance across both L1 and L2.

## The 7-Dimension Schema
Every extraction must map to the following dimensions:
1. **Sentiment**: Overall tone (Positive, Neutral, Negative).
2. **Pain Points**: Specific obstacles or frustrations mentioned.
3. **Emotion**: The underlying feeling (Frustration, Delight, Confusion, etc.).
4. **Effort**: Perceived difficulty of the user's current workflow (Low, Medium, High).
5. **Competitors**: Mentions of alternative solutions or rival products.
6. **Innovation**: Suggestions for new features or improvements.
7. **Summary**: A concise 1-2 sentence recap.
