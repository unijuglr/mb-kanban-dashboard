#!/usr/bin/env python3
import argparse
import importlib.util
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


def _load_module(module_name: str, relative_path: str):
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    module_path = project_root / relative_path
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load module {module_name} from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


normalizer_module = _load_module("agilitas_normalizer", "services/agilitas_ingestor/normalizer.py")
extractor_module = _load_module("agilitas_extractor", "services/agilitas-ai-core/extractor.py")

AgilitasNormalizer = normalizer_module.AgilitasNormalizer
AgilitasExtractor = extractor_module.AgilitasExtractor


class BatchProcessor:
    def __init__(self, use_cloud: bool = False, redact_pii: bool = True, model: Optional[str] = None):
        self.normalizer = AgilitasNormalizer()
        self.extractor = AgilitasExtractor(use_cloud=use_cloud, redact_pii=redact_pii)
        self.model = model or os.getenv("AGILITAS_BATCH_MODEL") or "llama3.2:3b"
        self.provider = "vertex" if use_cloud else "ollama"

    def process_files(self, transcript_paths: List[str]) -> Dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        report_items: List[Dict[str, Any]] = []

        for transcript_path in transcript_paths:
            report_items.append(self.process_file(transcript_path))

        completed_at = datetime.now(timezone.utc)
        success_count = sum(1 for item in report_items if item["status"] == "success")
        failure_count = len(report_items) - success_count

        endpoint = getattr(self.extractor.client, "ollama_endpoint", None) if self.provider == "ollama" else None

        return {
            "pipeline": ["normalize", "redact", "extract"],
            "provider": self.provider,
            "model": self.model,
            "ollama_endpoint": endpoint,
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "transcripts_requested": len(transcript_paths),
            "transcripts_processed": success_count,
            "transcripts_failed": failure_count,
            "results": report_items,
        }

    def process_file(self, transcript_path: str) -> Dict[str, Any]:
        path = Path(transcript_path).resolve()
        item: Dict[str, Any] = {
            "path": str(path),
            "file_name": path.name,
            "status": "success",
        }

        try:
            raw_normalized = self._normalize_input(path)
            normalized = self._sanitize_for_json(raw_normalized)
            redacted_transcript = self._redact_text(normalized.get("fullTranscript", ""))
            extraction = self._extract(redacted_transcript)

            item.update(
                {
                    "input_format": self._detect_format(path),
                    "agent": normalized.get("agent"),
                    "customer": normalized.get("customer"),
                    "normalized": normalized,
                    "redacted_transcript": redacted_transcript,
                    "extraction": extraction,
                }
            )
        except Exception as exc:
            item.update(
                {
                    "status": "error",
                    "error": str(exc),
                }
            )

        return item

    def _detect_format(self, path: Path) -> str:
        suffix = path.suffix.lower()
        if suffix == ".json":
            return "zoom_json"
        if suffix == ".vtt":
            return "teams_vtt"
        if suffix in {".txt", ".md"}:
            return "plain_text"
        raise ValueError(f"Unsupported transcript format for {path.name}")

    def _normalize_input(self, path: Path) -> Dict[str, Any]:
        detected = self._detect_format(path)
        if detected == "zoom_json":
            return self.normalizer.normalize_zoom_json(json.loads(path.read_text()))
        if detected == "teams_vtt":
            return self.normalizer.normalize_teams_vtt(path.read_text())
        if detected == "plain_text":
            text = path.read_text()
            now = datetime.now(timezone.utc).isoformat()
            return {
                "dateTime": now,
                "agent": None,
                "customer": None,
                "fullTranscript": text,
                "customerTranscript": text,
                "parts": [{"type": "Customer", "text": text}],
            }
        raise ValueError(f"Unsupported transcript format for {path.name}")

    def _redact_text(self, transcript: str) -> str:
        redactor = getattr(self.extractor, "redactor", None)
        if redactor is None:
            return transcript
        return redactor.redact(transcript)

    def _extract(self, transcript: str) -> Dict[str, Any]:
        prompt = f"""
        Extract the following 7 dimensions from the transcript below in JSON format:
        1. sentiment: Overall tone (Positive, Neutral, Negative)
        2. pain_points: List of specific obstacles mentioned
        3. emotion: Underlying feeling (Frustration, Delight, etc.)
        4. effort: Perceived difficulty (Low, Medium, High)
        5. competitors: Mentions of rival solutions
        6. innovation: Suggestions for features or improvements
        7. summary: Concise recap

        Transcript:
        {transcript}

        Return ONLY valid JSON.
        """
        response = self.extractor.client.complete(prompt, provider=self.provider, model=self.model)
        if isinstance(response, str):
            clean_response = response.strip()
            if "```json" in clean_response:
                clean_response = clean_response.split("```json", 1)[1].split("```", 1)[0].strip()
            elif clean_response.startswith("```") and clean_response.count("```") >= 2:
                clean_response = clean_response.split("```", 2)[1].strip()
            return json.loads(clean_response)
        raise ValueError("Unexpected non-string response from LLM client")

    def _sanitize_for_json(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {key: self._sanitize_for_json(subvalue) for key, subvalue in value.items()}
        if isinstance(value, list):
            return [self._sanitize_for_json(item) for item in value]
        if hasattr(value, "value"):
            return value.value
        return value



def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch-process Agilitas transcripts")
    parser.add_argument("transcripts", nargs="+", help="Transcript files to process (.json, .vtt, .txt)")
    parser.add_argument("--output", required=True, help="Path for summary report JSON")
    parser.add_argument("--model", default=None, help="Override Ollama/Vertex model")
    parser.add_argument("--use-cloud", action="store_true", help="Use Vertex AI instead of local Ollama")
    parser.add_argument("--no-redact", action="store_true", help="Disable PII redaction")
    return parser.parse_args(argv)



def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    processor = BatchProcessor(
        use_cloud=args.use_cloud,
        redact_pii=not args.no_redact,
        model=args.model,
    )
    report = processor.process_files(args.transcripts)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2))
    print(json.dumps({
        "output": str(output_path.resolve()),
        "processed": report["transcripts_processed"],
        "failed": report["transcripts_failed"],
        "provider": report["provider"],
        "ollama_endpoint": report.get("ollama_endpoint"),
    }, indent=2))
    return 0 if report["transcripts_failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
