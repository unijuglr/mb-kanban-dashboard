# Agilitas on Motherbrain: First Local Demo Flow

Created: 2026-04-02  
Related cards: MB-073, MB-076

## Purpose
Define the exact first demo flow for Agilitas running locally on Motherbrain so a human can watch a transcript become a scored recommendation without cloud spend.

## Demo Principle
This is not a platform demo. It is a credibility demo.

The audience should be able to see:
1. a transcript goes in
2. sensitive fields are redacted locally
3. customer signals are extracted locally
4. business risk is scored deterministically
5. a concrete recommended action comes out

## Smallest Demo Setup
- machine: Motherbrain
- model runtime: local Ollama only
- input: one synthetic transcript fixture
- execution: one local runner command
- output: one JSON result file plus optional markdown summary

## Demo Input
Use one synthetic transcript that contains all of the following on purpose:
- at least one obvious pain point
- one emotional cue
- one effort cue
- one competitor mention
- one improvement suggestion
- at least one piece of PII to prove redaction

### Suggested transcript shape
```text
AE: Thanks for joining. How has onboarding been going?
Customer: Honestly, it has been rough. My team still can't find the inventory sync settings.
Customer: We lost two afternoons on this and support responses felt slow.
Customer: My email is jamie@example.com and my cell is 415-555-0188 if someone needs to follow up.
Customer: We're comparing this against CompetitorCo because their setup looked easier.
Customer: If the product had a guided checklist and a clearer handoff between setup steps, we'd probably stay.
AE: Understood. Anything else?
Customer: Mostly frustration. It feels like too much effort for something we expected to be simple.
```

## Exact Demo Flow

### Step 1: Show the raw local input
- present the transcript file path
- confirm it is synthetic and stored locally
- confirm no external APIs or external storage are involved

### Step 2: Normalize the transcript
- convert the input into the Agilitas transcript schema
- minimum fields to show:
  - `agent`
  - `customer`
  - `fullTranscript`
  - `customerTranscript`
  - `parts`

### Step 3: Redact PII locally
- run the transcript text through the local redactor before extraction
- during demo, explicitly show that:
  - `jamie@example.com` becomes `<EMAIL_ADDRESS>`
  - `415-555-0188` becomes `<PHONE_NUMBER>`
  - name-like tokens become `<PERSON>` where detected

### Step 4: Run local extraction
- send the redacted transcript to `AgilitasExtractor(use_cloud=False)`
- local model returns JSON with exactly 7 dimensions:
  - sentiment
  - pain_points
  - emotion
  - effort
  - competitors
  - innovation
  - summary

### Step 5: Score the business impact
- pass extraction JSON plus fixed demo metadata into `calculate_kpis(...)`
- recommended demo metadata:
```json
{
  "ltv": 12000
}
```
- expected outcome for this transcript: elevated churn risk and high effort score

### Step 6: Generate the recommended action
- pass KPI output and extraction output into `AgilitasActionEngine().generate_action(...)`
- expected class of result:
  - loop type: likely `Outer Loop`
  - priority: `High` or `Critical`
  - department: `Product Management`
  - recommendation: escalation / product review language

### Step 7: Write and review the final artifact
- write one JSON file for the full run
- optional: also write one markdown summary for easy sharing
- the demo ends by reviewing the final output, not by staring at logs

## Expected Output Story
The final artifact should tell this exact story:
- customer had onboarding friction
- customer expressed frustration
- customer perceived high effort
- customer mentioned a competitor
- customer suggested a product improvement
- system estimated churn risk from deterministic rules
- system recommended a specific follow-up path

## Example Output Snapshot
```json
{
  "extraction": {
    "sentiment": "Negative",
    "pain_points": [
      "Could not find inventory sync settings",
      "Support responses felt slow"
    ],
    "emotion": "Frustrated",
    "effort": "High",
    "competitors": ["CompetitorCo"],
    "innovation": [
      "Add a guided onboarding checklist",
      "Clarify setup handoff between steps"
    ],
    "summary": "Customer experienced painful onboarding friction, compared the product to a competitor, and suggested improvements that would reduce setup effort."
  },
  "kpis": {
    "churn_probability": 1.0,
    "revenue_loss_potential": 12000.0,
    "effort_score": 1.0
  },
  "action": {
    "loop_type": "Outer Loop",
    "priority": "Critical",
    "department": "Product Management",
    "recommendation": "Escalate to Product Management for immediate review and resolution."
  }
}
```

## Demo Operator Script
The operator should be able to narrate the run in under 2 minutes:
1. "Here’s the local transcript fixture."
2. "We normalize it into the Agilitas transcript shape."
3. "We redact PII before model analysis."
4. "We run the local model to extract customer signals."
5. "We score risk deterministically."
6. "We generate the recommended action."
7. "Here’s the final JSON artifact with the full chain."

## Success Criteria
MB-076 should count as successful when:
- the demo runs from one local command
- the transcript starts local and remains local
- PII redaction is visibly proven
- all 7 extraction fields are returned
- KPI scoring completes and is explainable from the rules
- action generation completes and is readable by a non-engineer
- the final output artifact is saved and reviewable after the run

## Proof Expectations
A proof package for this demo should include:
- the runner command
- the exact input fixture path
- console output or screenshot showing redaction happened
- the output JSON artifact path
- the final extraction / KPI / action snapshot
- brief note confirming no paid services were used

## Common Failure Modes to Catch Early
1. Ollama unreachable on the expected port
2. transcript fixture is malformed or not actually a transcript
3. model returns non-JSON or markdown-wrapped JSON
4. redaction dependencies are missing and fallback behavior is unclear
5. output artifact omits one of the intermediate stages, making the demo less credible

## Recommended Follow-on Work After This Demo
- add one second transcript fixture with positive sentiment for contrast
- add a markdown summary renderer
- add a minimal local UI only after the file-based flow is stable
