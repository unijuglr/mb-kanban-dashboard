import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pipelineRoot = path.join(root, 'motherbrain-pipeline');
const runner = path.join(root, 'scripts', 'mb_pipeline_runner.mjs');
const seededTaskId = 'mb-026-safe-proof-task';
const seededTaskPath = path.join(pipelineRoot, 'inbox', `${seededTaskId}.json`);
const failingTaskId = 'mb-026-safe-proof-task-failure';
const failingTaskPath = path.join(pipelineRoot, 'inbox', `${failingTaskId}.json`);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function removeIfExists(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function resetSeededTask() {
  const task = {
    schema_version: 1,
    id: seededTaskId,
    created_at: '2026-04-03T23:20:00Z',
    project: 'mb-kanban-dashboard',
    card: 'MB-026',
    stage: 'coder',
    status: 'queued',
    working_dir: path.join(pipelineRoot, 'logs', seededTaskId, 'workspace'),
    prompt_file: 'motherbrain-pipeline/templates/mb-026-safe-proof-prompt.md',
    expected_outputs: ['notes.txt', 'result.json'],
    validation: {
      command: 'find . -maxdepth 1 \\( -name notes.txt -o -name result.json \\) | sort',
      timeout_seconds: 30,
      must_create: ['notes.txt', 'result.json']
    },
    handoff: {
      qa_required: true,
      devops_required: false
    },
    attempt: 0,
    max_attempts: 2,
    artifacts_dir: 'motherbrain-pipeline/logs/mb-026-safe-proof-task',
    notes: [
      'Seeded as a non-destructive first pilot task for the file-backed pipeline.',
      'This task is intentionally tiny so failure handling can be verified before real repo edits are attempted.'
    ]
  };
  await writeJson(seededTaskPath, task);
}

async function createFailingTask() {
  const task = {
    schema_version: 1,
    id: failingTaskId,
    created_at: '2026-04-03T23:45:00Z',
    project: 'mb-kanban-dashboard',
    card: 'MB-026',
    stage: 'coder',
    status: 'queued',
    working_dir: path.join(pipelineRoot, 'logs', failingTaskId, 'workspace'),
    prompt_file: 'motherbrain-pipeline/templates/mb-026-safe-proof-prompt.md',
    expected_outputs: ['notes.txt', 'result.json', 'missing.txt'],
    validation: {
      command: 'find . -maxdepth 1 \\( -name notes.txt -o -name result.json -o -name missing.txt \\) | sort',
      timeout_seconds: 30,
      must_create: ['notes.txt', 'result.json', 'missing.txt']
    },
    handoff: {
      qa_required: true,
      devops_required: false
    },
    attempt: 0,
    max_attempts: 1,
    artifacts_dir: 'motherbrain-pipeline/logs/mb-026-safe-proof-task-failure',
    notes: [
      'Deliberately expects a file the deterministic safe-proof coder does not create.',
      'Used to prove durable failure capture for MB-026 without touching the repo tree.'
    ]
  };
  await writeJson(failingTaskPath, task);
}

async function runRunner(command, taskPath) {
  return execFileAsync(process.execPath, [runner, command, taskPath], {
    cwd: root,
    maxBuffer: 1024 * 1024
  });
}

async function main() {
  await removeIfExists(path.join(pipelineRoot, 'claimed', `${seededTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'qa', `${seededTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'done', `${seededTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'failed', `${seededTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'logs', seededTaskId));

  await removeIfExists(path.join(pipelineRoot, 'claimed', `${failingTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'qa', `${failingTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'done', `${failingTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'failed', `${failingTaskId}.json`));
  await removeIfExists(path.join(pipelineRoot, 'logs', failingTaskId));

  await resetSeededTask();
  await createFailingTask();

  const successRun = await runRunner('run-all', seededTaskPath);
  const failureRun = await runRunner('run-coder', failingTaskPath);

  const coderManifest = await readJson(path.join(pipelineRoot, 'logs', seededTaskId, 'coder-manifest.json'));
  const qaManifest = await readJson(path.join(pipelineRoot, 'logs', seededTaskId, 'qa-manifest.json'));
  const failedManifest = await readJson(path.join(pipelineRoot, 'logs', failingTaskId, 'coder-manifest.json'));
  const successTask = await readJson(path.join(pipelineRoot, 'done', `${seededTaskId}.json`));
  const failedTask = await readJson(path.join(pipelineRoot, 'failed', `${failingTaskId}.json`));

  if (coderManifest.result !== 'passed') throw new Error('Seeded coder manifest did not pass');
  if (qaManifest.result !== 'passed') throw new Error('Seeded QA manifest did not pass');
  if (failedManifest.result !== 'failed') throw new Error('Failing manifest did not fail');
  if (failedManifest.failure_tag !== 'missing_outputs') throw new Error(`Expected missing_outputs failure, got ${failedManifest.failure_tag}`);
  if (successTask.status !== 'done') throw new Error(`Expected success task to be done, got ${successTask.status}`);
  if (failedTask.status !== 'failed') throw new Error(`Expected failed task to be failed, got ${failedTask.status}`);

  console.log(JSON.stringify({
    ok: true,
    seeded_task: seededTaskId,
    failed_task: failingTaskId,
    success: {
      coder_manifest: path.join('motherbrain-pipeline', 'logs', seededTaskId, 'coder-manifest.json'),
      qa_manifest: path.join('motherbrain-pipeline', 'logs', seededTaskId, 'qa-manifest.json'),
      final_task: path.join('motherbrain-pipeline', 'done', `${seededTaskId}.json`)
    },
    failure: {
      coder_manifest: path.join('motherbrain-pipeline', 'logs', failingTaskId, 'coder-manifest.json'),
      final_task: path.join('motherbrain-pipeline', 'failed', `${failingTaskId}.json`)
    },
    runner_outputs: {
      success_stdout: successRun.stdout.trim(),
      failure_stdout: failureRun.stdout.trim()
    }
  }, null, 2));
}

await main();
