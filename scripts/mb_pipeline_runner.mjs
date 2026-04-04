import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pipelineRoot = path.join(root, 'motherbrain-pipeline');
const failureTags = new Set([
  'launch_failure',
  'routing_reject',
  'tool_execution_failure',
  'hang_timeout',
  'missing_outputs',
  'validation_failure',
  'human_intervention_required'
]);

function nowIso() {
  return new Date().toISOString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function sha256(file) {
  const contents = await fs.readFile(file);
  return createHash('sha256').update(contents).digest('hex');
}

async function collectOutputs(task, manifestDir) {
  const outputs = [];
  for (const relative of task.expected_outputs ?? []) {
    const absolute = path.join(task.working_dir, relative);
    if (await exists(absolute)) {
      outputs.push({
        path: relative,
        sha256: await sha256(absolute)
      });
    }
  }
  await writeJson(path.join(manifestDir, 'outputs.json'), outputs);
  return outputs;
}

async function runValidation(task) {
  const validation = task.validation ?? {};
  if (!validation.command) {
    return { command: null, exit_code: 0, stdout: '', stderr: '', timed_out: false };
  }

  const timeoutMs = (validation.timeout_seconds ?? 30) * 1000;
  try {
    const validationEnv = { ...process.env };
    delete validationEnv.npm_config_prefix;
    const result = await execFileAsync('/bin/bash', ['-lc', validation.command], {
      cwd: task.working_dir,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
      env: validationEnv
    });
    return {
      command: validation.command,
      exit_code: 0,
      stdout: result.stdout,
      stderr: result.stderr,
      timed_out: false
    };
  } catch (error) {
    return {
      command: validation.command,
      exit_code: typeof error.code === 'number' ? error.code : 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? String(error.message ?? error),
      timed_out: Boolean(error.killed || error.signal === 'SIGTERM')
    };
  }
}

async function assertMustCreate(task) {
  const missing = [];
  for (const relative of task.validation?.must_create ?? []) {
    if (!(await exists(path.join(task.working_dir, relative)))) {
      missing.push(relative);
    }
  }
  return missing;
}

async function loadTask(taskPath) {
  const absolute = path.resolve(taskPath);
  const task = await readJson(absolute);
  return { absolute, task };
}

async function moveTask(currentPath, nextDir, task) {
  const nextPath = path.join(nextDir, path.basename(currentPath));
  await ensureDir(nextDir);
  await writeJson(currentPath, task);
  await fs.rename(currentPath, nextPath);
  return nextPath;
}

function classifyFailure({ validationResult, missingOutputs, errorTag }) {
  if (errorTag && failureTags.has(errorTag)) return errorTag;
  if (missingOutputs.length > 0) return 'missing_outputs';
  if (validationResult?.timed_out) return 'hang_timeout';
  if ((validationResult?.exit_code ?? 0) !== 0) return 'validation_failure';
  return 'tool_execution_failure';
}

async function executeCoderTask(task, manifestDir) {
  const promptPath = path.resolve(root, task.prompt_file);
  const promptText = await fs.readFile(promptPath, 'utf8');
  await ensureDir(task.working_dir);
  await fs.writeFile(path.join(manifestDir, 'prompt.md'), promptText, 'utf8');

  if (promptText.includes('Create exactly these files in the task working directory and nowhere else:')) {
    await fs.writeFile(path.join(task.working_dir, 'notes.txt'), `Task ${task.id} completed by deterministic file-backed coder runner.\n`, 'utf8');
    await writeJson(path.join(task.working_dir, 'result.json'), {
      task_id: task.id,
      status: 'completed'
    });
    return {
      command: 'deterministic-safe-proof-writer',
      exit_code: 0,
      stdout: 'Wrote notes.txt and result.json for safe proof task.\n',
      stderr: ''
    };
  }

  if (task.execution?.type === 'write_files' && Array.isArray(task.execution.files)) {
    for (const file of task.execution.files) {
      await fs.writeFile(path.join(task.working_dir, file.path), file.content, 'utf8');
    }
    return {
      command: 'deterministic-write-files',
      exit_code: 0,
      stdout: `Wrote ${task.execution.files.length} files.\n`,
      stderr: ''
    };
  }

  throw Object.assign(new Error(`No deterministic executor available for task ${task.id}`), {
    failureTag: 'tool_execution_failure'
  });
}

async function runCoder(taskPath) {
  let { absolute, task } = await loadTask(taskPath);
  const startedAt = nowIso();
  const artifactsDir = path.resolve(root, task.artifacts_dir);
  await ensureDir(artifactsDir);
  await ensureDir(task.working_dir);

  task.attempt = (task.attempt ?? 0) + 1;
  task.status = 'running';
  task.stage = 'coder';
  task.notes = [...(task.notes ?? []), `Coder run started at ${startedAt}`];

  if (absolute.includes(`${path.sep}inbox${path.sep}`)) {
    absolute = await moveTask(absolute, path.join(pipelineRoot, 'claimed'), task);
  } else {
    await writeJson(absolute, task);
  }

  const manifest = {
    task_id: task.id,
    runner: 'coder',
    started_at: startedAt,
    ended_at: null,
    command: null,
    exit_code: null,
    outputs: [],
    validation: null,
    result: 'failed',
    failure_tag: null
  };

  let validationResult = null;
  let missingOutputs = [];

  try {
    const executionResult = await executeCoderTask(task, artifactsDir);
    manifest.command = executionResult.command;
    manifest.exit_code = executionResult.exit_code;
    await fs.writeFile(path.join(artifactsDir, 'coder.stdout.log'), executionResult.stdout ?? '', 'utf8');
    await fs.writeFile(path.join(artifactsDir, 'coder.stderr.log'), executionResult.stderr ?? '', 'utf8');

    validationResult = await runValidation(task);
    missingOutputs = await assertMustCreate(task);
    manifest.validation = validationResult;
    manifest.outputs = await collectOutputs(task, artifactsDir);

    if (executionResult.exit_code === 0 && validationResult.exit_code === 0 && missingOutputs.length === 0) {
      manifest.result = 'passed';
      task.status = 'queued';
      task.stage = 'qa';
      task.notes.push(`Coder run passed at ${nowIso()}`);
      absolute = await moveTask(absolute, path.join(pipelineRoot, 'qa'), task);
    } else {
      manifest.failure_tag = classifyFailure({ validationResult, missingOutputs });
      task.status = 'failed';
      task.stage = 'coder';
      task.notes.push(`Coder run failed at ${nowIso()} with ${manifest.failure_tag}`);
      absolute = await moveTask(absolute, path.join(pipelineRoot, 'failed'), task);
    }
  } catch (error) {
    const message = String(error.stack ?? error.message ?? error);
    await fs.writeFile(path.join(artifactsDir, 'coder.stderr.log'), message + '\n', 'utf8');
    validationResult = await runValidation(task);
    missingOutputs = await assertMustCreate(task);
    manifest.command = manifest.command ?? 'deterministic-executor';
    manifest.exit_code = 1;
    manifest.validation = validationResult;
    manifest.outputs = await collectOutputs(task, artifactsDir);
    manifest.failure_tag = classifyFailure({
      validationResult,
      missingOutputs,
      errorTag: error.failureTag
    });
    task.status = 'failed';
    task.stage = 'coder';
    task.notes.push(`Coder run failed at ${nowIso()} with ${manifest.failure_tag}`);
    absolute = await moveTask(absolute, path.join(pipelineRoot, 'failed'), task);
  }

  manifest.ended_at = nowIso();
  await writeJson(path.join(artifactsDir, 'coder-manifest.json'), manifest);
  await writeJson(path.join(artifactsDir, 'task-final.json'), task);
  console.log(JSON.stringify({ ok: true, runner: 'coder', task_file: absolute, manifest }, null, 2));
}

async function runQa(taskPath) {
  let { absolute, task } = await loadTask(taskPath);
  const artifactsDir = path.resolve(root, task.artifacts_dir);
  await ensureDir(artifactsDir);
  const startedAt = nowIso();
  task.status = 'running';
  task.stage = 'qa';
  task.notes = [...(task.notes ?? []), `QA run started at ${startedAt}`];
  await writeJson(absolute, task);

  const validationResult = await runValidation(task);
  const missingOutputs = await assertMustCreate(task);
  const outputs = await collectOutputs(task, artifactsDir);
  const manifest = {
    task_id: task.id,
    runner: 'qa',
    started_at: startedAt,
    ended_at: nowIso(),
    command: validationResult.command,
    exit_code: validationResult.exit_code,
    outputs,
    validation: validationResult,
    result: 'failed',
    failure_tag: null
  };

  await fs.writeFile(path.join(artifactsDir, 'qa.stdout.log'), validationResult.stdout ?? '', 'utf8');
  await fs.writeFile(path.join(artifactsDir, 'qa.stderr.log'), validationResult.stderr ?? '', 'utf8');

  if (validationResult.exit_code === 0 && missingOutputs.length === 0) {
    manifest.result = 'passed';
    task.status = 'done';
    task.stage = 'done';
    task.notes.push(`QA run passed at ${nowIso()}`);
    absolute = await moveTask(absolute, path.join(pipelineRoot, 'done'), task);
  } else {
    manifest.failure_tag = classifyFailure({ validationResult, missingOutputs });
    task.status = 'failed';
    task.stage = 'qa';
    task.notes.push(`QA run failed at ${nowIso()} with ${manifest.failure_tag}`);
    absolute = await moveTask(absolute, path.join(pipelineRoot, 'failed'), task);
  }

  await writeJson(path.join(artifactsDir, 'qa-manifest.json'), manifest);
  await writeJson(path.join(artifactsDir, 'task-final.json'), task);
  console.log(JSON.stringify({ ok: true, runner: 'qa', task_file: absolute, manifest }, null, 2));
}

async function runAll(taskPath) {
  await runCoder(taskPath);
  const taskName = path.basename(taskPath);
  const qaPath = path.join(pipelineRoot, 'qa', taskName);
  if (await exists(qaPath)) {
    await runQa(qaPath);
  }
}

const [command, taskPath] = process.argv.slice(2);

if (!command || !taskPath) {
  console.error('Usage: node scripts/mb_pipeline_runner.mjs <run-coder|run-qa|run-all> <task-json-path>');
  process.exit(1);
}

if (command === 'run-coder') {
  await runCoder(taskPath);
} else if (command === 'run-qa') {
  await runQa(taskPath);
} else if (command === 'run-all') {
  await runAll(taskPath);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
