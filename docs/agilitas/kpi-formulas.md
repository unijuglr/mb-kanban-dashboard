# Agilitas KPI Formulas

This document outlines the deterministic scoring logic used in the Agilitas Business Engine.

## 1. Churn Probability

**Goal:** Predict the likelihood of a customer leaving based on extracted qualitative data.

**Formula:**
`Churn Probability = (Sentiment Score + Pain Point Weight + Emotion Weight) / 3.0`

### Inputs:
- **Sentiment Score:**
    - `Negative`: 1.0
    - `Neutral`: 0.5
    - `Positive`: 0.0
- **Pain Point Weight:**
    - `0` pain points: 0.0
    - `1` pain point: 0.5
    - `2+` pain points: 1.0
- **Emotion Weight:**
    - `Frustrated`, `Angry`, `Disappointed`: 1.0
    - `Concerned`, `Confused`: 0.5
    - `Happy`, `Satisfied`, `None`: 0.0

---

## 2. Revenue Loss Potential

**Goal:** Quantify the financial risk of a churn event.

**Formula:**
`Revenue Loss Potential = Churn Probability * Customer LTV`

### Inputs:
- **Churn Probability:** Calculated above (0.0 to 1.0).
- **Customer LTV:** Total Lifetime Value of the customer (from metadata).

---

## 3. Effort Score

**Goal:** Map the perceived effort required by the customer to a normalized numeric value.

**Mapping:**
- `High`: 1.0
- `Medium`: 0.5
- `Low`: 0.0
- `Unknown/Other`: 0.0
