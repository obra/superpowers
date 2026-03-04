/**
 * Beads Integration Module for Horspower
 *
 * Provides bidirectional synchronization between Horspowers documentation
 * and Beads task tracking system.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { readConfig } from './config-manager.js';

/**
 * BeadsSync class - Manages synchronization between Horspowers and Beads
 */
class BeadsSync {
  constructor(projectDir, options = {}) {
    this.projectDir = projectDir || process.cwd();
    this.config = this._loadBeadsConfig();
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Load beads configuration from horspowers config
   * @private
   */
  _loadBeadsConfig() {
    const config = readConfig(this.projectDir);
    return config?.beads || { enabled: false };
  }

  /**
   * Check if beads integration is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.config.enabled === true;
  }

  /**
   * Check if beads CLI is available
   * @returns {boolean}
   */
  isAvailable() {
    try {
      execSync('bd --version', { stdio: 'pipe' });
      return true;
    } catch {
      if (this.verbose) {
        console.log('[BeadsSync] Beads CLI not available');
      }
      return false;
    }
  }

  /**
   * Check if both enabled and available
   * @returns {boolean}
   */
  canSync() {
    const enabled = this.isEnabled();
    const available = this.isAvailable();

    // Warn if enabled but not available
    if (enabled && !available) {
      console.warn('[BeadsSync] ⚠️  beads.enabled: true in config, but beads CLI is not installed or not in PATH');
      console.warn('[BeadsSync]    Install beads: https://github.com/steveyegge/beads');
    }

    return enabled && available;
  }

  /**
   * Extract YAML frontmatter from markdown content
   * @private
   */
  _extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const lines = match[1].split('\n');
    const frontmatter = {};
    let currentObj = frontmatter;
    const stack = [];
    let indent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const currentIndent = line.search(/\S/);

      if (currentIndent < indent) {
        while (stack.length > 0 && stack[stack.length - 1].indent >= currentIndent) {
          stack.pop();
        }
        currentObj = stack.length > 0 ? stack[stack.length - 1].obj : frontmatter;
      }
      indent = currentIndent;

      const keyMatch = trimmed.match(/^([^:#]+):\s*(.+)?$/);
      if (keyMatch) {
        const [, key, value] = keyMatch;

        if (value === null || value === undefined || value === '') {
          currentObj[key] = {};
          stack.push({ indent: currentIndent, obj: currentObj });
          currentObj = currentObj[key];
        } else {
          let parsedValue;
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          else if (/^-?\d+(\.\d+)?$/.test(value)) parsedValue = Number(value);
          else if (value.startsWith('"') || value.startsWith("'")) {
            parsedValue = value.slice(1, -1);
          } else {
            parsedValue = value;
          }
          currentObj[key] = parsedValue;
        }
      }
    }

    return frontmatter;
  }

  /**
   * Convert object to YAML format
   * @private
   */
  _objectToYAML(obj, indent = 0) {
    const lines = [];
    const prefix = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        lines.push(`${prefix}${key}:`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        lines.push(this._objectToYAML(value, indent + 1));
      } else {
        let strValue;
        if (typeof value === 'boolean') strValue = value ? 'true' : 'false';
        else if (typeof value === 'number') strValue = String(value);
        else {
          // String value - check if needs quoting
          const needsQuote = /[:#\n\r]/.test(value) || value.startsWith(' ') || value.endsWith(' ');
          strValue = needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value;
        }
        lines.push(`${prefix}${key}: ${strValue}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Extract beads ID from document
   * @param {string} docPath - Path to markdown document
   * @returns {string|null} - Beads ID or null
   */
  extractBeadsId(docPath) {
    try {
      const fullPath = path.resolve(this.projectDir, docPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const frontmatter = this._extractFrontmatter(content);
      return frontmatter?.beads?.id || null;
    } catch (e) {
      if (this.verbose) {
        console.log(`[BeadsSync] Failed to extract beads ID from ${docPath}:`, e.message);
      }
      return null;
    }
  }

  /**
   * Update beads metadata in document frontmatter
   * @param {string} docPath - Path to markdown document
   * @param {Object} beadsData - Beads metadata { id, type, parent?, ... }
   * @returns {boolean} - Success status
   */
  updateDocBeadsId(docPath, beadsData) {
    try {
      const fullPath = path.resolve(this.projectDir, docPath);
      let content = fs.readFileSync(fullPath, 'utf8');

      const existingFm = content.match(/^---\n([\s\S]*?)\n---/);
      let frontmatter = existingFm ? this._extractFrontmatter(content) : {};

      // Merge beads data
      frontmatter.beads = {
        ...frontmatter.beads,
        ...beadsData,
        synced_at: new Date().toISOString()
      };

      const newFm = this._objectToYAML(frontmatter);

      if (existingFm) {
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFm}\n---`);
      } else {
        content = `---\n${newFm}\n---\n\n${content}`;
      }

      fs.writeFileSync(fullPath, content, 'utf8');

      if (this.verbose) {
        console.log(`[BeadsSync] Updated ${docPath} with beads ID: ${beadsData.id}`);
      }

      return true;
    } catch (e) {
      console.error(`[BeadsSync] Failed to update ${docPath}:`, e.message);
      return false;
    }
  }

  /**
   * Execute beads command
   * @private
   */
  _execBeads(args, options = {}) {
    if (this.dryRun) {
      console.log(`[DRY RUN] bd ${args.join(' ')}`);
      return { stdout: 'dry-run-id', stderr: '', status: 0 };
    }

    try {
      const result = execSync(`bd ${args.join(' ')}`, {
        encoding: 'utf8',
        stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : 'pipe',
        cwd: this.projectDir,
        ...options
      });
      return { stdout: result, stderr: '', status: 0 };
    } catch (e) {
      if (this.verbose) {
        console.error(`[BeadsSync] Command failed: bd ${args.join(' ')}`);
        console.error(e.message);
      }
      return { stdout: '', stderr: e.message, status: e.status || 1 };
    }
  }

  /**
   * Create or update an Epic from a design document
   * @param {string} docPath - Path to design document
   * @param {string} title - Epic title
   * @param {Object} options - Additional options
   * @returns {string|null} - Beads ID or null
   */
  syncEpic(docPath, title, options = {}) {
    if (!this.canSync()) return null;

    const fullPath = path.resolve(this.projectDir, docPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`[BeadsSync] Document not found: ${docPath}`);
      return null;
    }

    const existingId = this.extractBeadsId(docPath);

    try {
      if (existingId) {
        // Update existing epic
        const args = ['update', existingId, '--design', `@${fullPath}`];
        if (options.notes) args.push('--notes', options.notes);

        const result = this._execBeads(args, { silent: true });
        if (result.status === 0) {
          if (this.verbose) console.log(`[BeadsSync] Updated epic: ${existingId}`);
          return existingId;
        }
      } else {
        // Create new epic
        const args = ['create', title, '--type=epic', '--design', `@${fullPath}`, '--silent'];
        if (options.labels) args.push('--labels', options.labels.join(','));
        if (options.priority !== undefined) args.push('--priority', String(options.priority));

        const result = this._execBeads(args, { silent: true });
        if (result.status === 0) {
          const newId = result.stdout.trim();
          this.updateDocBeadsId(docPath, { id: newId, type: 'epic' });
          if (this.verbose) console.log(`[BeadsSync] Created epic: ${newId}`);
          return newId;
        }
      }
    } catch (e) {
      console.error(`[BeadsSync] Failed to sync epic:`, e.message);
    }

    return null;
  }

  /**
   * Create a Task from a task document
   * @param {string} docPath - Path to task document
   * @param {string} title - Task title
   * @param {string|null} parentEpicId - Parent epic ID
   * @param {Object} options - Additional options
   * @returns {string|null} - Beads ID or null
   */
  createTask(docPath, title, parentEpicId = null, options = {}) {
    if (!this.canSync()) return null;

    const fullPath = path.resolve(this.projectDir, docPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`[BeadsSync] Document not found: ${docPath}`);
      return null;
    }

    // Check if already has beads ID
    const existingId = this.extractBeadsId(docPath);
    if (existingId) {
      if (this.verbose) console.log(`[BeadsSync] Task already exists: ${existingId}`);
      return existingId;
    }

    try {
      const args = ['create', title, '--type=task', '--body-file', fullPath, '--silent'];
      if (parentEpicId) args.push('--parent', parentEpicId);
      if (options.labels) args.push('--labels', options.labels.join(','));
      if (options.priority !== undefined) args.push('--priority', String(options.priority));
      if (options.estimate) args.push('--estimate', String(options.estimate));

      const result = this._execBeads(args, { silent: true });
      if (result.status === 0) {
        const newId = result.stdout.trim();
        this.updateDocBeadsId(docPath, {
          id: newId,
          type: 'task',
          parent: parentEpicId
        });
        if (this.verbose) console.log(`[BeadsSync] Created task: ${newId}`);
        return newId;
      }
    } catch (e) {
      console.error(`[BeadsSync] Failed to create task:`, e.message);
    }

    return null;
  }

  /**
   * Update task status
   * @param {string} docPath - Path to task document
   * @param {string} status - New status (in_progress, blocked, etc.)
   * @param {Object} options - Additional options
   * @returns {boolean} - Success status
   */
  updateStatus(docPath, status, options = {}) {
    if (!this.canSync()) return false;

    const beadsId = this.extractBeadsId(docPath);
    if (!beadsId) {
      if (this.verbose) console.log(`[BeadsSync] No beads ID found in ${docPath}`);
      return false;
    }

    try {
      const args = ['update', beadsId, `--status=${status}`];
      if (options.claim) args.push('--claim');
      if (options.notes) args.push('--append-notes', options.notes);

      const result = this._execBeads(args, { silent: true });
      if (result.status === 0) {
        if (this.verbose) console.log(`[BeadsSync] Updated status: ${beadsId} -> ${status}`);
        return true;
      }
    } catch (e) {
      console.error(`[BeadsSync] Failed to update status:`, e.message);
    }

    return false;
  }

  /**
   * Close a task
   * @param {string} docPath - Path to task document
   * @param {Object} options - Additional options
   * @returns {boolean} - Success status
   */
  closeTask(docPath, options = {}) {
    if (!this.canSync()) return false;

    const beadsId = this.extractBeadsId(docPath);
    if (!beadsId) {
      if (this.verbose) console.log(`[BeadsSync] No beads ID found in ${docPath}`);
      return false;
    }

    try {
      const args = ['close', beadsId];
      if (options.reason) args.push('--reason', options.reason);
      if (options.continue) args.push('--continue');

      const result = this._execBeads(args, { silent: true });
      if (result.status === 0) {
        if (this.verbose) console.log(`[BeadsSync] Closed task: ${beadsId}`);
        return true;
      }
    } catch (e) {
      console.error(`[BeadsSync] Failed to close task:`, e.message);
    }

    return false;
  }

  /**
   * Add dependency between tasks
   * @param {string} taskId - Task ID (or doc path)
   * @param {string} dependsOnId - Dependency task ID (or doc path)
   * @returns {boolean} - Success status
   */
  addDependency(taskId, dependsOnId) {
    if (!this.canSync()) return false;

    // Resolve doc paths to beads IDs if needed
    const resolvedTaskId = taskId.startsWith('bd-') ? taskId : this.extractBeadsId(taskId);
    const resolvedDepId = dependsOnId.startsWith('bd-') ? dependsOnId : this.extractBeadsId(dependsOnId);

    if (!resolvedTaskId || !resolvedDepId) {
      console.error(`[BeadsSync] Could not resolve beads IDs`);
      return false;
    }

    try {
      const args = ['dep', 'add', resolvedTaskId, '--blocked-by', resolvedDepId];
      const result = this._execBeads(args, { silent: true });
      if (result.status === 0) {
        if (this.verbose) console.log(`[BeadsSync] Added dependency: ${resolvedTaskId} -> ${resolvedDepId}`);
        return true;
      }
    } catch (e) {
      console.error(`[BeadsSync] Failed to add dependency:`, e.message);
    }

    return false;
  }

  /**
   * Find epic ID by searching design documents
   * @returns {string|null} - Epic ID or null
   */
  findCurrentEpic() {
    if (!this.canSync()) return null;

    try {
      const plansDir = path.join(this.projectDir, 'docs', 'plans');
      if (!fs.existsSync(plansDir)) return null;

      const files = fs.readdirSync(plansDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse(); // Newest first

      for (const file of files) {
        if (file.includes('design')) {
          const docPath = path.join(plansDir, file);
          const epicId = this.extractBeadsId(docPath);
          if (epicId) return epicId;
        }
      }
    } catch (e) {
      if (this.verbose) console.log(`[BeadsSync] Failed to find current epic:`, e.message);
    }

    return null;
  }

  /**
   * Sync task status from beads to document
   * @param {string} docPath - Path to task document
   * @returns {Object|null} - Status info or null
   */
  syncFromBeads(docPath) {
    if (!this.canSync()) return null;

    const beadsId = this.extractBeadsId(docPath);
    if (!beadsId) return null;

    try {
      const result = this._execBeads(['show', beadsId, '--json'], { silent: true });
      if (result.status === 0) {
        const taskInfo = JSON.parse(result.stdout);
        // Could update document with status info here
        return taskInfo;
      }
    } catch (e) {
      if (this.verbose) console.log(`[BeadsSync] Failed to sync from beads:`, e.message);
    }

    return null;
  }
}

/**
 * Factory function - create BeadsSync instance from project directory
 * @param {string} projectDir - Project directory
 * @param {Object} options - Options
 * @returns {BeadsSync}
 */
function createBeadsSync(projectDir, options = {}) {
  return new BeadsSync(projectDir, options);
}

/**
 * Quick check if beads integration is enabled for a project
 * @param {string} projectDir - Project directory
 * @returns {boolean}
 */
function isBeadsEnabled(projectDir) {
  const config = readConfig(projectDir);
  return config?.beads?.enabled === true;
}

/**
 * Helper to sync a design document to beads epic
 * @param {string} docPath - Document path
 * @param {string} title - Epic title
 * @param {Object} options - Options
 * @returns {string|null}
 */
function syncDesignToEpic(docPath, title, options = {}) {
  const sync = createBeadsSync(options.projectDir);
  return sync.syncEpic(docPath, title, options);
}

/**
 * Helper to sync a task document to beads task
 * @param {string} docPath - Document path
 * @param {string} title - Task title
 * @param {string|null} parentEpicId - Parent epic ID
 * @param {Object} options - Options
 * @returns {string|null}
 */
function syncTaskToBeads(docPath, title, parentEpicId = null, options = {}) {
  const sync = createBeadsSync(options.projectDir);
  return sync.createTask(docPath, title, parentEpicId, options);
}

export {
  BeadsSync,
  createBeadsSync,
  isBeadsEnabled,
  syncDesignToEpic,
  syncTaskToBeads
};
