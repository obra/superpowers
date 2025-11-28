#!/usr/bin/env node

/**
 * Superpowers MCP Server for Gemini CLI
 *
 * Exposes each skill as its own tool for better discoverability.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
  name: 'superpowers',
  version: '3.5.1',
});

// Determine directories
const homeDir = os.homedir();
const mcpServerDir = path.resolve(__dirname, '..');
const extensionRoot = path.resolve(mcpServerDir, '..');
const repoRoot = path.resolve(extensionRoot, '..');
const superpowersSkillsDir = path.join(repoRoot, 'skills');
const personalSkillsDir = path.join(homeDir, '.config', 'gemini', 'skills');
const originalCwd = process.env.ORIGINAL_CWD || process.cwd();
const projectSkillsDir = path.join(originalCwd, '.gemini', 'skills');

interface SkillInfo {
  path: string;
  skillFile: string;
  name: string;
  slug: string;
  description: string;
  sourceType: 'project' | 'personal' | 'superpowers';
}

interface Frontmatter {
  name: string;
  description: string;
}

/**
 * Convert a name to a slug (lowercase, hyphens).
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract YAML frontmatter from a skill file.
 */
async function extractFrontmatter(filePath: string): Promise<Frontmatter> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    let inFrontmatter = false;
    let name = '';
    let description = '';

    for (const line of lines) {
      if (line.trim() === '---') {
        if (inFrontmatter) break;
        inFrontmatter = true;
        continue;
      }

      if (inFrontmatter) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          switch (key) {
            case 'name':
              name = value.trim();
              break;
            case 'description':
              description = value.trim();
              break;
          }
        }
      }
    }

    return { name, description };
  } catch {
    return { name: '', description: '' };
  }
}

/**
 * Strip YAML frontmatter from skill content.
 */
function stripFrontmatter(content: string): string {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnded = false;
  const contentLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFrontmatter) {
        frontmatterEnded = true;
        continue;
      }
      inFrontmatter = true;
      continue;
    }

    if (frontmatterEnded || !inFrontmatter) {
      contentLines.push(line);
    }
  }

  return contentLines.join('\n').trim();
}

/**
 * Check if a directory exists.
 */
async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists.
 */
async function fileExists(file: string): Promise<boolean> {
  try {
    const stat = await fs.stat(file);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Find all SKILL.md files in a directory recursively.
 */
async function findSkillsInDir(
  dir: string,
  sourceType: 'project' | 'personal' | 'superpowers',
  maxDepth: number = 3
): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  if (!(await dirExists(dir))) return skills;

  async function recurse(currentDir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        const skillFile = path.join(fullPath, 'SKILL.md');
        if (await fileExists(skillFile)) {
          const { name, description } = await extractFrontmatter(skillFile);
          const skillName = name || entry.name;
          skills.push({
            path: fullPath,
            skillFile: skillFile,
            name: skillName,
            slug: slugify(skillName),
            description: description || '',
            sourceType: sourceType,
          });
        }

        await recurse(fullPath, depth + 1);
      }
    }
  }

  await recurse(dir, 0);
  return skills;
}

/**
 * Load skill content and return formatted result.
 */
async function loadSkillContent(skill: SkillInfo): Promise<CallToolResult> {
  let fullContent: string;
  try {
    fullContent = await fs.readFile(skill.skillFile, 'utf8');
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading skill file: ${error}`,
        },
      ],
    };
  }

  const content = stripFrontmatter(fullContent);
  const skillDirectory = path.dirname(skill.skillFile);

  const marker = `[SKILL-LOADED: ${skill.name} at ${new Date().toISOString()}]`;

  const header = `# ${skill.name}
# ${skill.description || ''}
# Supporting files in: ${skillDirectory}
# ============================================`;

  return {
    content: [
      {
        type: 'text',
        text: `${marker}\n\n${header}\n\n${content}`,
      },
    ],
  };
}

/**
 * Register a skill as its own tool.
 */
function registerSkillTool(skill: SkillInfo): void {
  // Use slug as tool name for valid identifier
  const toolName = skill.slug;

  // Use the skill's description directly
  const toolDescription = skill.description || `Invoke the ${skill.name} skill for guidance on this type of task.`;

  server.tool(
    toolName,
    toolDescription,
    {
      task: z
        .string()
        .optional()
        .describe('Description of what you want to accomplish with this skill'),
    },
    async ({ task }): Promise<CallToolResult> => {
      const result = await loadSkillContent(skill);

      // Prepend the task if provided
      if (task && result.content[0] && result.content[0].type === 'text') {
        const text = result.content[0].text as string;
        result.content[0] = {
          type: 'text',
          text: `Task: ${task}\n\n${text}`,
        };
      }

      return result;
    }
  );
}

/**
 * Discover and register all skills as individual tools.
 */
async function registerAllSkills(): Promise<void> {
  const projectSkills = await findSkillsInDir(projectSkillsDir, 'project', 3);
  const personalSkills = await findSkillsInDir(personalSkillsDir, 'personal', 3);
  const superpowersSkills = await findSkillsInDir(superpowersSkillsDir, 'superpowers', 3);

  const allSkills = [...projectSkills, ...personalSkills, ...superpowersSkills];

  // Track registered slugs to avoid duplicates
  const registeredSlugs = new Set<string>();

  for (const skill of allSkills) {
    if (registeredSlugs.has(skill.slug)) {
      console.error(`Skipping duplicate skill slug: ${skill.slug}`);
      continue;
    }

    registeredSlugs.add(skill.slug);
    registerSkillTool(skill);
  }

  console.error(`Registered ${registeredSlugs.size} skill tools`);
}

async function startServer(): Promise<void> {
  // Register all skills as individual tools
  await registerAllSkills();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer();
