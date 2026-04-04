#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const runner = path.join(root, 'scripts', 'local_coder_proof_run.mjs');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function runHarness(args) {
  return execFileAsync(process.execPath, [runner, ...args], {
    cwd: root,
    maxBuffer: 1024 * 1024 * 4
  });
}

async function main() {
  const successRunId = 'mb-025-proof-harness-success';
  const failureRunId = 'mb-025-proof-harness-failure';
  const diagnosticRunId = 'mb-025-proof-harness-diagnostic';

  await runHarness([
    '--run-id', successRunId,
    '--label', 'success-case',
    '--request', 'Create a tiny proof workspace, write a file, and validate its contents.',
    '--command', `cat <<'EOF' > artifacts/local-coder-runs/${successRunId}/workspace/hello.txt\nproof ok\nEOF`,
    '--validation-command', `test -f artifacts/local-coder-runs/${successRunId}/workspace/hello.txt && grep -q "proof ok" artifacts/local-coder-runs/${successRunId}/workspace/hello.txt`
  ]);

  let failureErrored = false;
  try {
    await runHarness([
      '--run-id', failureRunId,
      '--label', 'failure-case',
      '--request', 'Run an intentionally failing bounded command so the harness preserves the failure honestly.',
      '--command', `echo 'about to fail' > artifacts/local-coder-runs/${failureRunId}/workspace/notes.txt; exit 7`,
      '--validation-command', `test -f artifacts/local-coder-runs/${failureRunId}/workspace/notes.txt`
    ]);
  } catch (error) {
    failureErrored = true;
    if (typeof error.code !== 'number' || error.code !== 1) {
      throw error;
    }
  }

  const diagnostic = await runHarness([
    '--run-id', diagnosticRunId,
    '--label', 'diagnostic-case',
    '--request', 'Capture PATH and Ollama diagnostics only without running a main command.',
    '--diagnostic-only'
  ]);

  const successManifest = await readJson(path.join(root, 'artifacts', 'local-coder-runs', successRunId, 'manifest.json'));
  const failureManifest = await readJson(path.join(root, 'artifacts', 'local-coder-runs', failureRunId, 'manifest.json'));
  const diagnosticManifest = await readJson(path.join(root, 'artifacts', 'local-coder-runs', diagnosticRunId, 'manifest.json'));

  if (successManifest.status !== 'success') {
    throw new Error(`Expected success manifest status=success, got ${successManifest.status}`);
  }
  if (failureManifest.status !== 'failed') {
    throw new Error(`Expected failure manifest status=failed, got ${failureManifest.status}`);
  }
  if (diagnosticManifest.status !== 'diagnostic-only') {
    throw new Error(`Expected diagnostic manifest status=diagnostic-only, got ${diagnosticManifest.status}`);
  }
  if (!failureErrored) {
    throw new Error('Expected the failing harness run to exit non-zero');
  }
  if (!Array.isArray(successManifest.outputs) || successManifest.outputs.length === 0) {
    throw new Error('Expected success run to capture at least one workspace output');
  }
  if (!Array.isArray(diagnosticManifest.outputs) || diagnosticManifest.outputs.length !== 0) {
    throw new Error('Expected diagnostic-only run to capture zero workspace outputs');
  }

  console.log(JSON.stringify({
    ok: true,
    runs: {
      success: {
        run_id: successRunId,
        manifest: path.join('artifacts', 'local-coder-runs', successRunId, 'manifest.json')
      },
      failure: {
        run_id: failureRunId,
        manifest: path.join('artifacts', 'local-coder-runs', failureRunId, 'manifest.json')
      },
      diagnostic: {
        run_id: diagnosticRunId,
        manifest: path.join('artifacts', 'local-coder-runs', diagnosticRunId, 'manifest.json')
      }
    },
    stdout_samples: {
      diagnostic: diagnostic.stdout.trim()
    }
  }, null, 2));
}

await main();
