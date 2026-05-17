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

// AI-generated workspace artifacts that should never be committed
const AI_ARTIFACTS = ['project-map.md', 'session-log.md', 'state.md', 'known-issues.md'];

/**
 * Ensure an AI artifact file is listed in the nearest .gitignore.
 * Called whenever Claude writes one of these files — adds the entry
 * immediately so `git status` never shows it as an untracked file.
 */
function ensureGitignored(filePath, cwd) {
  try {
    const basename = path.basename(filePath);
    if (!AI_ARTIFACTS.includes(basename)) return;

    const dir = filePath && path.isAbsolute(filePath) ? path.dirname(filePath) : (cwd || '.');
    const gitignorePath = path.join(dir, '.gitignore');

    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf8');
    }

    // Already ignored — nothing to do
    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes(basename)) return;

    const hasSection = content.includes('# AI assistant artifacts');
    const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';

    if (!hasSection) {
      fs.appendFileSync(gitignorePath, `${prefix}\n# AI assistant artifacts\n${basename}\n`);
    } else {
      fs.appendFileSync(gitignorePath, `${prefix}${basename}\n`);
    }
  } catch {
    // Silently ignore — never block tool execution
  }
}

const EDIT_LOG = path.join(LOG_DIR, 'edit-log.txt');
const LAST_SAVED_FILE = path.join(LOG_DIR, 'last-saved-entry.txt');
const MAX_LINES = 500;

/**
 * Append an entry to the edit log.
 * Format: ISO-timestamp | session_id | tool | file_path
 * (Legacy format without session_id is still accepted on read)
 */
function logEdit(tool, filePath, cwd, sessionId) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Resolve relative paths against cwd
    let resolved = filePath;
    if (filePath && !path.isAbsolute(filePath) && cwd) {
      resolved = path.resolve(cwd, filePath);
    }

    const sid = sessionId || '';
    const entry = `${new Date().toISOString()} | ${sid} | ${tool} | ${resolved}\n`;
    fs.appendFileSync(EDIT_LOG, entry);

    // Auto-add AI workspace artifacts to .gitignore on first write
    ensureGitignored(resolved, cwd);

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
 * Supports both the legacy 3-field format and new 4-field format with session_id.
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
        if (parts.length >= 4) {
          // New format: timestamp | session_id | tool | filePath
          return {
            timestamp: parts[0],
            sessionId: parts[1] || null,
            tool: parts[2],
            filePath: parts.slice(3).join(' | '),
          };
        }
        // Legacy format: timestamp | tool | filePath
        return {
          timestamp: parts[0],
          sessionId: null,
          tool: parts[1],
          filePath: parts.slice(2).join(' | '),
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
    const { tool_name, tool_input, cwd, session_id } = data;

    // Only track Edit and Write operations
    if (tool_name !== 'Edit' && tool_name !== 'Write') {
      process.stdout.write('{}');
      return;
    }

    const filePath = tool_input?.file_path;
    if (filePath) {
      logEdit(tool_name, filePath, cwd, session_id);

      // Track when a [saved] entry is written to session-log.md so that
      // stop-reminders can ask "any significant edits since last [saved]?"
      // rather than "any significant edits in the last 30 minutes?"
      const content = tool_input?.new_string || tool_input?.content || '';
      if (
        path.basename(filePath).toLowerCase().startsWith('session-log') &&
        content.includes('[saved]')
      ) {
        try {
          if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
          fs.writeFileSync(LAST_SAVED_FILE, new Date().toISOString());
        } catch {
          // Never block tool execution
        }
      }
    }
  } catch {
    // Silently ignore parse errors
  }

  process.stdout.write('{}');
}

if (require.main === module) {
  main();
} else {
  module.exports = { logEdit, getRecentEdits, rotateIfNeeded, ensureGitignored, EDIT_LOG, LAST_SAVED_FILE, LOG_DIR };
}
