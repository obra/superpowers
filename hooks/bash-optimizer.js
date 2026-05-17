#!/usr/bin/env node
'use strict';

/**
 * Bash Output Optimizer — executes a command and compresses its output.
 *
 * Called by bash-compress-hook.js via PreToolUse command rewriting.
 * Usage: node bash-optimizer.js <base64-encoded-command> <rule-type>
 *
 * Cross-platform:
 *   - macOS:   uses /bin/bash (always available, ships with macOS)
 *   - Linux:   uses /bin/bash or /usr/bin/bash (always available)
 *   - Windows: uses Git Bash (required by Claude Code), falls back to sh
 *
 * Safety:
 *   - Fail-open: any error results in raw output passthrough
 *   - Exit codes are always preserved from the original command
 *   - stderr is always passed through uncompressed
 *   - Compressed output includes a transparency marker
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { RULES, MIN_OUTPUT_LENGTH } = require('./compression-rules');

const b64Command = process.argv[2];
const ruleType = process.argv[3];

if (!b64Command) {
  process.stderr.write('[smart-compress] Error: no command argument\n');
  process.exit(1);
}

// Decode the original command from base64
let cmd;
try {
  cmd = Buffer.from(b64Command, 'base64').toString('utf8');
} catch (e) {
  process.stderr.write(`[smart-compress] Decode error: ${e.message}\n`);
  process.exit(1);
}

/**
 * Detect the appropriate shell for the current platform.
 *
 * macOS/Linux: bash is always at a known location.
 * Windows: Git Bash is required by Claude Code. We check common install
 * locations, then fall back to 'bash' in PATH, then 'sh'.
 */
function getShell() {
  if (process.platform === 'win32') {
    // Git Bash common locations on Windows
    const candidates = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'bin', 'bash.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Git', 'bin', 'bash.exe'),
      // Git Bash installed via scoop, chocolatey, or manual — rely on PATH
    ];
    for (const p of candidates) {
      try { if (fs.existsSync(p)) return p; } catch {}
    }
    // Fall back to PATH lookup (works if Git Bash bin is in PATH)
    return 'bash';
  }

  // macOS: /bin/bash is always present (bash 3.2+, sufficient for -c)
  // Linux: /bin/bash or /usr/bin/bash
  if (process.platform === 'darwin') return '/bin/bash';

  // Linux: prefer /bin/bash, fall back to /usr/bin/bash, then PATH
  if (fs.existsSync('/bin/bash')) return '/bin/bash';
  if (fs.existsSync('/usr/bin/bash')) return '/usr/bin/bash';
  return 'bash';
}

// Find the matching compression rule
const rule = RULES.find(r => r.type === ruleType);

/**
 * Run the command and output results (raw or compressed).
 * Wrapped in a function for clean error handling with fail-open.
 */
function run() {
  const shell = getShell();
  const result = spawnSync(shell, ['-c', cmd], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024, // 10MB
    timeout: 300000,              // 5 minutes (Claude Code's max is 10 min)
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  // Handle spawn errors (shell not found, timeout, buffer exceeded)
  if (result.error) {
    process.stderr.write(`[smart-compress] Execution error: ${result.error.message}\n`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status != null ? result.status : 1);
    return;
  }

  // Handle signals (timeout SIGTERM, etc.)
  if (result.signal) {
    process.stderr.write(`[smart-compress] Command killed by ${result.signal}\n`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(1);
    return;
  }

  // Normalize line endings (Windows CRLF -> LF)
  const stdout = (result.stdout || '').replace(/\r\n/g, '\n');
  const stderr = (result.stderr || '').replace(/\r\n/g, '\n');
  const exitCode = result.status != null ? result.status : 0;

  // No matching rule — pass through raw (shouldn't happen, but fail-open)
  if (!rule) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    process.exit(exitCode);
    return;
  }

  // If output is too short, compression isn't worth it
  const totalOutput = stdout + stderr;
  if (totalOutput.length < MIN_OUTPUT_LENGTH) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    process.exit(exitCode);
    return;
  }

  // Attempt compression
  let compressed = null;
  try {
    compressed = rule.compress(stdout, stderr, exitCode);
  } catch (e) {
    // Compression threw — fail-open with raw output
    process.stderr.write(`[smart-compress] Compression error (${rule.type}): ${e.message}\n`);
  }

  // Rule declined to compress (returned null) — pass through raw
  if (compressed == null) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    process.exit(exitCode);
    return;
  }

  // Calculate stats for transparency marker
  const originalLines = totalOutput.split('\n').filter(l => l.trim()).length;
  const compressedLines = compressed.split('\n').filter(l => l.trim()).length;

  // Output compressed result
  process.stdout.write(compressed);

  // Add transparency marker only if we actually reduced the output
  if (originalLines > compressedLines) {
    process.stdout.write(`\n[compressed: ${originalLines}->${compressedLines} lines | ${rule.type}]\n`);
  }

  // Always pass stderr through uncompressed — errors must be seen in full
  process.stderr.write(stderr);
  process.exit(exitCode);
}

// Execute with top-level fail-open safety net
try {
  run();
} catch (e) {
  // Catastrophic failure — attempt raw execution as last resort
  process.stderr.write(`[smart-compress] Fatal error: ${e.message}, running raw\n`);
  try {
    const shell = getShell();
    const result = spawnSync(shell, ['-c', cmd], {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    process.exit(result.status != null ? result.status : 1);
  } catch {
    process.exit(1);
  }
}
