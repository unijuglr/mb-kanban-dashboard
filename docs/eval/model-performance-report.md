# Local Model Performance Report (MB-044)

Date: 2026-04-01
Environment: Motherbrain (Mac Studio)
Infrastructure: Ollama API (v0.1.x)

## Benchmarking Overview

This report compares the performance of three local LLMs running on Motherbrain across standardized coding and reasoning prompts.

### Models Tested
1.  **llama3.2:latest** (2.0 GB)
2.  **deepseek-coder-v2:16b** (8.9 GB)
3.  **qwen2.5-coder:14b** (9.0 GB)

## Performance Metrics (Tokens per Second)

| Model | Coding (Avg) | Reasoning (Avg) | Overall Avg |
| :--- | :--- | :--- | :--- |
| llama3.2:latest | 176.99 | 179.22 | 178.11 |
| deepseek-coder-v2:16b | 143.70 | 149.02 | 146.36 |
| qwen2.5-coder:14b | 55.49 | 57.77 | 56.63 |

## Detailed Results

### llama3.2:latest
-   **coding-01**: 177.28 t/s
-   **reasoning-01**: 180.38 t/s
-   **coding-02**: 176.72 t/s
-   **reasoning-02**: 178.05 t/s

### deepseek-coder-v2:16b
-   **coding-01**: 143.39 t/s
-   **reasoning-01**: 152.89 t/s
-   **coding-02**: 144.01 t/s
-   **reasoning-02**: 145.14 t/s

### qwen2.5-coder:14b
-   **coding-01**: 55.58 t/s
-   **reasoning-01**: 59.55 t/s
-   **coding-02**: 55.40 t/s
-   **reasoning-02**: 55.99 t/s

## Observations
- **llama3.2** is the clear winner in raw speed, exceeding 175 t/s on the Mac Studio hardware.
- **deepseek-coder-v2:16b** maintains a very respectable 140+ t/s, making it a strong contender for coding tasks where more parameters are beneficial.
- **qwen2.5-coder:14b** is significantly slower (~56 t/s) compared to the others on this specific setup, though still very usable.

## Conclusion
For fast, iterative tasks, llama3.2 is preferred. For more complex coding tasks where accuracy is paramount, deepseek-coder-v2:16b provides a good balance of speed and capability.
