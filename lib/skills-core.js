import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const UPDATE_CACHE_TTL_MS = 5 * 60 * 1000;
const updateCheckCache = new Map();

function stripMatchingQuotes(value) {
    if (value.length < 2) return value;
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return value.slice(1, -1);
    }
    return value;
}

function parseFrontmatter(content) {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) return {};

    const parsed = {};
    const lines = match[1].split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const colonIndex = line.indexOf(':');
        if (colonIndex <= 0) continue;

        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();

        // Ignore block scalars (unsupported in skill frontmatter).
        if (value === '|' || value === '>') continue;

        value = stripMatchingQuotes(value);
        parsed[key] = value;
    }

    return parsed;
}

/**
 * Extract YAML frontmatter from a skill file.
 * Current format:
 * ---
 * name: skill-name
 * description: Use when [trigger condition]
 * ---
 *
 * @param {string} filePath - Path to SKILL.md file
 * @returns {{name: string, description: string}}
 */
function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const frontmatter = parseFrontmatter(content);
        return {
            name: frontmatter.name || '',
            description: frontmatter.description || ''
        };
    } catch (error) {
        return { name: '', description: '' };
    }
}

/**
 * Find all SKILL.md files in a directory recursively.
 *
 * @param {string} dir - Directory to search
 * @param {string} sourceType - 'personal' or 'superpowers' for namespacing
 * @param {number} maxDepth - Maximum recursion depth (default: 3)
 * @returns {Array<{path: string, name: string, description: string, sourceType: string}>}
 */
function findSkillsInDir(dir, sourceType, maxDepth = 3) {
    const skills = [];

    if (!fs.existsSync(dir)) return skills;

    function recurse(currentDir, depth) {
        if (depth > maxDepth) return;

        let entries = [];
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch (error) {
            return;
        }
        entries.sort((a, b) => a.name.localeCompare(b.name));

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith('.')) continue;

            // Check for SKILL.md in this directory
            const skillFile = path.join(fullPath, 'SKILL.md');
            if (fs.existsSync(skillFile)) {
                const { name, description } = extractFrontmatter(skillFile);
                skills.push({
                    path: fullPath,
                    skillFile: skillFile,
                    name: name || entry.name,
                    description: description || '',
                    sourceType: sourceType
                });
                continue;
            }

            // Recurse into subdirectories only when this directory is not a skill root.
            recurse(fullPath, depth + 1);
        }
    }

    recurse(dir, 0);
    return skills;
}

/**
 * Resolve a skill name to its file path, handling shadowing
 * (personal skills override superpowers skills).
 *
 * @param {string} skillName - Name like "superpowers:brainstorming", "superpowers-optimized:brainstorming", or "my-skill"
 * @param {string} superpowersDir - Path to superpowers skills directory
 * @param {string} personalDir - Path to personal skills directory
 * @returns {{skillFile: string, sourceType: string, skillPath: string} | null}
 */
function resolveSkillPath(skillName, superpowersDir, personalDir) {
    // Strip supported namespace prefix if present.
    const forceSuperpowers = skillName.startsWith('superpowers:') || skillName.startsWith('superpowers-optimized:');
    const actualSkillName = forceSuperpowers
        ? skillName.replace(/^(superpowers|superpowers-optimized):/, '')
        : skillName;

    // Try personal skills first (unless explicitly superpowers:)
    if (!forceSuperpowers && personalDir) {
        const personalPath = path.join(personalDir, actualSkillName);
        const personalSkillFile = path.join(personalPath, 'SKILL.md');
        if (fs.existsSync(personalSkillFile)) {
            return {
                skillFile: personalSkillFile,
                sourceType: 'personal',
                skillPath: actualSkillName
            };
        }
    }

    // Try superpowers skills
    if (superpowersDir) {
        const superpowersPath = path.join(superpowersDir, actualSkillName);
        const superpowersSkillFile = path.join(superpowersPath, 'SKILL.md');
        if (fs.existsSync(superpowersSkillFile)) {
            return {
                skillFile: superpowersSkillFile,
                sourceType: 'superpowers',
                skillPath: actualSkillName
            };
        }
    }

    return null;
}

/**
 * Check if a git repository has updates available.
 *
 * @param {string} repoDir - Path to git repository
 * @returns {boolean} - True if updates are available
 */
function checkForUpdates(repoDir) {
    if (!repoDir || !fs.existsSync(repoDir)) return false;

    const now = Date.now();
    const cached = updateCheckCache.get(repoDir);
    if (cached && (now - cached.checkedAt) < UPDATE_CACHE_TTL_MS) {
        return cached.hasUpdates;
    }

    if (!fs.existsSync(path.join(repoDir, '.git'))) {
        updateCheckCache.set(repoDir, { checkedAt: now, hasUpdates: false });
        return false;
    }

    try {
        // Skip fetch when no origin is configured.
        execSync('git remote get-url origin', {
            cwd: repoDir,
            timeout: 1000,
            stdio: 'pipe'
        });

        // Quick network-bounded update check.
        execSync('git fetch --quiet origin', {
            cwd: repoDir,
            timeout: 3000,
            stdio: 'pipe'
        });

        const output = execSync('git status --porcelain=v1 --branch', {
            cwd: repoDir,
            timeout: 1000,
            encoding: 'utf8',
            stdio: 'pipe'
        });

        const hasUpdates = output.split('\n').some(
            (line) => line.startsWith('## ') && line.includes('[behind ')
        );
        updateCheckCache.set(repoDir, { checkedAt: now, hasUpdates });
        return hasUpdates;
    } catch (error) {
        // Network down, git error, timeout, etc. - don't block bootstrap
        updateCheckCache.set(repoDir, { checkedAt: now, hasUpdates: false });
        return false;
    }
}

/**
 * Strip YAML frontmatter from skill content, returning just the content.
 *
 * @param {string} content - Full content including frontmatter
 * @returns {string} - Content without frontmatter
 */
function stripFrontmatter(content) {
    if (typeof content !== 'string') return '';
    return content.replace(FRONTMATTER_REGEX, '').trim();
}

export {
    extractFrontmatter,
    findSkillsInDir,
    resolveSkillPath,
    checkForUpdates,
    stripFrontmatter
};
