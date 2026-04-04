#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const artifactsRoot = path.join(root, 'artifacts', 'local-coder-runs');

function usage() {
  console.log(`Usage:
  node scripts/local_coder_proof_run.mjs --run-id <id> --request <text> [options]

Options:
  --command <text>               Exact command to capture and optionally run
  --validation-command <text>    Bounded validation command to run after main command
  --timeout-seconds <n>          Timeout for main command (default: 45)
  --validation-timeout <n>       Timeout for validation command (default: 30)
  --workspace-subdir <name>      Workspace directory name inside the run dir (default: workspace)
  --ollama-url <url>             Override Ollama endpoint (default: $OLLAMA_HOST or http://127.0.0.1:11434)
  --label <text>                 Short run label for result.md
  --diagnostic-only              Never run the main command; record diagnostics only
  --help                         Show this help
`);
}

function parseArgs(argv) {
  const args = {
    timeoutSeconds: 45,
    validationTimeout: 30,
    workspaceSubdir: 'workspace',
    diagnosticOnly: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--run-id':
        args.runId = argv[++i];
        break;
      case '--request':
        args.request = argv[++i];
        break;
      case '--command':
        args.command = argv[++i];
        break;
      case '--validation-command':
        args.validationCommand = argv[++i];
        break;
      case '--timeout-seconds':
        args.timeoutSeconds = Number(argv[++i]);
        break;
      case '--validation-timeout':
        args.validationTimeout = Number(argv[++i]);
        break;
      case '--workspace-subdir':
        args.workspaceSubdir = argv[++i];
        break;
      case '--ollama-url':
        args.ollamaUrl = argv[++i];
        break;
      case '--label':
        args.label = argv[++i];
        break;
      case '--diagnostic-only':
        args.diagnosticOnly = true;
        break;
      case '--help':
        usage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.runId) throw new Error('--run-id is required');
  if (!args.request) throw new Error('--request is required');
  if (!args.diagnosticOnly && !args.command) throw new Error('--command is required unless --diagnostic-only is set');
  if (!Number.isFinite(args.timeoutSeconds) || args.timeoutSeconds <= 0) throw new Error('--timeout-seconds must be > 0');
  if (!Number.isFinite(args.validationTimeout) || args.validationTimeout <= 0) throw new Error('--validation-timeout must be > 0');

  return args;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function removeIfExists(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function writeFile(file, content) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, content, 'utf8');
}

async function appendFile(file, content) {
  await ensureDir(path.dirname(file));
  await fs.appendFile(file, content, 'utf8');
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function listFilesRecursive(baseDir) {
  const results = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        results.push(absolute);
      }
    }
  }
  try {
    await walk(baseDir);
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
  return results.sort();
}

function shellCommand(command, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn('/bin/bash', ['-lc', command], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const startedAt = new Date();

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1500).unref();
    }, timeoutMs);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        code: code ?? null,
        signal: signal ?? null,
        stdout,
        stderr,
        timedOut,
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString()
      });
    });
  });
}

function parseUrlHostPort(urlText) {
  const parsed = new URL(urlText);
  const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
  return {
    href: parsed.href,
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port,
    pathname: parsed.pathname
  };
}

function checkTcp(hostname, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port });
    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish({ ok: true }));
    socket.on('timeout', () => finish({ ok: false, error: `timeout after ${timeoutMs}ms` }));
    socket.on('error', (error) => finish({ ok: false, error: error.message }));
  });
}

async function collectDiagnostics({ ollamaUrl, cwd }) {
  const pathResult = await shellCommand('command -v openclaw || true', cwd, 5000);
  const nodeResult = await shellCommand('command -v node || true', cwd, 5000);
  const ollamaCliResult = await shellCommand('command -v ollama || true', cwd, 5000);
  const parsed = parseUrlHostPort(ollamaUrl);
  const tcp = await checkTcp(parsed.hostname, parsed.port);

  return {
    path: process.env.PATH || '',
    openclaw_on_path: pathResult.stdout.trim() || null,
    node_on_path: nodeResult.stdout.trim() || null,
    ollama_cli_on_path: ollamaCliResult.stdout.trim() || null,
    ollama_endpoint: {
      url: parsed.href,
      hostname: parsed.hostname,
      port: parsed.port,
      protocol: parsed.protocol,
      reachable: tcp.ok,
      error: tcp.ok ? null : tcp.error
    }
  };
}

function classifyRun({ diagnosticOnly, commandResult, validationResult }) {
  if (diagnosticOnly) return { status: 'diagnostic-only', outcome: 'diagnostic-only' };
  if (!commandResult) return { status: 'failed', outcome: 'failed' };
  if (commandResult.timedOut) return { status: 'failed', outcome: 'failed' };
  if (commandResult.code !== 0) return { status: 'failed', outcome: 'failed' };
  if (validationResult) {
    if (validationResult.timedOut) return { status: 'failed', outcome: 'failed' };
    if (validationResult.code !== 0) return { status: 'failed', outcome: 'failed' };
  }
  return { status: 'success', outcome: 'success' };
}

function formatSection(title, body) {
  return `## ${title}\n\n${body.trimEnd()}\n\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runDir = path.join(artifactsRoot, args.runId);
  const workspaceDir = path.join(runDir, args.workspaceSubdir);
  const requestFile = path.join(runDir, 'request.txt');
  const commandFile = path.join(runDir, 'command.txt');
  const agentLogFile = path.join(runDir, 'agent.log');
  const validationFile = path.join(runDir, 'validation.txt');
  const resultFile = path.join(runDir, 'result.md');
  const manifestFile = path.join(runDir, 'manifest.json');
  const startedAt = new Date().toISOString();
  const ollamaUrl = args.ollamaUrl || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  await removeIfExists(runDir);
  await ensureDir(workspaceDir);
  await writeFile(requestFile, `${args.request}\n`);
  await writeFile(commandFile, `${args.command || '(diagnostic-only)'}\n`);
  await writeFile(agentLogFile, '');
  await writeFile(validationFile, '');

  const diagnostics = await collectDiagnostics({ ollamaUrl, cwd: root });

  await appendFile(agentLogFile,
    `=== proof harness metadata ===\n` +
    `run_id=${args.runId}\n` +
    `started_at=${startedAt}\n` +
    `workspace=${workspaceDir}\n` +
    `diagnostic_only=${args.diagnosticOnly}\n\n` +
    `=== path diagnostics ===\n` +
    `PATH=${diagnostics.path}\n` +
    `openclaw_on_path=${diagnostics.openclaw_on_path || ''}\n` +
    `node_on_path=${diagnostics.node_on_path || ''}\n` +
    `ollama_cli_on_path=${diagnostics.ollama_cli_on_path || ''}\n\n` +
    `=== ollama endpoint ===\n` +
    `url=${diagnostics.ollama_endpoint.url}\n` +
    `reachable=${diagnostics.ollama_endpoint.reachable}\n` +
    `error=${diagnostics.ollama_endpoint.error || ''}\n\n`
  );

  let commandResult = null;
  if (!args.diagnosticOnly) {
    await appendFile(agentLogFile, `=== command begin ===\n${args.command}\n\n`);
    commandResult = await shellCommand(args.command, root, args.timeoutSeconds * 1000);
    await appendFile(
      agentLogFile,
      `${commandResult.stdout}${commandResult.stderr}` +
      `\n=== command end ===\n` +
      `exit_code=${commandResult.code}\n` +
      `signal=${commandResult.signal || ''}\n` +
      `timed_out=${commandResult.timedOut}\n` +
      `started_at=${commandResult.startedAt}\n` +
      `ended_at=${commandResult.endedAt}\n\n`
    );
  } else {
    await appendFile(agentLogFile, '=== command skipped ===\ndiagnostic-only mode\n\n');
  }

  let validationResult = null;
  if (args.validationCommand) {
    validationResult = await shellCommand(args.validationCommand, root, args.validationTimeout * 1000);
    await writeFile(
      validationFile,
      `validation_command=${args.validationCommand}\n` +
      `exit_code=${validationResult.code}\n` +
      `signal=${validationResult.signal || ''}\n` +
      `timed_out=${validationResult.timedOut}\n` +
      `started_at=${validationResult.startedAt}\n` +
      `ended_at=${validationResult.endedAt}\n\n` +
      `--- stdout ---\n${validationResult.stdout}` +
      `\n--- stderr ---\n${validationResult.stderr}`
    );
  } else {
    await writeFile(validationFile, 'validation_command=(none)\nstatus=skipped\n');
  }

  const capturedFiles = [];
  for (const absolute of await listFilesRecursive(workspaceDir)) {
    const relative = path.relative(runDir, absolute);
    const stat = await fs.stat(absolute);
    capturedFiles.push({
      path: relative,
      size_bytes: stat.size,
      sha256: await sha256(absolute),
      modified_at: stat.mtime.toISOString()
    });
  }

  const { status, outcome } = classifyRun({
    diagnosticOnly: args.diagnosticOnly,
    commandResult,
    validationResult
  });

  const endedAt = new Date().toISOString();
  const manifest = {
    schema_version: 1,
    run_id: args.runId,
    label: args.label || null,
    status,
    outcome,
    started_at: startedAt,
    ended_at: endedAt,
    diagnostic_only: args.diagnosticOnly,
    request_file: path.relative(runDir, requestFile),
    command_file: path.relative(runDir, commandFile),
    agent_log: path.relative(runDir, agentLogFile),
    validation_file: path.relative(runDir, validationFile),
    result_file: path.relative(runDir, resultFile),
    workspace_dir: path.relative(runDir, workspaceDir),
    diagnostics,
    command: args.command || null,
    command_result: commandResult,
    validation_command: args.validationCommand || null,
    validation_result: validationResult,
    outputs: capturedFiles
  };

  const summaryBits = [
    `status: ${status}`,
    `workspace files: ${capturedFiles.length}`,
    `ollama reachable: ${diagnostics.ollama_endpoint.reachable}`,
    `openclaw on PATH: ${diagnostics.openclaw_on_path ? 'yes' : 'no'}`
  ];
  if (commandResult) summaryBits.push(`command exit: ${commandResult.code}${commandResult.timedOut ? ' (timed out)' : ''}`);
  if (validationResult) summaryBits.push(`validation exit: ${validationResult.code}${validationResult.timedOut ? ' (timed out)' : ''}`);

  const failureNotes = [];
  if (!diagnostics.ollama_endpoint.reachable) {
    failureNotes.push(`Ollama endpoint ${diagnostics.ollama_endpoint.url} was unreachable (${diagnostics.ollama_endpoint.error}).`);
  }
  if (!diagnostics.openclaw_on_path) {
    failureNotes.push('`openclaw` was not present on the shell PATH used by the harness.');
  }
  if (commandResult?.timedOut) {
    failureNotes.push(`Main command hit the ${args.timeoutSeconds}s timeout.`);
  } else if (commandResult && commandResult.code !== 0) {
    failureNotes.push(`Main command exited non-zero (${commandResult.code}).`);
  }
  if (validationResult?.timedOut) {
    failureNotes.push(`Validation command hit the ${args.validationTimeout}s timeout.`);
  } else if (validationResult && validationResult.code !== 0) {
    failureNotes.push(`Validation command exited non-zero (${validationResult.code}).`);
  }
  if (args.diagnosticOnly) {
    failureNotes.push('No main command was executed because the run was explicitly diagnostic-only.');
  }

  const resultMarkdown =
    `# Local Coder Proof Run Result\n\n` +
    `- Run ID: \`${args.runId}\`\n` +
    `- Label: ${args.label || 'n/a'}\n` +
    `- Status: **${status}**\n` +
    `- Started: ${startedAt}\n` +
    `- Ended: ${endedAt}\n` +
    `- Workspace: \`${path.relative(root, workspaceDir)}\`\n\n` +
    formatSection('Summary', summaryBits.map((item) => `- ${item}`).join('\n')) +
    formatSection('Request', args.request) +
    formatSection('Command', args.command || '(diagnostic-only)') +
    formatSection('Diagnostics', [
      `- openclaw on PATH: ${diagnostics.openclaw_on_path || 'missing'}`,
      `- node on PATH: ${diagnostics.node_on_path || 'missing'}`,
      `- ollama cli on PATH: ${diagnostics.ollama_cli_on_path || 'missing'}`,
      `- ollama endpoint: ${diagnostics.ollama_endpoint.url}`,
      `- ollama reachable: ${diagnostics.ollama_endpoint.reachable}`,
      diagnostics.ollama_endpoint.error ? `- ollama error: ${diagnostics.ollama_endpoint.error}` : null
    ].filter(Boolean).join('\n')) +
    formatSection('Outputs', capturedFiles.length
      ? capturedFiles.map((file) => `- \`${file.path}\` (${file.size_bytes} bytes, sha256 ${file.sha256})`).join('\n')
      : '- none') +
    formatSection('Interpretation', failureNotes.length
      ? failureNotes.map((item) => `- ${item}`).join('\n')
      : '- Run met the bounded proof contract without detected harness failures.');

  await writeFile(resultFile, resultMarkdown);
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({
    ok: status === 'success' || status === 'diagnostic-only',
    run_id: args.runId,
    status,
    manifest: path.relative(root, manifestFile),
    result: path.relative(root, resultFile),
    outputs: capturedFiles.map((file) => file.path)
  }, null, 2));

  process.exit(status === 'failed' ? 1 : 0);
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
