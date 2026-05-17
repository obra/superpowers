#!/usr/bin/env node
'use strict';

/**
 * Bash Output Compression Rules
 *
 * Defines which commands can be compressed and how.
 * Used by bash-compress-hook.js (classification) and bash-optimizer.js (compression).
 *
 * Design principles:
 *   - Fail-open: if a compress() function returns null, output passes through raw
 *   - Never compress commands where every line is potential signal (diffs, file reads)
 *   - Transparency: compressed output always gets a marker so Claude knows info was removed
 *   - Cross-platform: line ending normalization handled by the optimizer, not here
 */

// Commands that should NEVER be compressed — output is always valuable
const NEVER_COMPRESS = [
  // Diffs — every line matters for code review/debugging
  /^git\s+diff\b/,
  /^diff\b/,

  // File reading — user/Claude explicitly wants file content
  /^\s*(cat|head|tail|less|bat|more|type)\s+/,

  // User already applied their own filter — respect it
  /\|\s*(grep|rg|awk|sed|sort|uniq|wc|cut|tr|jq|yq)\b/,

  // Verbose/debug flags — user explicitly wants detail
  /\s--(verbose|debug)\b/,

  // API/network responses — should not be truncated
  /^\s*(curl|wget|httpie|http)\s+/,

  // Interactive commands
  /^\s*(vim|nano|emacs|vi)\s+/,

  // Inline script execution — output is the point
  /^\s*(node|python3?|ruby|php|perl)\s+-e\s+/,

  // Echo/printf — user constructing specific output
  /^\s*(echo|printf)\s+/,
];

// Minimum output length (chars) to bother compressing.
// Below this threshold, compression overhead exceeds savings.
const MIN_OUTPUT_LENGTH = 200;

const RULES = [
  // ═══════════════════════════════════════════
  // Tier 1: Near-lossless (safe to always compress)
  // ═══════════════════════════════════════════

  {
    type: 'git-add',
    match: /^git\s+add\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = (stdout + '\n' + stderr).trim();
      if (!combined) return 'ok';
      // Preserve warnings (e.g., CRLF conversion warnings)
      const warnings = combined.split('\n').filter(l => /warning:/i.test(l));
      if (warnings.length) return `ok (${warnings.length} warning(s))\n${warnings.join('\n')}`;
      return 'ok';
    },
  },

  {
    type: 'git-commit',
    match: /^git\s+commit\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      // Extract [branch hash] and file change summary
      const branchHash = combined.match(/\[([^\]]+)\s+([a-f0-9]+)\]/);
      const summary = combined.match(/(\d+\s+files?\s+changed.*)/);
      const parts = [];
      if (branchHash) parts.push(`${branchHash[2]} on ${branchHash[1]}`);
      if (summary) parts.push(summary[1].trim());
      return parts.length ? `committed: ${parts.join(', ')}` : 'committed';
    },
  },

  {
    type: 'git-push',
    match: /^git\s+push\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const branch = combined.match(/->\s+([\w/.-]+)/);
      const remote = combined.match(/To\s+(\S+)/);
      const parts = ['ok'];
      if (branch) parts.push(branch[1]);
      if (remote) parts.push(`-> ${remote[1]}`);
      return parts.join(' ');
    },
  },

  {
    type: 'git-pull',
    match: /^git\s+pull\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      if (/Already up to date/i.test(combined)) return 'ok: already up to date';
      const changes = combined.match(/(\d+)\s+files?\s+changed/);
      const insertions = combined.match(/(\d+)\s+insertions?/);
      const deletions = combined.match(/(\d+)\s+deletions?/);
      const parts = ['ok'];
      if (changes) parts.push(changes[0]);
      if (insertions) parts.push(`+${insertions[1]}`);
      if (deletions) parts.push(`-${deletions[1]}`);
      return parts.join(', ');
    },
  },

  {
    type: 'git-clone',
    match: /^git\s+clone\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const dir = combined.match(/Cloning into '([^']+)'/);
      return dir ? `cloned -> ${dir[1]}` : 'cloned';
    },
  },

  {
    type: 'git-fetch',
    match: /^git\s+fetch\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = (stdout + '\n' + stderr).trim();
      if (!combined) return 'ok: up to date';
      // Extract new branches/tags
      const updates = combined.split('\n').filter(l => /->|new branch|new tag/i.test(l));
      if (updates.length) return `fetched: ${updates.length} update(s)\n${updates.join('\n')}`;
      return 'ok';
    },
  },

  {
    type: 'npm-install',
    match: /^(npm|yarn|pnpm)\s+(install|add|ci|i)(\s|$)/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const added = combined.match(/added\s+(\d+)\s+packages?/);
      const removed = combined.match(/removed\s+(\d+)\s+packages?/);
      const time = combined.match(/in\s+(\d+[\d.]*\s*[sm])/);
      // Extract full vulnerability summary line (e.g., "2 vulnerabilities (1 moderate, 1 high)")
      const vulnLine = combined.split('\n').find(l => /vulnerabilit/i.test(l));
      const parts = ['ok'];
      if (added) parts.push(added[0]);
      if (removed) parts.push(removed[0]);
      if (time) parts.push(`in ${time[1]}`);
      if (vulnLine) parts.push(vulnLine.trim());
      return parts.join(', ');
    },
  },

  {
    type: 'pip-install',
    match: /^(pip3?|uv\s+pip|uv\s+add|poetry\s+add)\s+install\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      if (/already satisfied/i.test(combined)) {
        const count = (combined.match(/already satisfied/gi) || []).length;
        return `ok: ${count} package(s) already satisfied`;
      }
      const installed = combined.match(/Successfully installed\s+(.*)/);
      if (installed) {
        const pkgs = installed[1].trim().split(/\s+/);
        return `ok: installed ${pkgs.length} package(s): ${pkgs.slice(0, 5).join(', ')}${pkgs.length > 5 ? ` (+${pkgs.length - 5} more)` : ''}`;
      }
      return 'ok';
    },
  },

  {
    type: 'cargo-install',
    match: /^cargo\s+install\b/,
    tier: 1,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const pkg = combined.match(/Installing\s+(\S+)/);
      return pkg ? `ok: installed ${pkg[1]}` : 'ok';
    },
  },

  // ═══════════════════════════════════════════
  // Tier 2: Smart filtering (compress noise, keep signal)
  // ═══════════════════════════════════════════

  {
    type: 'git-status',
    match: /^git\s+status\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const lines = stdout.split('\n');
      // Remove git hint lines:
      //   - Indented hints: '  (use "git add <file>..." to update...)'
      //   - Summary hints: 'no changes added to commit (use "git add"...)'
      //   - Clean/working tree messages that are noise
      const filtered = lines.filter(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith('(use "git ')) return false;
        if (/^no changes added to commit\b/.test(trimmed)) return false;
        if (/^nothing added to commit\b/.test(trimmed)) return false;
        return true;
      });
      // Remove consecutive blank lines (left behind after removing hints)
      const deduped = filtered.filter((l, i, arr) => {
        if (l.trim() === '' && i > 0 && arr[i - 1].trim() === '') return false;
        return true;
      });
      return deduped.join('\n');
    },
  },

  {
    type: 'git-log',
    match: /^git\s+log\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const lines = stdout.split('\n');
      if (lines.length <= 40) return null; // Already short enough
      const kept = lines.slice(0, 30);
      const dropped = lines.length - 30;
      kept.push('', `... ${dropped} more lines (use git log -n <N> for specific range)`);
      return kept.join('\n');
    },
  },

  {
    type: 'test-pass',
    match: /^(npm\s+test|npm\s+run\s+test|npx\s+(jest|vitest|mocha)|yarn\s+test|pnpm\s+test|cargo\s+test|pytest|python3?\s+-m\s+pytest|go\s+test|rake\s+test|rspec|bundle\s+exec\s+(rspec|rake)|php\s+artisan\s+test|phpunit|dotnet\s+test)\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      // ONLY compress passing tests — failures need full context
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const lines = combined.split('\n');
      if (lines.length <= 20) return null; // Short output, no need

      // Extract summary/result lines only — NOT individual test result lines.
      // "  PASS src/test.js" is an individual result (noise).
      // "Tests: 100 passed, 100 total" is a summary (signal).
      const summaryPatterns = [
        /\d+\s+passing\b/i,                       // mocha: "5 passing (3s)"
        /Tests?:\s+\d+/i,                          // jest: "Tests: 100 passed, 100 total"
        /Test Suites?:\s+\d+/i,                     // jest: "Test Suites: 5 passed"
        /test result:\s/i,                          // cargo: "test result: ok"
        /\bOK\s*\(\d+/i,                           // pytest: "OK (42 tests)"
        /\d+\s+passed,?\s+\d+\s+total/i,           // generic: "100 passed, 100 total"
        /\d+\s+tests?\s+passed/i,                   // generic: "42 tests passed"
        /All\s+\d+\s+tests/i,                       // generic
        /\d+\s+examples?,\s+\d+\s+failures?/i,      // rspec
        /Ran\s+\d+\s+tests?/i,                      // python unittest
        /^Time:\s/m,                                // jest time line
        /^Snapshots:\s/m,                           // jest snapshots
        /succeeded\.\s+\d+/i,                       // dotnet: "Passed! 42 succeeded"
      ];
      const summaryLines = lines.filter(l =>
        summaryPatterns.some(p => p.test(l))
      );

      // Collect warnings
      const warningLines = lines.filter(l => /\bwarn|deprecat/i.test(l));

      const result = [];
      if (summaryLines.length) {
        result.push(...summaryLines);
      } else {
        result.push(`all tests passed (${lines.length} lines of output)`);
      }
      if (warningLines.length) {
        result.push('', 'Warnings:');
        result.push(...warningLines.slice(0, 10));
        if (warningLines.length > 10) {
          result.push(`... ${warningLines.length - 10} more warnings`);
        }
      }
      return result.join('\n');
    },
  },

  {
    type: 'build-success',
    match: /^(npm\s+run\s+build|yarn\s+build|pnpm\s+build|cargo\s+build|make\b|go\s+build|tsc\b|next\s+build|dotnet\s+build|gradle\s+build|mvn\s+(compile|package))\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      // Only compress successful builds — errors need full context
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const lines = combined.split('\n');
      if (lines.length <= 20) return null;

      // Keep warning and summary lines
      const important = lines.filter(l =>
        /\bwarn|error|built|compiled|success|finish|complete|ready|emitted/i.test(l)
      );
      // Keep last 5 non-empty lines (usually the build summary)
      const tail = lines.filter(l => l.trim()).slice(-5);
      // Deduplicate
      const seen = new Set();
      const result = [];
      for (const l of [...important, ...tail]) {
        if (!seen.has(l)) { seen.add(l); result.push(l); }
      }
      return result.length ? result.join('\n') : 'build succeeded';
    },
  },

  {
    type: 'lint-output',
    match: /^(npx\s+)?(eslint|ruff\s+check|cargo\s+clippy|pylint|flake8|rubocop|golangci-lint|biome\s+(check|lint)|prettier\s+--check)\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      const combined = stdout + '\n' + stderr;
      const lines = combined.split('\n').filter(l => l.trim());
      if (lines.length <= 30) return null;

      // Count by severity
      const errors = lines.filter(l => /\berror\b/i.test(l));
      const warnings = lines.filter(l => /\bwarn(ing)?\b/i.test(l) && !/\berror\b/i.test(l));

      const result = [];
      result.push(`${errors.length} error(s), ${warnings.length} warning(s)`);

      // Show all errors (they need fixing), truncate if too many
      if (errors.length > 0) {
        result.push('');
        if (errors.length <= 25) {
          result.push(...errors);
        } else {
          result.push(...errors.slice(0, 25));
          result.push(`... ${errors.length - 25} more errors`);
        }
      }

      // Show first few warnings
      if (warnings.length > 0) {
        result.push('');
        result.push(...warnings.slice(0, 5));
        if (warnings.length > 5) {
          result.push(`... ${warnings.length - 5} more warnings`);
        }
      }
      return result.join('\n');
    },
  },

  {
    type: 'ls-large',
    match: /^(ls|dir)\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const lines = stdout.split('\n').filter(l => l.trim());
      if (lines.length <= 50) return null;
      const kept = lines.slice(0, 50);
      const dropped = lines.length - 50;
      kept.push('', `... ${dropped} more entries`);
      return kept.join('\n');
    },
  },

  {
    type: 'find-large',
    match: /^find\s+/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const lines = stdout.split('\n').filter(l => l.trim());
      if (lines.length <= 60) return null;
      const kept = lines.slice(0, 60);
      const dropped = lines.length - 60;
      kept.push('', `... ${dropped} more results`);
      return kept.join('\n');
    },
  },

  {
    type: 'docker-build',
    match: /^docker\s+(build|compose\s+build)\b/,
    tier: 2,
    compress(stdout, stderr, exitCode) {
      if (exitCode !== 0) return null;
      const combined = stdout + '\n' + stderr;
      const lines = combined.split('\n');
      if (lines.length <= 20) return null;
      // Keep step headers and final lines
      const steps = lines.filter(l => /^(Step|#\d+|\s*=>\s|FINISHED|Successfully|sha256:)/i.test(l.trim()));
      const tail = lines.filter(l => l.trim()).slice(-3);
      const seen = new Set();
      const result = [];
      for (const l of [...steps, ...tail]) {
        if (!seen.has(l)) { seen.add(l); result.push(l); }
      }
      return result.join('\n') || 'build succeeded';
    },
  },
];

module.exports = { RULES, NEVER_COMPRESS, MIN_OUTPUT_LENGTH };
