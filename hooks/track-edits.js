#!/usr/bin/env node
/**
 * PostToolUse Hook — File Edit Tracking
 *
 * After every Edit|Write tool use, logs the file path and timestamp
 * to a session-scoped edit log. This log feeds downstream hooks
 * (stop-reminders) to know what was changed during the session.
 *
 * Input:  stdin JSON with { tool_name, tool_input, session_id, cwd, ... }
 * Output: stdout JSON (always {}, never blocks)
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.claude',
  'hooks-logs'
);

const EDIT_LOG = path.join(LOG_DIR, 'edit-log.txt');
const MAX_LINES = 500;

/**
 * Append an entry to the edit log.
 * Format: ISO-timestamp | tool | file_path
 */
function logEdit(tool, filePath, cwd) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Resolve relative paths against cwd
    let resolved = filePath;
    if (filePath && !path.isAbsolute(filePath) && cwd) {
      resolved = path.resolve(cwd, filePath);
    }

    const entry = `${new Date().toISOString()} | ${tool} | ${resolved}\n`;
    fs.appendFileSync(EDIT_LOG, entry);

    // Auto-rotate: check file size first (cheaper than reading content)
    // Only rotate if file exceeds ~50KB (roughly 500 lines at 100 chars each)
    rotateIfNeeded();
  } catch {
    // Silently ignore logging errors — never block the tool
  }
}

function rotateIfNeeded() {
  try {
    const stat = fs.statSync(EDIT_LOG);
    // Only read file for rotation if it exceeds ~50KB
    if (stat.size < 50 * 1024) return;

    const content = fs.readFileSync(EDIT_LOG, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    if (lines.length > MAX_LINES) {
      const trimmed = lines.slice(-MAX_LINES).join('\n') + '\n';
      fs.writeFileSync(EDIT_LOG, trimmed);
    }
  } catch {
    // Ignore rotation errors
  }
}

/**
 * Read the edit log and return entries from the current session.
 * Used by stop-reminders to check what files were changed.
 */
function getRecentEdits(withinMinutes = 60) {
  try {
    if (!fs.existsSync(EDIT_LOG)) return [];

    const content = fs.readFileSync(EDIT_LOG, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);

    return lines
      .map(line => {
        const parts = line.split(' | ');
        if (parts.length < 3) return null;
        return {
          timestamp: parts[0],
          tool: parts[1],
          filePath: parts.slice(2).join(' | '), // Handle paths with |
        };
      })
      .filter(entry => entry && new Date(entry.timestamp) > cutoff);
  } catch {
    return [];
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const data = JSON.parse(input);
    const { tool_name, tool_input, cwd } = data;

    // Only track Edit and Write operations
    if (tool_name !== 'Edit' && tool_name !== 'Write') {
      process.stdout.write('{}');
      return;
    }

    const filePath = tool_input?.file_path;
    if (filePath) {
      logEdit(tool_name, filePath, cwd);
    }
  } catch {
    // Silently ignore parse errors
  }

  process.stdout.write('{}');
}

if (require.main === module) {
  main();
} else {
  module.exports = { logEdit, getRecentEdits, rotateIfNeeded, EDIT_LOG, LOG_DIR };
}
