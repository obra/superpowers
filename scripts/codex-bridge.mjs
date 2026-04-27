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
const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_EFFORT = "xhigh";
// Enrich is a fast prompt-rewrite. xhigh reasoning would multiply latency
// for no real quality win. Override to "minimal" so enrich stays snappy.
const ENRICH_EFFORT = "minimal";

// ── Diagnostics log ──────────────────────────────────────────────────
// Single append-only file at ~/.claude/sspower-codex.log, rotated at 1000 lines.
// Captures errors + warnings for post-mortem via `codex-diagnostics` skill.

const LOG_FILE = path.join(os.homedir(), ".claude", "sspower-codex.log");
const LOG_MAX_LINES = 1000;
const LOG_KEEP_TAIL = 500;

let _logRotated = false;
function rotateLogOnce() {
  if (_logRotated) return;
  _logRotated = true;
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const content = fs.readFileSync(LOG_FILE, "utf8");
    const lines = content.split("\n");
    if (lines.length > LOG_MAX_LINES) {
      const kept = lines.slice(-LOG_KEEP_TAIL).join("\n");
      fs.writeFileSync(LOG_FILE, kept, { mode: 0o600 });
    }
  } catch { /* best effort */ }
}

function logEvent(kind /* "error" | "warn" | "info" */, source /* e.g. "bridge.enrich" */, fields = {}) {
  rotateLogOnce();
  const ts = new Date().toISOString();
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${JSON.stringify(typeof v === "string" ? v.slice(0, 500) : v)}`)
    .join(" ");
  const line = `${ts} [${kind}] ${source}${parts ? " " + parts : ""}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, { mode: 0o600 });
  } catch { /* fail open */ }
}

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
  logEvent("error", "bridge.die", { msg, subcommand: process.argv[2] });
  console.error(`codex-bridge: ${msg}`);
  process.exit(1);
}

function resolveModel(raw) {
  if (!raw) return DEFAULT_MODEL;
  return MODEL_ALIASES.get(raw) ?? raw;
}

function resolveEffort(raw) {
  return raw || DEFAULT_EFFORT;
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
      if (event.thread_id) return event.thread_id;
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
    logEvent("warn", "bridge.auto_commit", { kind: "commit_failed", msg: e.message, dir });
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
  args.push("--json");
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
  args.push("--json");
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
 * Render a Codex JSONL event as a tagged stderr line.
 * Covers the event types we care about; unknown types get a generic tag.
 * Returns the event "kind" for heartbeat/trace tracking.
 */
function renderEvent(event) {
  const trunc = (s, n = 120) => {
    if (!s) return "";
    const one = String(s).replace(/\s+/g, " ").trim();
    return one.length > n ? one.slice(0, n) + "…" : one;
  };

  const t = event.type || event.kind || "";

  // v0.124+ shape: thread.started carries thread_id (session identifier)
  if (t === "thread.started" && event.thread_id) {
    process.stderr.write(`[codex:session] ${event.thread_id}\n`);
    return "session";
  }

  if (event.session_id || event.conversation?.id) {
    const id = event.session_id || event.conversation.id;
    process.stderr.write(`[codex:session] ${id}\n`);
    return "session";
  }

  // v0.124+ shape: item.started / item.completed wrap the real payload in event.item
  if ((t === "item.started" || t === "item.completed") && event.item) {
    const it = event.item;
    const itype = it.type || "";
    if (itype === "agent_message") {
      if (t === "item.completed" && it.text) {
        process.stderr.write(`[codex:agent] ${trunc(it.text)}\n`);
      }
      return "agent";
    }
    if (itype === "reasoning") {
      const text = it.text || it.content || "";
      if (text && t === "item.completed") process.stderr.write(`[codex:think] ${trunc(text)}\n`);
      return "think";
    }
    if (itype === "command_execution") {
      if (t === "item.started") {
        process.stderr.write(`[codex:exec] ${trunc(it.command, 100)}\n`);
        return "exec";
      }
      const code = it.exit_code ?? "?";
      const out = trunc(it.aggregated_output || "", 80);
      process.stderr.write(`[codex:result] exit=${code} ${out}\n`);
      return "result";
    }
    if (itype === "file_change" || itype === "patch_apply" || itype === "edit") {
      const p = it.path || it.file || "?";
      process.stderr.write(`[codex:edit] ${p}\n`);
      return "edit";
    }
    if (itype === "error") {
      process.stderr.write(`[codex:error] ${trunc(it.message || JSON.stringify(it), 200)}\n`);
      return "error";
    }
    process.stderr.write(`[codex:event] item.${itype}\n`);
    return itype;
  }

  // v0.124+ shape: turn.completed carries usage at top level
  if (t === "turn.completed" && event.usage) {
    const u = event.usage;
    const inTok = u.input_tokens ?? u.input ?? u.prompt_tokens;
    const outTok = u.output_tokens ?? u.output ?? u.completion_tokens;
    const cached = u.cached_input_tokens;
    const total = (inTok != null && outTok != null) ? inTok + outTok : (u.total ?? u.total_tokens);
    process.stderr.write(`[codex:token] in=${inTok ?? "?"} out=${outTok ?? "?"} total=${total ?? "?"}${cached != null ? ` cached=${cached}` : ""}\n`);
    return "token";
  }

  if (t === "turn.started") return "turn";
  if (t === "turn.completed") return "done";
  if (t === "turn_aborted") {
    process.stderr.write(`[codex:error] turn aborted${event.reason ? `: ${event.reason}` : ""}\n`);
    return "error";
  }
  if (t === "stream_error") {
    process.stderr.write(`[codex:error] stream_error ${trunc(event.message || event.error || JSON.stringify(event), 200)}\n`);
    return "error";
  }

  // v0.124 top-level command_execution events (not always wrapped in item.*)
  if (t === "exec_command_begin") {
    process.stderr.write(`[codex:exec] ${trunc(event.command || event.cmd || "", 100)}\n`);
    return "exec";
  }
  // Output deltas stream many times per command — render but don't count as a new exec
  if (t === "exec_command_output_delta") return "stream";
  if (t === "exec_command_end") {
    const code = event.exit_code ?? "?";
    process.stderr.write(`[codex:result] exit=${code} ${trunc(event.aggregated_output || event.output || "", 80)}\n`);
    return "result";
  }

  // v0.124 top-level patch_apply events. Render each lifecycle phase for
  // visibility, but only count patch_apply_end (or patch_apply_updated) as a
  // finished edit so trace.edits reflects applied changes, not events.
  if (t === "patch_apply_begin" || t === "patch_apply_updated" || t === "patch_apply_end") {
    const extractPaths = (ev) => {
      if (ev.path || ev.file) return ev.path || ev.file;
      if (!Array.isArray(ev.changes)) return null;
      const joined = ev.changes.map(c => c.path || c.file).filter(Boolean).join(",");
      return joined || null;
    };
    const p = extractPaths(event) || "?";
    const failed = event.success === false || event.status === "failed" || event.error != null;
    const suffix = t === "patch_apply_end"
      ? (failed ? " (failed)" : " (done)")
      : (t === "patch_apply_begin" ? " (begin)" : "");
    process.stderr.write(`[codex:edit] ${p}${suffix}\n`);
    // Only count a successful _end as an applied edit; failures and interim
    // phases render for visibility but don't inflate trace.edits.
    if (t === "patch_apply_end" && !failed) return "edit";
    return "patch_phase";
  }

  // v0.124 top-level MCP tool events
  if (t === "mcp_tool_call_begin") {
    const name = event.name || event.tool || "?";
    const argsPreview = trunc(JSON.stringify(event.arguments || event.args || {}), 80);
    process.stderr.write(`[codex:tool] ${name}(${argsPreview})\n`);
    return "tool";
  }
  if (t === "mcp_tool_call_end") {
    process.stderr.write(`[codex:result] ${trunc(event.result || event.output || "", 80)}\n`);
    return "result";
  }

  if (t === "agent" && event.agent?.content) {
    process.stderr.write(`[codex:agent] ${trunc(event.agent.content)}\n`);
    return "agent";
  }
  if (t === "reasoning" || t === "reasoning.delta" || event.reasoning) {
    const text = event.reasoning?.content || event.delta || event.text || "";
    if (text) process.stderr.write(`[codex:think] ${trunc(text)}\n`);
    return "think";
  }
  if (t === "tool_call" || t === "tool.call" || event.tool_call) {
    const tc = event.tool_call || event;
    const name = tc.name || tc.tool || "?";
    const argsPreview = trunc(JSON.stringify(tc.arguments || tc.args || {}), 80);
    process.stderr.write(`[codex:tool] ${name}(${argsPreview})\n`);
    return "tool";
  }
  if (t === "tool_result" || t === "tool.result") {
    const r = event.result || event.output || "";
    process.stderr.write(`[codex:result] ${trunc(r, 80)}\n`);
    return "result";
  }
  if (t === "file_change" || t === "patch" || event.file_change) {
    const fc = event.file_change || event;
    const path = fc.path || fc.file || "?";
    const add = fc.added ?? fc.additions ?? "";
    const del = fc.removed ?? fc.deletions ?? "";
    process.stderr.write(`[codex:edit] ${path} +${add} -${del}\n`);
    return "edit";
  }
  if (t === "exec" || t === "shell" || event.command) {
    const cmd = event.command || event.cmd || "";
    process.stderr.write(`[codex:exec] ${trunc(cmd, 100)}\n`);
    return "exec";
  }
  if (t === "token_count" || t === "usage" || event.usage || event.tokens) {
    const u = event.usage || event.tokens || {};
    process.stderr.write(`[codex:token] in=${u.input ?? u.prompt_tokens ?? "?"} out=${u.output ?? u.completion_tokens ?? "?"} total=${u.total ?? u.total_tokens ?? "?"}\n`);
    return "token";
  }
  if (t === "error" || event.error) {
    const msg = event.error?.message || event.message || JSON.stringify(event.error || {});
    process.stderr.write(`[codex:error] ${trunc(msg, 200)}\n`);
    return "error";
  }
  if (t === "turn_complete" || t === "done") {
    return "done";
  }
  // Unknown event — surface compact so schema drift is visible
  if (t) {
    process.stderr.write(`[codex:event] ${t}\n`);
    return t;
  }
  return "unknown";
}

/**
 * Shared spawn logic for both exec and resume paths.
 * Streams Codex JSONL to stderr as tagged events and tracks a trace summary.
 */
function _spawnAndCapture(bin, args, promptFile, resultFile, schema, cwd = null) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const startedAt = Date.now();
    let sessionIdEmitted = null;
    const trace = {
      tool_calls: 0,
      edits: 0,
      execs: 0,
      errors: 0,
      tokens: { input: null, output: null, total: null },
    };

    const promptStream = fs.createReadStream(promptFile);
    const spawnOpts = {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    };
    if (cwd) spawnOpts.cwd = cwd;
    const child = spawn(bin, args, spawnOpts);

    promptStream.pipe(child.stdin);

    // Heartbeat: surface liveness if no event for >30s of silence
    let lastEventAt = Date.now();
    let lastEventKind = "start";
    const heartbeat = setInterval(() => {
      const silent = Date.now() - lastEventAt;
      if (silent >= 30_000) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        process.stderr.write(`[codex:alive] ${elapsed}s elapsed, silent ${(silent / 1000).toFixed(0)}s, last: ${lastEventKind}\n`);
      }
    }, 30_000);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const stdoutChunks = [];
    let lineBuf = "";
    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
      lineBuf += chunk.toString();
      const lines = lineBuf.split("\n");
      lineBuf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line) continue;
        let event;
        try { event = JSON.parse(line); } catch { continue; }

        // Emit session id at first sight, not at end
        const id = event.session_id || event.conversation?.id || event.thread_id;
        if (id && !sessionIdEmitted) {
          sessionIdEmitted = id;
        }

        const kind = renderEvent(event);
        lastEventAt = Date.now();
        lastEventKind = kind;
        if (kind === "tool") trace.tool_calls++;
        else if (kind === "edit") trace.edits++;
        else if (kind === "exec") trace.execs++;
        else if (kind === "error") trace.errors++;
        else if (kind === "token") {
          const u = event.usage || event.tokens || {};
          const inTok = u.input_tokens ?? u.input ?? u.prompt_tokens;
          const outTok = u.output_tokens ?? u.output ?? u.completion_tokens;
          if (inTok != null) trace.tokens.input = inTok;
          if (outTok != null) trace.tokens.output = outTok;
          const total = u.total ?? u.total_tokens ?? ((inTok != null && outTok != null) ? inTok + outTok : null);
          if (total != null) trace.tokens.total = total;
        }
      }
    });

    child.on("close", (code) => {
      clearInterval(heartbeat);
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

      // Fallback to post-hoc extraction if streaming missed it
      const sessionId = sessionIdEmitted || extractSessionId(stderr + "\n" + stdout);

      const duration_ms = Date.now() - startedAt;
      process.stderr.write(`[codex:done] exit=${code} dur=${(duration_ms / 1000).toFixed(1)}s tools=${trace.tool_calls} edits=${trace.edits} errors=${trace.errors}\n`);

      resolve({
        exitCode: code,
        lastMessage,
        structured,
        sessionId,
        stderr: cleanStderr(stderr),
        stdout,
        trace: { ...trace, duration_ms },
      });
    });

    child.on("error", (err) => {
      clearInterval(heartbeat);
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
    logEvent("error", `bridge.${process.argv[2]}`, {
      exitCode: result.exitCode,
      session: result.sessionId,
      duration_ms: result.trace?.duration_ms,
      msg: msg.slice(0, 300),
    });
    console.error(JSON.stringify({
      error: true,
      exitCode: result.exitCode,
      message: msg,
    }, null, 2));
    cleanupTmpDir();
    process.exit(1);
  }

  // Session ID already emitted inline at first-sight; only emit here
  // as a fallback if the stream never surfaced it.
  if (result.sessionId && !result.stderr.includes(`[codex:session] ${result.sessionId}`)) {
    process.stderr.write(`[codex:session] ${result.sessionId}\n`);
  }

  if (result.structured) {
    // Attach _meta envelope (duration, tool counts, tokens, session id).
    // Preserves any fields callers already stamped (_commit, _branch, _worktree).
    const existingMeta = result.structured._meta || {};
    result.structured._meta = {
      session_id: result.sessionId ?? null,
      duration_ms: result.trace?.duration_ms ?? null,
      tool_calls: result.trace?.tool_calls ?? 0,
      edits: result.trace?.edits ?? 0,
      execs: result.trace?.execs ?? 0,
      errors: result.trace?.errors ?? 0,
      tokens: result.trace?.tokens ?? null,
      ...existingMeta,
    };
    console.log(JSON.stringify(result.structured, null, 2));
  } else if (expectStructured) {
    // Schema was set but we couldn't parse — report as error
    logEvent("error", `bridge.${process.argv[2]}`, {
      kind: "schema_parse_fail",
      session: result.sessionId,
      raw_preview: result.lastMessage?.slice(0, 120) || "",
    });
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
    effort: resolveEffort(opts.effort),
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
      if (result.structured) {
        // Dual-write: top-level for existing consumers, _meta for new
        result.structured._commit = sha;
        result.structured._meta = { ...(result.structured._meta || {}), commit: sha };
      }
    }
  }

  // Report worktree path in output (dual-write for back-compat)
  if (worktree && result.structured) {
    result.structured._worktree = worktree.worktreePath;
    result.structured._branch = worktree.branch;
    result.structured._meta = {
      ...(result.structured._meta || {}),
      worktree: worktree.worktreePath,
      branch: worktree.branch,
    };
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
    effort: resolveEffort(opts.effort),
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
    effort: resolveEffort(opts.effort),
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
    effort: resolveEffort(opts.effort),
    cd: opts.cd,
    ephemeral: !opts.write, // persist write sessions for potential resume
  });
  output(result);
}

async function cmdEnrich(argv) {
  const opts = parseOpts(argv);
  const rawPrompt = resolvePrompt(opts.prompt);

  // Wrap user prompt with enrichment instructions.
  // Codex scans repo (read-only), corrects assumptions, returns enriched prompt.
  const wrapped = [
    "You are a prompt-enrichment assistant for Claude Code.",
    "",
    "Original user prompt:",
    "<<<PROMPT",
    rawPrompt,
    "PROMPT>>>",
    "",
    "Task: Produce an enriched version of the prompt that Claude will use to do the work.",
    "Rules:",
    "  1. Scan relevant files in this repository (read-only).",
    "  2. Quote exact file paths and line numbers. Do not guess.",
    "  3. If the user made wrong assumptions about the codebase, correct them.",
    "  4. Add concrete technical context Claude will need (types, function signatures, existing patterns).",
    "  5. Preserve the user's intent and tone. Do not answer the request — only enrich it.",
    "  6. Keep enrichment under 1500 tokens. Cut fluff.",
    "",
    "Output format: plain text only. No markdown fences. No preamble.",
    "Start with '<ENRICHED>' on its own line.",
    "End with '</ENRICHED>' on its own line.",
    "Everything inside those markers is the enriched prompt Claude will see.",
  ].join("\n");

  const result = await runCodexExec(wrapped, {
    schema: null,
    sandbox: "read-only",
    model: resolveModel(opts.model),
    effort: opts.effort || ENRICH_EFFORT,
    cd: opts.cd,
    ephemeral: true,
  });

  // Fail-open: if Codex errored, emit raw prompt + stderr warning
  if (result.exitCode !== 0) {
    logEvent("warn", "bridge.enrich", {
      kind: "exit_nonzero_fallback",
      exitCode: result.exitCode,
      session: result.sessionId,
      duration_ms: result.trace?.duration_ms,
      stderr_preview: result.stderr?.slice(0, 200),
    });
    process.stderr.write(`[codex:enrich] failed exit=${result.exitCode}, passing raw prompt\n`);
    console.log(rawPrompt);
    cleanupTmpDir();
    process.exit(0);
  }

  // Extract enriched body between markers
  const raw = result.lastMessage || "";
  const match = raw.match(/<ENRICHED>\s*\n?([\s\S]*?)\n?<\/ENRICHED>/);
  const enriched = match ? match[1].trim() : raw.trim();

  if (!enriched) {
    logEvent("warn", "bridge.enrich", {
      kind: "empty_output_fallback",
      session: result.sessionId,
      duration_ms: result.trace?.duration_ms,
    });
    process.stderr.write(`[codex:enrich] empty output, passing raw prompt\n`);
    console.log(rawPrompt);
  } else if (!match) {
    logEvent("warn", "bridge.enrich", {
      kind: "missing_enriched_markers",
      session: result.sessionId,
      raw_preview: raw.slice(0, 120),
    });
    console.log(enriched);
  } else {
    console.log(enriched);
  }
  cleanupTmpDir();
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
      "  codex-bridge.mjs enrich     --prompt <text|@file> [--model <m>] [--effort <e>] [--cd <dir>]",
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
    case "enrich":
      await cmdEnrich(argv);
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
