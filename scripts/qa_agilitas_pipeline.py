#!/usr/bin/env python3
import argparse
import importlib.util
import inspect
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, project_root)

DEFAULT_TRANSCRIPT = os.path.join(project_root, 'data', 'demo', 'transcript_retail.txt')
DEFAULT_OUTPUT = os.path.join(project_root, 'docs', 'agilitas', 'motherbrain-local-proof-output.json')
DEFAULT_METADATA = {"ltv": 12000}


def load_module(name: str, relative_path: str):
    module_path = os.path.join(project_root, relative_path)
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_plain_text_normalized(transcript_text: str) -> Dict[str, Any]:
    lines = [line.strip() for line in transcript_text.splitlines() if line.strip()]
    parts = []
    full_lines = []
    customer_lines = []
    agent_name = None
    customer_name = None

    for line in lines:
        if ':' in line:
            speaker, text = line.split(':', 1)
            speaker = speaker.strip()
            text = text.strip()
        else:
            speaker = 'Customer'
            text = line

        if speaker == 'AE':
            part_type = 'Agent'
            agent_name = agent_name or speaker
        else:
            part_type = 'Customer'
            customer_name = customer_name or speaker
            customer_lines.append(text)

        parts.append({"type": part_type, "text": text})
        full_lines.append(f"{speaker}: {text}")

    return {
        "dateTime": datetime.now(timezone.utc).isoformat(),
        "agent": agent_name or 'AE',
        "customer": customer_name or 'Customer',
        "fullTranscript": "\n".join(full_lines),
        "customerTranscript": "\n".join(customer_lines),
        "parts": parts,
    }


def _extract_pain_points(transcript: str):
    sentences = re.split(r'(?<=[.!?])\s+', transcript)
    clues = ["slow", "frustr", "hate", "unauthorized", "bug", "missing", "lack", "need", "difficult", "hard", "error", "rough", "lost"]
    points = []
    for sentence in sentences:
        lowered = sentence.lower()
        if "<email_address>" in lowered or "<phone_number>" in lowered:
            continue
        if any(clue in lowered for clue in clues):
            cleaned = sentence.strip().strip('"')
            if cleaned and cleaned not in points:
                points.append(cleaned)
    return points[:5]


def _extract_competitors(transcript: str):
    matches = re.findall(r'\b(?:Competitor[A-Z]\w*|Salesforce|Slack|Shopify|Excel)\b', transcript)
    seen = []
    for item in matches:
        if item not in seen:
            seen.append(item)
    return seen


def _extract_innovations(transcript: str):
    sentences = re.split(r'(?<=[.!?])\s+', transcript)
    triggers = ["need", "would love", "wish", "could", "should", "feature", "export", "integration", "connector", "api", "guided checklist", "clearer handoff"]
    ideas = []
    for sentence in sentences:
        lowered = sentence.lower()
        if "<email_address>" in lowered or "<phone_number>" in lowered:
            continue
        if any(trigger in lowered for trigger in triggers):
            cleaned = sentence.strip().strip('"')
            if cleaned and cleaned not in ideas:
                ideas.append(cleaned)
    return ideas[:5]


def deterministic_extract(transcript: str, source_provider: str, provider_warning: Optional[str] = None, raw_response: Optional[str] = None) -> Dict[str, Any]:
    text = transcript.strip()
    lowered = text.lower()
    pain_points = _extract_pain_points(text)
    competitors = _extract_competitors(text)
    innovation = _extract_innovations(text)

    positive_hits = sum(1 for token in ["love", "great", "good", "cleaner", "cool", "saved me", "pretty good"] if token in lowered)
    negative_hits = sum(1 for token in ["frustrating", "frustration", "rough", "slow", "hate", "bug", "unauthorized", "missing", "lack", "difficult", "hard", "lost"] if token in lowered)

    if negative_hits > positive_hits:
        sentiment = "Negative"
    elif positive_hits > negative_hits:
        sentiment = "Positive"
    elif positive_hits or negative_hits:
        sentiment = "Neutral / Mixed"
    else:
        sentiment = "Neutral"

    if "frustrat" in lowered:
        emotion = "Frustration"
    elif "confus" in lowered or "not sure" in lowered:
        emotion = "Confusion"
    elif positive_hits and negative_hits:
        emotion = "Mixed"
    elif positive_hits:
        emotion = "Satisfaction"
    else:
        emotion = "Neutral"

    if any(token in lowered for token in ["three hours", "high effort", "very slow", "hard", "difficult"]):
        effort = "High"
    elif any(token in lowered for token in ["two afternoons", "two hours", "manual", "missing", "need", "trying", "rough"]):
        effort = "Medium"
    else:
        effort = "Low"

    summary_bits = []
    if pain_points:
        summary_bits.append(f"Pain points: {', '.join(pain_points[:2])}")
    if competitors:
        summary_bits.append(f"Competitors: {', '.join(competitors[:2])}")
    if innovation:
        summary_bits.append(f"Requested improvements: {', '.join(innovation[:2])}")
    if not summary_bits:
        summary_bits.append(text[:160].strip())

    result = {
        "sentiment": sentiment,
        "pain_points": pain_points,
        "emotion": emotion,
        "effort": effort,
        "competitors": competitors,
        "innovation": innovation,
        "summary": "; ".join(summary_bits),
        "providerUsed": source_provider,
        "deterministic": True,
    }
    if provider_warning:
        result["providerWarning"] = provider_warning
    if raw_response:
        result["raw_response"] = raw_response
    return result


def run_pipeline(transcript_path: str, output_path: str, provider: str = 'ollama') -> Dict[str, Any]:
    extractor_module = load_module('agilitas_extractor', os.path.join('services', 'agilitas-ai-core', 'extractor.py'))
    scoring_module = load_module('agilitas_scoring', os.path.join('services', 'agilitas-business-engine', 'scoring_engine.py'))
    action_module = load_module('agilitas_action_engine', os.path.join('services', 'agilitas-action-engine', 'generator.py'))
    redaction_module = load_module('agilitas_redaction', os.path.join('services', 'agilitas-ai-core', 'redaction', 'presidio_redactor.py'))

    AgilitasExtractor = extractor_module.AgilitasExtractor
    calculate_kpis = scoring_module.calculate_kpis
    AgilitasActionEngine = action_module.AgilitasActionEngine
    get_redactor = redaction_module.get_redactor

    transcript_file = Path(transcript_path)
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    raw_text = transcript_file.read_text(encoding='utf-8')
    normalized = build_plain_text_normalized(raw_text)
    analysis_text = normalized.get('customerTranscript') or normalized.get('fullTranscript') or raw_text

    redactor = get_redactor()
    redacted_text = redactor.redact(analysis_text)

    init_signature = inspect.signature(AgilitasExtractor.__init__)
    extractor_kwargs = {"use_cloud": False, "redact_pii": True}
    if "deterministic_fallback" in init_signature.parameters:
        extractor_kwargs["deterministic_fallback"] = True
    extractor = AgilitasExtractor(**extractor_kwargs)

    extract_signature = inspect.signature(extractor.extract_dimensions)
    if provider == 'deterministic':
        extraction = deterministic_extract(redacted_text, source_provider='deterministic')
    elif "provider" in extract_signature.parameters:
        extraction = extractor.extract_dimensions(analysis_text, provider=provider)
    else:
        extraction = extractor.extract_dimensions(analysis_text)
        if isinstance(extraction, dict) and extraction.get('error'):
            warning = extraction.get('raw_response') or extraction['error']
            extraction = deterministic_extract(redacted_text, source_provider='deterministic-fallback', provider_warning=warning, raw_response=extraction.get('raw_response'))
        elif isinstance(extraction, dict):
            extraction.setdefault('providerUsed', provider)

    kpis = calculate_kpis(extraction, DEFAULT_METADATA)
    action = AgilitasActionEngine().generate_action(kpis, extraction)

    pii_checks = {
        'email_redacted': 'jamie@example.com' not in redacted_text and '<EMAIL_ADDRESS>' in redacted_text,
        'phone_redacted': '415-555-0188' not in redacted_text and '<PHONE_NUMBER>' in redacted_text,
        'raw_email_present_in_input': 'jamie@example.com' in analysis_text,
        'raw_phone_present_in_input': '415-555-0188' in analysis_text,
    }

    artifact = {
        'run_id': f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-mb-078-retail-proof",
        'card': 'MB-078',
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source': {
            'path': str(transcript_file.relative_to(project_root)),
            'format': 'plain_text',
            'execution_context': 'local-host',
            'provider_requested': provider,
            'ollama_host': os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434'),
        },
        'normalized': normalized,
        'redacted_transcript': redacted_text,
        'pii_checks': pii_checks,
        'extraction': extraction,
        'kpis': kpis,
        'action': action,
        'customer_metadata': DEFAULT_METADATA,
    }

    output_file.write_text(json.dumps(artifact, indent=2) + '\n', encoding='utf-8')
    return artifact


def validate_artifact(artifact: Dict[str, Any]) -> None:
    extraction = artifact['extraction']
    required_dimensions = [
        'sentiment', 'pain_points', 'emotion',
        'effort', 'competitors', 'innovation', 'summary'
    ]
    missing = [d for d in required_dimensions if d not in extraction]
    if missing:
        raise AssertionError(f"Extraction missing required keys: {missing}")

    if not artifact['pii_checks']['email_redacted']:
        raise AssertionError('Email redaction proof failed.')
    if not artifact['pii_checks']['phone_redacted']:
        raise AssertionError('Phone redaction proof failed.')

    provider_used = extraction.get('providerUsed')
    if provider_used not in ('ollama', 'deterministic-fallback', 'deterministic'):
        raise AssertionError(f"Unexpected providerUsed value: {provider_used}")

    if 'loop_type' not in artifact['action'] or 'priority' not in artifact['action']:
        raise AssertionError('Action output is incomplete.')


def main() -> int:
    parser = argparse.ArgumentParser(description='Run the Agilitas local proof pipeline and write a durable artifact.')
    parser.add_argument('--transcript', default=DEFAULT_TRANSCRIPT, help='Path to the transcript input file.')
    parser.add_argument('--output', default=DEFAULT_OUTPUT, help='Path to the JSON proof artifact to write.')
    parser.add_argument('--provider', default='ollama', choices=['ollama', 'deterministic'], help='Provider to request for extraction.')
    args = parser.parse_args()

    print('Starting MB-078 Agilitas local proof pipeline...')
    print(f"Transcript: {os.path.relpath(args.transcript, project_root)}")
    print(f"Output: {os.path.relpath(args.output, project_root)}")
    print(f"Requested provider: {args.provider}")

    artifact = run_pipeline(args.transcript, args.output, provider=args.provider)
    validate_artifact(artifact)

    provider_used = artifact['extraction'].get('providerUsed')
    print('\nRedaction checks:')
    print(json.dumps(artifact['pii_checks'], indent=2))
    print('\nExtraction snapshot:')
    print(json.dumps(artifact['extraction'], indent=2))
    print('\nKPI snapshot:')
    print(json.dumps(artifact['kpis'], indent=2))
    print('\nAction snapshot:')
    print(json.dumps(artifact['action'], indent=2))
    print(f"\nArtifact written: {os.path.relpath(args.output, project_root)}")

    if provider_used == 'ollama':
        print('✅ Live Ollama responded with structured output.')
    elif provider_used == 'deterministic-fallback':
        print('✅ Live Ollama was unavailable; honest deterministic fallback used and recorded.')
    else:
        print('✅ Deterministic proof path executed as requested.')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
