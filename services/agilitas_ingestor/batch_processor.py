#!/usr/bin/env python3
import argparse
import importlib.util
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional
import re

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent


def _load_module(name: str, relative_path: str):
    module_path = PROJECT_ROOT / relative_path
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


normalizer_module = _load_module("agilitas_normalizer", "services/agilitas_ingestor/normalizer.py")
extractor_module = _load_module("agilitas_extractor", "services/agilitas-ai-core/extractor.py")

AgilitasNormalizer = normalizer_module.AgilitasNormalizer
AgilitasExtractor = extractor_module.AgilitasExtractor


@dataclass
class BatchFileResult:
    input_path: str
    format: str
    status: str
    normalized: Optional[Dict[str, Any]]
    extraction: Optional[Dict[str, Any]]
    output_path: Optional[str]
    error: Optional[str] = None


class AgilitasBatchProcessor:
    """Run multiple transcript files through normalization + extraction."""

    def __init__(
        self,
        use_cloud: bool = False,
        redact_pii: bool = True,
        extraction_provider: Optional[str] = None,
        deterministic_fallback: bool = True,
    ):
        self.normalizer = AgilitasNormalizer()
        self.extractor = AgilitasExtractor(
            use_cloud=use_cloud,
            redact_pii=redact_pii,
        )
        self.extraction_provider = extraction_provider
        self.deterministic_fallback = deterministic_fallback

    def detect_format(self, path: Path) -> str:
        suffix = path.suffix.lower()
        if suffix == ".json":
            return "zoom_json"
        if suffix == ".vtt":
            return "teams_vtt"
        if suffix in {".txt", ".md"}:
            return "plain_text"
        raise ValueError(f"Unsupported transcript format: {path.name}")

    def normalize_file(self, path: Path) -> Dict[str, Any]:
        source_format = self.detect_format(path)
        if source_format == "zoom_json":
            data = json.loads(path.read_text())
            normalized = self.normalizer.normalize_zoom_json(data)
        elif source_format == "teams_vtt":
            normalized = self.normalizer.normalize_teams_vtt(path.read_text(), datetime.now(timezone.utc).isoformat())
        elif source_format == "plain_text":
            text = path.read_text().strip()
            normalized = {
                "dateTime": datetime.now(timezone.utc).isoformat(),
                "agent": None,
                "customer": None,
                "fullTranscript": text,
                "customerTranscript": text,
                "parts": [],
            }
        else:
            raise ValueError(f"Unhandled transcript format: {source_format}")

        normalized["sourceFormat"] = source_format
        normalized["sourcePath"] = str(path)
        return normalized

    def _deterministic_extract(self, transcript: str) -> Dict[str, Any]:
        processed = transcript
        redactor = getattr(self.extractor, "redactor", None)
        if redactor:
            processed = redactor.redact(transcript)

        lines = [line.strip() for line in processed.splitlines() if line.strip()]
        lowered = processed.lower()

        pain_markers = (
            "trouble",
            "rough",
            "cannot",
            "can't",
            "slow",
            "friction",
            "problem",
            "issue",
            "delay",
            "gave up",
            "effort",
            "hard",
            "hate",
        )
        innovation_markers = (
            "if the product had",
            "feature",
            "features",
            "improvement",
            "would probably stay",
            "checklist",
            "integrat",
        )

        emotion = "Neutral"
        if any(marker in lowered for marker in ("frustrat", "rough", "gave up", "hate")):
            emotion = "Frustration"
        elif any(marker in lowered for marker in ("delight", "love", "great", "excited")):
            emotion = "Delight"

        sentiment = "Neutral"
        if any(marker in lowered for marker in ("frustrat", "rough", "slow", "problem", "issue", "hate", "cannot", "can't")):
            sentiment = "Negative"
        elif any(marker in lowered for marker in ("love", "great", "helpful", "smooth")):
            sentiment = "Positive"

        effort = "Low"
        if any(marker in lowered for marker in ("two afternoons", "too much effort", "high effort", "difficult")):
            effort = "Medium"
        if any(marker in lowered for marker in ("very hard", "extremely difficult", "impossible")):
            effort = "High"

        pain_points = [line for line in lines if any(marker in line.lower() for marker in pain_markers)]
        innovation = [line for line in lines if any(marker in line.lower() for marker in innovation_markers)]
        competitors = sorted(set(re.findall(r"\b[A-Z][A-Za-z0-9]+(?:Co|AI|CRM|Suite|Cloud)\b", processed)))

        summary_parts: List[str] = []
        if pain_points:
            summary_parts.append(f"Pain points: {', '.join(pain_points[:2])}")
        if competitors:
            summary_parts.append(f"Competitors: {', '.join(competitors)}")
        if innovation:
            summary_parts.append(f"Requested improvements: {', '.join(innovation[:1])}")
        if not summary_parts:
            summary_parts.append(lines[0] if lines else "No transcript content provided.")

        return {
            "sentiment": sentiment,
            "pain_points": pain_points,
            "emotion": emotion,
            "effort": effort,
            "competitors": competitors,
            "innovation": innovation,
            "summary": "; ".join(summary_parts),
            "providerUsed": "deterministic",
            "deterministic": True,
        }

    def _extract(self, transcript: str) -> Dict[str, Any]:
        if self.extraction_provider == "deterministic":
            return self._deterministic_extract(transcript)
        try:
            extraction = self.extractor.extract_dimensions(transcript)
        except Exception:
            if self.deterministic_fallback:
                return self._deterministic_extract(transcript)
            raise
        if self.deterministic_fallback and isinstance(extraction, dict) and extraction.get("error"):
            return self._deterministic_extract(transcript)
        if isinstance(extraction, dict):
            extraction.setdefault("providerUsed", self.extraction_provider or ("vertex" if self.extractor.use_cloud else "ollama"))
            extraction.setdefault("deterministic", False)
        return extraction

    def process_file(self, path: Path, output_dir: Optional[Path] = None) -> BatchFileResult:
        try:
            normalized = self.normalize_file(path)
            extraction = self._extract(normalized.get("fullTranscript", ""))
            output_path = None
            if output_dir:
                output_dir.mkdir(parents=True, exist_ok=True)
                output_path = str(output_dir / f"{path.stem}.batch-result.json")
                Path(output_path).write_text(
                    json.dumps(
                        {
                            "inputPath": str(path),
                            "normalized": normalized,
                            "extraction": extraction,
                        },
                        indent=2,
                        default=str,
                    ) + "\n"
                )
            return BatchFileResult(
                input_path=str(path),
                format=normalized["sourceFormat"],
                status="ok",
                normalized=normalized,
                extraction=extraction,
                output_path=output_path,
            )
        except Exception as exc:
            return BatchFileResult(
                input_path=str(path),
                format="unknown",
                status="error",
                normalized=None,
                extraction=None,
                output_path=None,
                error=str(exc),
            )

    def process_paths(self, input_paths: Iterable[str], output_dir: Optional[str] = None) -> Dict[str, Any]:
        resolved_paths: List[Path] = []
        for item in input_paths:
            candidate = Path(item)
            if candidate.is_dir():
                resolved_paths.extend(sorted(p for p in candidate.iterdir() if p.is_file()))
            elif candidate.is_file():
                resolved_paths.append(candidate)
            else:
                raise FileNotFoundError(f"Input path not found: {item}")

        if not resolved_paths:
            raise ValueError("No transcript files found to process.")

        out_dir = Path(output_dir) if output_dir else None
        results = [self.process_file(path, out_dir) for path in resolved_paths]
        success_count = sum(1 for item in results if item.status == "ok")
        error_count = len(results) - success_count
        return {
            "batchId": f"agilitas-batch-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            "processedAt": datetime.now(timezone.utc).isoformat(),
            "deterministicOfflineFriendly": True,
            "requestedProvider": self.extraction_provider or ("vertex" if self.extractor.use_cloud else "ollama"),
            "resultCounts": {
                "total": len(results),
                "ok": success_count,
                "error": error_count,
            },
            "results": [item.__dict__ for item in results],
        }


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run Agilitas batch transcript processing.")
    parser.add_argument("inputs", nargs="+", help="Transcript files or directories to process")
    parser.add_argument("--output-dir", help="Optional directory for per-file JSON outputs")
    parser.add_argument(
        "--provider",
        choices=["ollama", "vertex", "deterministic"],
        default="deterministic",
        help="Extraction provider. Default is deterministic for offline-friendly QA.",
    )
    parser.add_argument("--use-cloud", action="store_true", help="Use cloud settings when provider=vertex")
    parser.add_argument("--no-redact", action="store_true", help="Disable PII redaction")
    parser.add_argument("--report", help="Optional path to write the batch summary JSON")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    processor = AgilitasBatchProcessor(
        use_cloud=args.use_cloud,
        redact_pii=not args.no_redact,
        extraction_provider=args.provider,
        deterministic_fallback=True,
    )
    report = processor.process_paths(args.inputs, output_dir=args.output_dir)
    payload = json.dumps(report, indent=2, default=str)
    print(payload)
    if args.report:
        report_path = Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(payload + "\n")
    return 0 if report["resultCounts"]["error"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
