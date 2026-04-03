#!/usr/bin/env python3
import argparse
import importlib.util
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

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
    extractor = AgilitasExtractor(use_cloud=False, redact_pii=True, deterministic_fallback=True)
    extraction = extractor.extract_dimensions(analysis_text, provider=provider)
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
