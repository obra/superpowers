#!/usr/bin/env node

/**
 * codex-bridge.mjs — sspower's direct bridge to the Codex CLI.
 *
 * Calls `codex exec` with structured output schemas so SDD can treat
 * Codex as a first-class subagent with the same contract as Claude.
 *
 * Session management: `implement` and `rescue --write` runs persist sessions
 * (no --ephemeral) so they can be resumed for fix loops. The session ID is
 * printed to stderr as `[codex:session] <id>` and can be passed to `resume`
 * via --session-id to target the correct thread.
 *
 * Usage:
 *   node codex-bridge.mjs setup
 *   node codex-bridge.mjs implement  --prompt <text|@file> [--write] [--model <m>] [--effort <e>] [--cd <dir>]
 *   node codex-bridge.mjs spec-review --prompt <text|@file> [--model <m>] [--cd <dir>]
 *   node codex-bridge.mjs review     --prompt <text|@file> [--model <m>] [--cd <dir>]
 *   node codex-bridge.mjs rescue     --prompt <text|@file> [--write] [--model <m>] [--effort <e>] [--cd <dir>]
 *   node codex-bridge.mjs resume     --prompt <text|@file> [--session-id <id>] [--model <m>] [--cd <dir>]
 */

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const BRIDGE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(BRIDGE_DIR, "..");
const SCHEMAS_DIR = path.join(PLUGIN_ROOT, "schemas");

const VALID_EFFORTS = new Set(["none", "minimal", "low", "medium", "high", "xhigh"]);
const MODEL_ALIASES = new Map([["spark", "gpt-5.3-codex-spark"]]);

// ── Secure temp files ────────────────────────────────────────────────

let _tmpDir = null;

function secureTmpDir() {
  if (!_tmpDir) {
    _tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sspower-codex-"));
    fs.chmodSync(_tmpDir, 0o700);
  }
  return _tmpDir;
}

function secureTmpFile(prefix, content) {
  const filePath = path.join(secureTmpDir(), `${prefix}-${Date.now()}`);
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  return filePath;
}

function cleanupTmpDir() {
  if (_tmpDir) {
    try { fs.rmSync(_tmpDir, { recursive: true, force: true }); } catch { /* ok */ }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function die(msg) {
  cleanupTmpDir();
  console.error(`codex-bridge: ${msg}`);
  process.exit(1);
}

function resolveModel(raw) {
  if (!raw) return null;
  return MODEL_ALIASES.get(raw) ?? raw;
}

function resolvePrompt(raw) {
  if (!raw) die("--prompt is required");
  if (raw.startsWith("@")) {
    const filePath = raw.slice(1);
    if (!fs.existsSync(filePath)) die(`prompt file not found: ${filePath}`);
    return fs.readFileSync(filePath, "utf8");
  }
  return raw;
}

function schemaPath(name) {
  const p = path.join(SCHEMAS_DIR, `${name}.json`);
  if (!fs.existsSync(p)) die(`schema not found: ${p}`);
  return p;
}

function codexBin() {
  try {
    return execFileSync("which", ["codex"], { encoding: "utf8" }).trim();
  } catch {
    die("codex CLI not found. Install with: npm install -g @openai/codex");
  }
}

function cleanStderr(stderr) {
  return stderr
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l && !l.startsWith("WARNING: proceeding"))
    .join("\n");
}

/**
 * Extract session ID from codex JSONL output.
 * The session ID appears in the startup banner or JSONL events.
 */
function extractSessionId(stdout) {
  // Try JSONL events first
  for (const line of stdout.split("\n")) {
    try {
      const event = JSON.parse(line);
      if (event.session_id) return event.session_id;
      if (event.conversation?.id) return event.conversation.id;
    } catch { /* not JSON */ }
  }
  // Try banner format: "session id: <uuid>"
  const bannerMatch = stdout.match(/session id:\s*([0-9a-f-]{36})/i);
  if (bannerMatch) return bannerMatch[1];
  return null;
}

// ── Worktree & auto-commit ───────────────────────────────────────────

/**
 * Create a git worktree for isolated Codex work.
 * Returns { worktreePath, branch } or null if --worktree not requested.
 */
function createWorktree(repoDir, branch) {
  const worktreeBase = path.join(repoDir, ".worktrees");
  const worktreePath = path.join(worktreeBase, branch);

  // Create .worktrees dir if needed
  if (!fs.existsSync(worktreeBase)) {
    fs.mkdirSync(worktreeBase, { recursive: true });
  }

  // Remove stale worktree at this path if it exists
  try {
    execFileSync("git", ["-C", repoDir, "worktree", "remove", worktreePath, "--force"], {
      stdio: "ignore",
    });
  } catch { /* didn't exist, fine */ }

  // Create worktree with new branch
  try {
    execFileSync("git", ["-C", repoDir, "worktree", "add", "-b", branch, worktreePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    // Branch may already exist — try without -b
    try {
      execFileSync("git", ["-C", repoDir, "worktree", "add", worktreePath, branch], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e2) {
      die(`Failed to create worktree: ${e2.message}`);
    }
  }

  return { worktreePath, branch };
}

/**
 * Auto-commit all changes in a directory after successful Codex work.
 * Returns the commit SHA or null if nothing to commit.
 */
function autoCommit(dir, message) {
  try {
    // Stage all changes
    execFileSync("git", ["-C", dir, "add", "-A"], { stdio: "ignore" });

    // Check if there's anything to commit
    const status = execFileSync("git", ["-C", dir, "status", "--porcelain"], {
      encoding: "utf8",
    }).trim();

    if (!status) return null;

    // Commit
    execFileSync("git", ["-C", dir, "commit", "-m", message], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Return SHA
    const sha = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    return sha;
  } catch (e) {
    process.stderr.write(`[codex:auto-commit] Failed: ${e.message}\n`);
    return null;
  }
}

// ── Core executors ───────────────────────────────────────────────────

/**
 * Run `codex exec` for fresh tasks (implement, review, rescue).
 * Supports --output-schema, --sandbox, -C, --full-auto.
 */
function runCodexExec(prompt, options = {}) {
  const {
    schema = null,
    sandbox = "read-only",
    model = null,
    effort = null,
    cd = null,
    ephemeral = true,
  } = options;

  const bin = codexBin();
  const resultFile = secureTmpFile("result", "");

  const args = ["exec"];
  args.push("--full-auto");
  if (ephemeral) args.push("--ephemeral");
  args.push("--sandbox", sandbox);
  args.push("-o", resultFile);

  if (schema) args.push("--output-schema", schema);
  if (model) args.push("-m", model);
  if (effort) args.push("-c", `reasoning.effort="${effort}"`);
  if (cd) args.push("-C", cd);

  const promptFile = secureTmpFile("prompt", prompt);
  args.push("-");

  return _spawnAndCapture(bin, args, promptFile, resultFile, schema);
}

/**
 * Run `codex exec resume` for fix loops.
 * Only supports flags that `codex exec resume` accepts:
 * SESSION_ID, --last, --full-auto, -m, -o, --json
 * Does NOT support --sandbox, -C, --output-schema, --ephemeral.
 *
 * Since --output-schema is unavailable for resume, we wrap the prompt
 * with an explicit JSON instruction when a schema name is provided.
 * The bridge then parses the JSON from the response text.
 */
function runCodexResume(prompt, options = {}) {
  const {
    sessionId = null,
    model = null,
    schemaName = null,
    cd = null,
  } = options;

  const bin = codexBin();
  const resultFile = secureTmpFile("result", "");

  const args = ["exec", "resume"];

  if (sessionId) {
    args.push(sessionId);
  } else {
    args.push("--last");
  }

  args.push("--full-auto");
  args.push("-o", resultFile);
  if (model) args.push("-m", model);

  // Wrap prompt with structured output instruction when schema requested
  let finalPrompt = prompt;
  if (schemaName) {
    const schema = JSON.parse(fs.readFileSync(schemaPath(schemaName), "utf8"));
    const fields = Object.keys(schema.properties || {}).join(", ");
    finalPrompt = `${prompt}\n\nIMPORTANT: After completing the work above, respond with ONLY a JSON object matching this exact structure (fields: ${fields}). No markdown fences, no commentary — just the raw JSON object.\n\nSchema:\n${JSON.stringify(schema, null, 2)}`;
  }

  const promptFile = secureTmpFile("prompt", finalPrompt);
  args.push("-");

  // Pass schemaName so parser knows to attempt structured extraction
  return _spawnAndCapture(bin, args, promptFile, resultFile, schemaName ? schemaPath(schemaName) : null, cd);
}

/**
 * Shared spawn logic for both exec and resume paths.
 */
function _spawnAndCapture(bin, args, promptFile, resultFile, schema, cwd = null) {
  return new Promise((resolve, reject) => {
    let stderr = "";

    const promptStream = fs.createReadStream(promptFile);
    const spawnOpts = {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    };
    if (cwd) spawnOpts.cwd = cwd;
    const child = spawn(bin, args, spawnOpts);

    promptStream.pipe(child.stdin);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const stdoutChunks = [];
    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.type === "agent" && event.agent?.content) {
            process.stderr.write(`[codex] ${event.agent.content.slice(0, 120)}\n`);
          }
        } catch { /* not JSON */ }
      }
    });

    child.on("close", (code) => {
      let lastMessage = "";
      try {
        lastMessage = fs.readFileSync(resultFile, "utf8").trim();
      } catch { /* no output file */ }

      try { fs.unlinkSync(resultFile); } catch { /* ok */ }
      try { fs.unlinkSync(promptFile); } catch { /* ok */ }

      const stdout = Buffer.concat(stdoutChunks).toString();

      // Try to parse structured output
      let structured = null;
      if (schema && lastMessage) {
        structured = parseStructuredOutput(lastMessage);
      }

      // Extract session ID for resume tracking
      const sessionId = extractSessionId(stderr + "\n" + stdout);

      resolve({
        exitCode: code,
        lastMessage,
        structured,
        sessionId,
        stderr: cleanStderr(stderr),
        stdout,
      });
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn codex: ${err.message}`));
    });
  });
}

/**
 * Parse structured JSON from Codex output with fallbacks.
 */
function parseStructuredOutput(text) {
  // Direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // Fenced code block
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* continue */ }
  }

  // First { ... } in prose
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* give up */ }
  }

  return null;
}

// ── Output formatting ────────────────────────────────────────────────

function output(result, options = {}) {
  const { expectStructured = false } = options;

  // Check exit code — non-zero means Codex failed
  if (result.exitCode !== 0) {
    const msg = result.stderr || result.lastMessage || "unknown error";
    console.error(JSON.stringify({
      error: true,
      exitCode: result.exitCode,
      message: msg,
    }, null, 2));
    cleanupTmpDir();
    process.exit(1);
  }

  // Emit session ID to stderr for resume tracking
  if (result.sessionId) {
    process.stderr.write(`[codex:session] ${result.sessionId}\n`);
  }

  if (result.structured) {
    console.log(JSON.stringify(result.structured, null, 2));
  } else if (expectStructured) {
    // Schema was set but we couldn't parse — report as error
    console.error(JSON.stringify({
      error: true,
      exitCode: 0,
      message: "Failed to parse structured output from Codex",
      raw: result.lastMessage?.slice(0, 2000) || "",
    }, null, 2));
    cleanupTmpDir();
    process.exit(1);
  } else if (result.lastMessage) {
    console.log(result.lastMessage);
  } else {
    die("Codex returned no output");
  }

  cleanupTmpDir();
}

// ── Subcommands ──────────────────────────────────────────────────────

async function cmdSetup() {
  const bin = codexBin();
  console.log(`Codex CLI: ${bin}`);

  try {
    const version = execFileSync(bin, ["--version"], { encoding: "utf8" }).trim();
    console.log(`Version: ${version}`);
  } catch {
    console.log("Version: unknown");
  }

  try {
    execFileSync(bin, ["login", "status"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    });
    console.log("Auth: authenticated");
  } catch {
    console.log("Auth: not authenticated (run 'codex login')");
  }

  const schemas = ["implementation-output", "spec-review-output", "quality-review-output"];
  for (const s of schemas) {
    const exists = fs.existsSync(path.join(SCHEMAS_DIR, `${s}.json`));
    console.log(`Schema ${s}: ${exists ? "OK" : "MISSING"}`);
  }

  console.log("\nReady for SDD integration.");
}

async function cmdImplement(argv) {
  const opts = parseOpts(argv);
  const prompt = resolvePrompt(opts.prompt);

  // Set up worktree if requested
  let worktree = null;
  let workDir = opts.cd;
  if (opts.worktree && opts.cd) {
    worktree = createWorktree(opts.cd, opts.worktree);
    workDir = worktree.worktreePath;
    process.stderr.write(`[codex:worktree] Created ${worktree.worktreePath} on branch ${worktree.branch}\n`);
  }

  const result = await runCodexExec(prompt, {
    schema: schemaPath("implementation-output"),
    sandbox: opts.write ? "workspace-write" : "read-only",
    model: resolveModel(opts.model),
    effort: opts.effort,
    cd: workDir,
    ephemeral: false, // persist session for resume-based fix loops
  });

  // Auto-commit after successful implementation
  if (result.exitCode === 0 && result.structured?.status === "DONE" && opts.autoCommit) {
    const commitMsg = opts.autoCommit === true
      ? `codex: ${result.structured?.summary?.slice(0, 72) || "implement task"}`
      : opts.autoCommit;
    const sha = autoCommit(workDir || ".", commitMsg);
    if (sha) {
      process.stderr.write(`[codex:auto-commit] ${sha.slice(0, 8)} ${commitMsg}\n`);
      if (result.structured) result.structured._commit = sha;
    }
  }

  // Report worktree path in output
  if (worktree && result.structured) {
    result.structured._worktree = worktree.worktreePath;
    result.structured._branch = worktree.branch;
  }

  output(result, { expectStructured: true });
}

async function cmdSpecReview(argv) {
  const opts = parseOpts(argv);
  const prompt = resolvePrompt(opts.prompt);
  const result = await runCodexExec(prompt, {
    schema: schemaPath("spec-review-output"),
    sandbox: "read-only",
    model: resolveModel(opts.model),
    effort: opts.effort,
    cd: opts.cd,
    ephemeral: true, // reviews don't need resume
  });
  output(result, { expectStructured: true });
}

async function cmdReview(argv) {
  const opts = parseOpts(argv);
  const prompt = resolvePrompt(opts.prompt);
  const result = await runCodexExec(prompt, {
    schema: schemaPath("quality-review-output"),
    sandbox: "read-only",
    model: resolveModel(opts.model),
    effort: opts.effort,
    cd: opts.cd,
    ephemeral: true, // reviews don't need resume
  });
  output(result, { expectStructured: true });
}

async function cmdRescue(argv) {
  const opts = parseOpts(argv);
  const prompt = resolvePrompt(opts.prompt);
  const result = await runCodexExec(prompt, {
    schema: null,
    sandbox: opts.write ? "workspace-write" : "read-only",
    model: resolveModel(opts.model),
    effort: opts.effort,
    cd: opts.cd,
    ephemeral: !opts.write, // persist write sessions for potential resume
  });
  output(result);
}

async function cmdResume(argv) {
  const opts = parseOpts(argv);
  const prompt = resolvePrompt(opts.prompt);
  // Default to implementation-output schema for SDD fix loops.
  // Use --no-schema for free-form resume (rescue continuations).
  const schemaName = opts.noSchema ? null : (opts.schema || "implementation-output");
  const result = await runCodexResume(prompt, {
    sessionId: opts.sessionId,
    model: resolveModel(opts.model),
    schemaName,
    cd: opts.cd,
  });
  output(result, { expectStructured: !!schemaName });
}

// ── Argument parsing ─────────────────────────────────────────────────

function parseOpts(argv) {
  const opts = {
    prompt: null,
    write: false,
    model: null,
    effort: null,
    cd: null,
    sessionId: null,
    schema: null,
    noSchema: false,
    worktree: null,
    autoCommit: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--prompt":
        opts.prompt = argv[++i];
        break;
      case "--write":
        opts.write = true;
        break;
      case "--model":
        opts.model = argv[++i];
        break;
      case "--effort":
        opts.effort = argv[++i];
        if (!VALID_EFFORTS.has(opts.effort)) {
          die(`invalid effort: ${opts.effort}. Valid: ${[...VALID_EFFORTS].join(", ")}`);
        }
        break;
      case "--cd":
        opts.cd = argv[++i];
        break;
      case "--session-id":
        opts.sessionId = argv[++i];
        break;
      case "--schema":
        opts.schema = argv[++i];
        break;
      case "--no-schema":
        opts.noSchema = true;
        break;
      case "--worktree":
        opts.worktree = argv[++i];
        break;
      case "--auto-commit":
        // Can be bare flag (true) or take a message
        if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
          opts.autoCommit = argv[++i];
        } else {
          opts.autoCommit = true;
        }
        break;
      default:
        if (!opts.prompt) opts.prompt = arg;
        break;
    }
  }

  return opts;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const [subcommand, ...argv] = process.argv.slice(2);

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    console.log([
      "sspower codex-bridge — direct Codex CLI integration for SDD",
      "",
      "Usage:",
      "  codex-bridge.mjs setup",
      "  codex-bridge.mjs implement  --prompt <text|@file> [--write] [--model <m>] [--effort <e>] [--cd <dir>] [--worktree <branch>] [--auto-commit [msg]]",
      "  codex-bridge.mjs spec-review --prompt <text|@file> [--model <m>] [--cd <dir>]",
      "  codex-bridge.mjs review     --prompt <text|@file> [--model <m>] [--cd <dir>]",
      "  codex-bridge.mjs rescue     --prompt <text|@file> [--write] [--model <m>] [--effort <e>] [--cd <dir>]",
      "  codex-bridge.mjs resume     --prompt <text|@file> [--session-id <id>] [--model <m>] [--no-schema]",
      "",
      "Prompt: literal text or @/path/to/file.md to read from file",
      "",
      "Session management:",
      "  implement and rescue --write persist sessions for fix-loop resume.",
      "  The session ID is printed to stderr as [codex:session] <id>.",
      "  Pass it to resume via --session-id to target the correct thread.",
      "  If --session-id is omitted, resume uses --last (most recent session).",
      "",
      "Worktree + auto-commit (implement only):",
      "  --worktree <branch>     Create git worktree, Codex works in isolation",
      "  --auto-commit [msg]     Auto-commit after successful DONE status",
    ].join("\n"));
    process.exit(0);
  }

  switch (subcommand) {
    case "setup":
      await cmdSetup();
      break;
    case "implement":
      await cmdImplement(argv);
      break;
    case "spec-review":
      await cmdSpecReview(argv);
      break;
    case "review":
      await cmdReview(argv);
      break;
    case "rescue":
      await cmdRescue(argv);
      break;
    case "resume":
      await cmdResume(argv);
      break;
    default:
      die(`unknown subcommand: ${subcommand}. Run with --help for usage.`);
  }
}

main().catch((err) => {
  cleanupTmpDir();
  console.error(`codex-bridge: ${err.message}`);
  process.exit(1);
});
