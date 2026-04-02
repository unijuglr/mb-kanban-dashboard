#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPORT_PATH = PROJECT_ROOT / 'docs' / 'agilitas' / 'mb-092-batch-report.json'


def run(command):
    return subprocess.run(command, cwd=PROJECT_ROOT, text=True, capture_output=True)


def main() -> int:
    with tempfile.TemporaryDirectory(prefix='mb-092-') as tmp_dir:
        tmp_path = Path(tmp_dir)
        output_dir = tmp_path / 'outputs'

        command = [
            sys.executable,
            'services/agilitas_ingestor/batch_processor.py',
            str(PROJECT_ROOT / 'data' / 'agilitas' / 'samples' / 'zoom-sample.json'),
            str(PROJECT_ROOT / 'data' / 'agilitas' / 'samples' / 'teams-sample.vtt'),
            str(PROJECT_ROOT / 'data' / 'demo' / 'transcript_retail.txt'),
            '--provider',
            'deterministic',
            '--output-dir',
            str(output_dir),
            '--report',
            str(REPORT_PATH),
        ]
        result = run(command)
        if result.returncode != 0:
            sys.stderr.write(result.stdout)
            sys.stderr.write(result.stderr)
            return result.returncode

        report = json.loads(REPORT_PATH.read_text())
        assert report['resultCounts']['total'] == 3, report
        assert report['resultCounts']['ok'] == 3, report
        assert report['deterministicOfflineFriendly'] is True, report

        report['batchId'] = 'mb-092-proof-batch'
        report['processedAt'] = '2026-04-02T00:00:00Z'
        for item in report['results']:
            item['output_path'] = '<temp-output>'
            normalized = item.get('normalized') or {}
            if item['format'] in {'teams_vtt', 'plain_text'} and normalized.get('dateTime'):
                normalized['dateTime'] = '2026-04-02T00:00:00Z'
        REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n')

        formats = {item['format'] for item in report['results']}
        assert formats == {'zoom_json', 'teams_vtt', 'plain_text'}, formats

        for item in report['results']:
            extraction = item['extraction']
            assert extraction['deterministic'] is True, extraction
            assert extraction['providerUsed'] == 'deterministic', extraction
            for key in ['sentiment', 'pain_points', 'emotion', 'effort', 'competitors', 'innovation', 'summary']:
                assert key in extraction, extraction

        print(json.dumps({
            'ok': True,
            'reportPath': str(REPORT_PATH),
            'formats': sorted(formats),
            'outputDir': str(output_dir),
            'resultCounts': report['resultCounts'],
        }, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
