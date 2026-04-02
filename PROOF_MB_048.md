# PROOF_MB_048 — Agilitas: Ingestion: Transcript Normalization Pipeline

Status: Verified
Owner: Prime Sam
Date: 2026-04-02

## Objective
Standardize raw transcript input from multiple sources (Zoom, Teams, VTT) into the Agilitas "Unified Fragment Schema."

## Implementation Details
The normalization pipeline is implemented in `services/agilitas_ingestor/normalizer.py`. It provides:
1. **Zoom JSON Parser**: Extracts agent/customer dialogue and metadata from Zoom's transcript format.
2. **Teams VTT Parser**: Processes standard VTT files and maps speaker labels to Agilitas roles.
3. **Unified Fragment Schema**: Defined in `docs/agilitas/unified-schema.json`, ensuring downstream extraction and analysis have consistent, high-quality data.
4. **Metadata Preservation**: Captures participant identifiers, session timestamps, and transcript context.

## Verification Artifacts
- **Normalizer Module**: `services/agilitas_ingestor/normalizer.py`
- **Unified Schema Spec**: `docs/agilitas/unified-schema.json`
- **Validation Script**: `scripts/test_agilitas_ingestor.py`
- **Synthetic Test Data**: `data/agilitas/samples/`

## Automated Test Results
Verified using both Zoom JSON and Teams VTT samples.

```text
Testing Zoom JSON Normalization...
Normalized Zoom Data: {
  "dateTime": "2026-04-02T10:00:00Z",
  "agent": "Adam",
  "customer": "Client",
  "parts": [
    { "type": "Agent", "text": "Hello, how can I help you today?" },
    { "type": "Customer", "text": "I'm having trouble with the dashboard." }
  ]
}

Testing Teams VTT Normalization...
Normalized Teams Data: {
  "dateTime": "2026-04-02T11:00:00Z",
  "agent": "Adam",
  "customer": "Client",
  "parts": [
    { "type": "Agent", "text": "Welcome to the meeting." },
    { "type": "Customer", "text": "Thanks for having me. I wanted to discuss the new features." }
  ]
}

All normalization tests passed!
```

## Conclusion
The transcript normalization pipeline is verified and ready to support the Agilitas extraction and evaluation tracks.
