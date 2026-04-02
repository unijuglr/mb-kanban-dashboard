#!/usr/bin/env python3
import json
import os
import sys
import importlib.util

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, project_root)


def load_module(name: str, relative_path: str):
    module_path = os.path.join(project_root, relative_path)
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def qa_agilitas_extraction():
    print("Starting QA of Agilitas Core AI Extraction Pipeline (offline-friendly)...")
    extractor_module = load_module("agilitas_extractor", os.path.join('services', 'agilitas-ai-core', 'extractor.py'))
    AgilitasExtractor = extractor_module.AgilitasExtractor

    test_transcript = (
        "My name is John Doe and my phone is 123-456-7890. I've been trying to use the new dashboard "
        "for our retail client, but it's very slow. Also, we really need a direct export to Shopify, "
        "which CompetitorX already has. The sentiment analysis is cool though."
    )

    extractor = AgilitasExtractor(use_cloud=False, redact_pii=True, deterministic_fallback=True)

    deterministic = extractor.extract_dimensions(test_transcript, provider="deterministic")
    provider_attempt = extractor.extract_dimensions(test_transcript, provider="ollama")

    required_dimensions = [
        "sentiment", "pain_points", "emotion",
        "effort", "competitors", "innovation", "summary"
    ]

    print("\nDeterministic Result:")
    print(json.dumps(deterministic, indent=2))

    missing = [d for d in required_dimensions if d not in deterministic]
    if missing:
        print(f"\n❌ QA Failed: Deterministic extraction missing required keys: {missing}")
        return False

    if "John Doe" in json.dumps(deterministic) or "123-456-7890" in json.dumps(deterministic):
        print("\n❌ QA Failed: PII leaked into deterministic extraction result.")
        return False

    print("\n✅ Deterministic extraction contract passed.")

    if provider_attempt.get("providerUsed") == "deterministic-fallback":
        print("✅ Live Ollama unavailable; verified honest fallback path instead of faking success.")
    elif provider_attempt.get("providerUsed") == "ollama":
        print("✅ Live Ollama path responded with structured output.")
    else:
        print("⚠️ Provider path returned an unexpected mode:")
        print(json.dumps(provider_attempt, indent=2))
        return False

    return True


if __name__ == "__main__":
    success = qa_agilitas_extraction()
    sys.exit(0 if success else 1)
