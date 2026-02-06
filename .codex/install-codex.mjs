#!/usr/bin/env node

// Minimal installer for Superpowers native Codex skill discovery.
// Creates a symlink from ~/.agents/skills/superpowers → repo skills/
// and updates ~/.codex/AGENTS.md with a gatekeeper block.

import { existsSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, lstatSync, readlinkSync } from 'fs';
import { join, resolve } from 'path';
import { homedir, platform } from 'os';
import { execSync } from 'child_process';

const home = homedir();
const isWindows = platform() === 'win32';

// Paths
const repoSkillsDir = resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'), '..', 'skills');
const agentsSkillsDir = join(home, '.agents', 'skills');
const symlinkPath = join(agentsSkillsDir, 'superpowers');
const agentsMdPath = join(home, '.codex', 'AGENTS.md');

const GATEKEEPER_BEGIN = '<!-- superpowers:begin -->';
const GATEKEEPER_END = '<!-- superpowers:end -->';

const GATEKEEPER_BLOCK = `${GATEKEEPER_BEGIN}
## Superpowers

**MANDATORY: Invoke $using-superpowers before proceeding with ANY task.**

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

### Tool Mappings for Codex
- \`TodoWrite\` → \`update_plan\`
- \`Task\`/\`Subagent\` → \`spawn_agent\` + \`wait\` (or sequential if collab disabled)
- \`Skill\` tool → native \`$skill-name\` mention
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → use your native equivalents
${GATEKEEPER_END}`;

// --- Symlink creation ---

function createSymlink() {
  // Ensure parent dir exists
  mkdirSync(agentsSkillsDir, { recursive: true });

  // Check if target already exists
  if (existsSync(symlinkPath)) {
    try {
      const stat = lstatSync(symlinkPath);
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(symlinkPath);
        if (resolve(target) === resolve(repoSkillsDir)) {
          console.log(`✓ Symlink already exists: ${symlinkPath} → ${repoSkillsDir}`);
          return;
        }
        console.log(`! Existing symlink points to ${target}, updating to ${repoSkillsDir}`);
        execSync(isWindows ? `rmdir "${symlinkPath}"` : `rm "${symlinkPath}"`);
      } else {
        console.error(`✗ ${symlinkPath} already exists and is not a symlink.`);
        console.error(`  Remove it manually and re-run the installer.`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`✗ Cannot inspect ${symlinkPath}: ${err.message}`);
      process.exit(1);
    }
  }

  // Create the link (symlink on macOS/Linux, junction on Windows)
  const linkType = isWindows ? 'junction' : 'dir';
  const linkLabel = isWindows ? 'junction' : 'symlink';
  try {
    symlinkSync(repoSkillsDir, symlinkPath, linkType);
    console.log(`✓ Created ${linkLabel}: ${symlinkPath} → ${repoSkillsDir}`);
  } catch (err) {
    if (isWindows) {
      // Node API failed on Windows — try junction via cmd.exe
      try {
        execSync(`cmd /c mklink /J "${symlinkPath}" "${repoSkillsDir}"`, { stdio: 'pipe' });
        console.log(`✓ Created junction: ${symlinkPath} → ${repoSkillsDir}`);
      } catch (junctionErr) {
        console.error(`✗ Failed to create junction: ${junctionErr.message}`);
        console.error(`  Try running PowerShell as administrator.`);
        process.exit(1);
      }
    } else {
      console.error(`✗ Failed to create symlink: ${err.message}`);
      process.exit(1);
    }
  }
}

// --- AGENTS.md update ---

// Patterns that identify the old bootstrap block
const OLD_BLOCK_PATTERNS = [
  'superpowers-codex bootstrap',
  'superpowers-codex use-skill',
  'superpowers-codex find-skills',
];

function removeOldBootstrapBlock(content) {
  const lines = content.split('\n');
  const result = [];
  let inOldBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of old block by its section header
    if (!inOldBlock && line.startsWith('## ') && line.includes('Superpowers')) {
      // Check if this section contains old bootstrap patterns (look ahead)
      const sectionEnd = lines.findIndex((l, j) => j > i && l.startsWith('## ') && !l.includes('Superpowers'));
      const sectionLines = lines.slice(i, sectionEnd === -1 ? lines.length : sectionEnd);
      const hasOldPatterns = sectionLines.some(l => OLD_BLOCK_PATTERNS.some(p => l.includes(p)));
      if (hasOldPatterns) {
        inOldBlock = true;
        // Also remove leading blank lines before the header
        while (result.length > 0 && result[result.length - 1].trim() === '') {
          result.pop();
        }
        continue;
      }
    }

    if (inOldBlock) {
      // End of old block: next non-Superpowers section header
      if (line.startsWith('## ') && !line.includes('Superpowers')) {
        inOldBlock = false;
        result.push(line);
        continue;
      }
      // Skip this line (part of old block)
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

function updateAgentsMd() {
  let content = '';

  if (existsSync(agentsMdPath)) {
    content = readFileSync(agentsMdPath, 'utf8');

    // Check if gatekeeper already present
    if (content.includes(GATEKEEPER_BEGIN)) {
      // Replace existing gatekeeper block
      const beginIdx = content.indexOf(GATEKEEPER_BEGIN);
      const endIdx = content.indexOf(GATEKEEPER_END);
      if (endIdx > beginIdx) {
        content = content.slice(0, beginIdx) + GATEKEEPER_BLOCK + content.slice(endIdx + GATEKEEPER_END.length);
        writeFileSync(agentsMdPath, content, 'utf8');
        console.log(`✓ Updated existing gatekeeper block in ${agentsMdPath}`);
        return;
      }
    }

    // Remove old bootstrap block if present
    const hasOldBlock = OLD_BLOCK_PATTERNS.some(p => content.includes(p));
    if (hasOldBlock) {
      content = removeOldBootstrapBlock(content);
      console.log(`  Removed old bootstrap block from AGENTS.md`);
    }
  } else {
    // Ensure directory exists
    mkdirSync(join(home, '.codex'), { recursive: true });
  }

  // Append gatekeeper block
  const separator = content.length > 0 && !content.endsWith('\n\n') ? (content.endsWith('\n') ? '\n' : '\n\n') : '';
  content = content + separator + GATEKEEPER_BLOCK + '\n';
  writeFileSync(agentsMdPath, content, 'utf8');
  console.log(`✓ Added gatekeeper block to ${agentsMdPath}`);
}

// --- Main ---

console.log('Superpowers — Codex Native Skills Installer');
console.log('');

if (!existsSync(repoSkillsDir)) {
  console.error(`✗ Skills directory not found: ${repoSkillsDir}`);
  console.error(`  Are you running this from the superpowers repo?`);
  process.exit(1);
}

createSymlink();
updateAgentsMd();

console.log('');
console.log('Done! Restart Codex to discover superpowers skills natively.');
console.log('');
console.log('To update:  cd ~/.codex/superpowers && git pull');
console.log('To remove:  rm ~/.agents/skills/superpowers');
console.log('            Then remove the superpowers block from ~/.codex/AGENTS.md');
