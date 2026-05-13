// spec-status.mjs — superpowers shared util for L2 spec state machine.
// Used by spec-author / spec-ratifier / writing-plans / expert-reviewer / l1-updater.
//
// Single source of truth: L2 spec.md frontmatter `status:` field (in product repo, git-tracked).
// MCP does NOT call this; skills call it directly. MCP (facio-flow notify_spec_event)
// only handles side effects (broadcast / audit / metrics) AFTER skill writes frontmatter.

import { readFileSync, writeFileSync } from 'node:fs';

// Legal transitions (see harness spec v0.3 §4.5).
export const LEGAL_TRANSITIONS = {
  draft:        ['draft', 'ratified', 'rejected'],
  ratified:     ['implementing', 'rejected'],
  implementing: ['implementing', 'draft', 'merged', 'rejected'],
  merged:       ['archived'],
  // archived / rejected are terminal; not in this map.
};

export function validateTransition(from, to) {
  const allowed = LEGAL_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function readSpecStatus(path) {
  const text = readFileSync(path, 'utf-8');
  const fm = extractFrontmatter(text);
  const match = fm.match(/^status:\s*(\S+)/m);
  if (!match) throw new Error(`No 'status:' field in frontmatter of ${path}`);
  return match[1];
}

export function writeSpecStatus(path, newStatus) {
  const text = readFileSync(path, 'utf-8');
  const fm = extractFrontmatter(text);
  const currentMatch = fm.match(/^status:\s*(\S+)/m);
  if (!currentMatch) throw new Error(`No 'status:' field in frontmatter of ${path}`);
  const current = currentMatch[1];
  if (!validateTransition(current, newStatus)) {
    throw new Error(
      `Illegal transition ${current} → ${newStatus} for ${path}. ` +
      `Legal next states from '${current}': ${(LEGAL_TRANSITIONS[current] || []).join(', ') || '(none, terminal)'}.`
    );
  }
  const updated = text.replace(/^status:\s*\S+/m, `status: ${newStatus}`);
  writeFileSync(path, updated, 'utf-8');
}

function extractFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('No frontmatter delimited by --- found');
  return m[1];
}

// CLI entry: `node scripts/spec-status.mjs <cmd> <args>`
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, ...args] = process.argv;
  try {
    switch (cmd) {
      case 'read':
        console.log(readSpecStatus(args[0]));
        break;
      case 'write':
        writeSpecStatus(args[0], args[1]);
        console.log(`${args[0]}: status → ${args[1]}`);
        break;
      case 'validate':
        process.exit(validateTransition(args[0], args[1]) ? 0 : 1);
      default:
        console.error('Usage: spec-status.mjs <read|write|validate> <args...>');
        process.exit(2);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
