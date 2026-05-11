#!/usr/bin/env node

/**
 * Facio Superpowers CLI
 * Initialize documentation management for AI-assisted development
 *
 * Usage:
 *   npx facio-superpowers init [--project]
 *   npx facio-superpowers sync [--project]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPERPOWERS_REPO = 'https://github.com/vattention/facio-superpowers.git';
const CACHE_DIR = path.join(process.env.HOME, '.facio-superpowers');
const GLOBAL_SKILLS_DIR = path.join(process.env.HOME, '.claude', 'skills');
const CODEX_SKILLS_DIR = path.join(process.env.HOME, '.agents', 'skills');
const CODEX_SYMLINK = path.join(CODEX_SKILLS_DIR, 'superpowers');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureCache() {
  if (!fs.existsSync(CACHE_DIR)) {
    log('📦 Downloading facio-superpowers...', 'blue');
    execSync(`git clone ${SUPERPOWERS_REPO} ${CACHE_DIR}`, { stdio: 'inherit' });
  } else {
    log('🔄 Updating facio-superpowers...', 'blue');
    execSync('git pull', { cwd: CACHE_DIR, stdio: 'inherit' });
  }
}

// Prefer local source templates (when running from a clone) over the remote cache.
// Harness templates may not yet be in the published cache; this also enables local testing.
function getTemplatesDir() {
  const localDir = path.join(__dirname, 'templates');
  if (fs.existsSync(path.join(localDir, 'AGENTS-TEAM.md'))) {
    return localDir;
  }
  return path.join(CACHE_DIR, 'templates');
}

// {PROJECT_NAME} is substituted at CLI time.
// {SUPERPOWERS} / {BLUEPRINT} are intentionally left as-is — AI resolves them
// at @import-parse time via FACIO_SUPERPOWERS_PATH / FACIO_BLUEPRINT_PATH (spec §3.2).
function applySubstitutions(content, cwd) {
  return content.replace(/\{PROJECT_NAME\}/g, path.basename(cwd));
}

function init(projectLevel = false, harnessMode = false) {
  log('\n🚀 Initializing Facio Superpowers\n', 'green');

  // Ensure cache exists
  ensureCache();

  const cwd = process.cwd();

  // Determine skills installation location
  const skillsMode = projectLevel ? 'project' : 'global';
  const globalSkillsPath = GLOBAL_SKILLS_DIR;
  const displaySkillsPath = projectLevel ? '.claude/skills' : '~/.claude/skills';

  log(`📍 Skills mode: ${skillsMode} (${displaySkillsPath})`, 'blue');
  if (harnessMode) {
    log(`🏗  Harness mode: enabled (scaffolding .harness/, docs/{reference,design,plan}/)`, 'blue');
  }

  // Create directories
  log('\n📁 Creating directories...', 'blue');

  // Project-level directories (always created)
  const projectDirs = [
    'docs/adr',
    'docs/plans',
    'docs/modules',
    'docs/examples',
    'templates',
    'scripts',
  ];

  // Add project-level skill dirs if --project mode
  if (projectLevel) {
    projectDirs.unshift('.claude/skills', '.cursor/skills');
  }

  // Add Harness Engineering directories if --harness mode
  if (harnessMode) {
    projectDirs.push(
      '.harness',
      '.harness/anchors',
      '.github',
      'docs/reference',
      'docs/reference/capabilities',
      'docs/design',
      'docs/design/system',
      'docs/design/changes',
      'docs/plan',
    );
  }

  projectDirs.forEach(dir => {
    const fullPath = path.join(cwd, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`  ✓ ${dir}`, 'green');
    } else {
      log(`  - ${dir} (already exists)`, 'yellow');
    }
  });

  // Create global skills directory if needed
  if (!projectLevel) {
    if (!fs.existsSync(globalSkillsPath)) {
      fs.mkdirSync(globalSkillsPath, { recursive: true });
      log(`  ✓ ~/.claude/skills`, 'green');
    } else {
      log(`  - ~/.claude/skills (already exists)`, 'yellow');
    }
  }

  // Copy skills
  log('\n📚 Installing skills...', 'blue');

  // Get all skills from cache
  const skillsDir = path.join(CACHE_DIR, 'skills');
  let skills = [];
  if (fs.existsSync(skillsDir)) {
    skills = fs.readdirSync(skillsDir).filter(f => {
      const skillPath = path.join(skillsDir, f);
      return fs.statSync(skillPath).isDirectory() &&
             fs.existsSync(path.join(skillPath, 'SKILL.md'));
    });
  }

  skills.forEach(skill => {
    const src = path.join(CACHE_DIR, 'skills', skill);

    if (projectLevel) {
      // Project-level: copy to both .claude and .cursor
      const claudeDest = path.join(cwd, '.claude/skills', skill);
      const cursorDest = path.join(cwd, '.cursor/skills', skill);

      if (fs.existsSync(claudeDest)) {
        fs.rmSync(claudeDest, { recursive: true });
      }
      copyRecursive(src, claudeDest);

      if (fs.existsSync(cursorDest)) {
        fs.rmSync(cursorDest, { recursive: true });
      }
      copyRecursive(src, cursorDest);
    } else {
      // Global: copy to ~/.claude/skills only (Cursor also reads this)
      const globalDest = path.join(globalSkillsPath, skill);

      if (fs.existsSync(globalDest)) {
        fs.rmSync(globalDest, { recursive: true });
      }
      copyRecursive(src, globalDest);
    }

    log(`  ✓ ${skill}`, 'green');
  });

  log(`\n  Total: ${skills.length} skills installed`, 'green');

  // Codex symlink (always global — Codex reads ~/.agents/skills/)
  log('\n🔗 Setting up Codex integration...', 'blue');
  setupCodexSymlink();

  // Copy templates
  log('\n📄 Installing templates...', 'blue');
  const templatesDir = getTemplatesDir();
  const templates = [
    { src: 'adr-template.md', dest: 'templates/adr-template.md' },
    { src: 'README-ROOT.md', dest: 'templates/README-ROOT.md' },
    { src: 'DOCUMENTATION-MAP.md', dest: 'templates/DOCUMENTATION-MAP.md' },
    // In harness mode, AGENTS.md (installed below) is the canonical entry
    // and CLAUDE.md becomes a symlink to it; skip the legacy CLAUDE-PROJECT.md copy.
    ...(harnessMode ? [] : [{ src: 'CLAUDE-PROJECT.md', dest: 'CLAUDE.md' }]),
  ];

  templates.forEach(({ src, dest }) => {
    const srcPath = path.join(templatesDir, src);
    const destPath = path.join(cwd, dest);

    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        log(`  ✓ ${dest}`, 'green');
      } else {
        log(`  - ${dest} (already exists, skipping)`, 'yellow');
      }
    }
  });

  // Install Harness templates (with {PROJECT_NAME} substitution where requested)
  if (harnessMode) {
    log('\n🏗  Installing Harness templates...', 'blue');
    const harnessTemplates = [
      { src: 'AGENTS-PROJECT.md',                   dest: 'AGENTS.md',                            substitute: true },
      { src: 'harness-pipeline.md',                 dest: '.harness/pipeline.md',                 substitute: true },
      { src: 'harness-gates.json',                  dest: '.harness/gates.json' },
      { src: 'role-bindings-project.yaml',          dest: '.harness/role-bindings.yaml' },
      { src: 'harness-anchors-index.yaml',          dest: '.harness/anchors/index.yaml' },
      { src: 'harness-readme.md',                   dest: '.harness/README.md' },
      { src: 'docs-reference-readme.md',            dest: 'docs/reference/README.md' },
      { src: 'docs-reference-architecture-stub.md', dest: 'docs/reference/architecture.md',       substitute: true },
      { src: 'docs-reference-conventions-stub.md',  dest: 'docs/reference/conventions.md',        substitute: true },
      { src: 'docs-design-readme.md',               dest: 'docs/design/README.md' },
      { src: 'docs-plan-readme.md',                 dest: 'docs/plan/README.md' },
      { src: 'codeowners.template',                 dest: '.github/CODEOWNERS.template',          substitute: true },
    ];

    harnessTemplates.forEach(({ src, dest, substitute }) => {
      const srcPath = path.join(templatesDir, src);
      const destPath = path.join(cwd, dest);

      if (!fs.existsSync(srcPath)) {
        log(`  ⚠ ${dest} (template missing: ${src})`, 'yellow');
        return;
      }
      if (fs.existsSync(destPath)) {
        log(`  - ${dest} (already exists, skipping)`, 'yellow');
        return;
      }
      let content = fs.readFileSync(srcPath, 'utf8');
      if (substitute) {
        content = applySubstitutions(content, cwd);
      }
      fs.writeFileSync(destPath, content);
      log(`  ✓ ${dest}`, 'green');
    });

    // .gitkeep for empty Harness sub-directories
    ['docs/reference/capabilities/.gitkeep',
     'docs/design/system/.gitkeep',
     'docs/design/changes/.gitkeep'].forEach(p => {
      const full = path.join(cwd, p);
      if (!fs.existsSync(full)) {
        fs.writeFileSync(full, '');
        log(`  ✓ ${p}`, 'green');
      }
    });

    // CLAUDE.md → AGENTS.md symlink (Codex/Claude both follow it)
    const claudePath = path.join(cwd, 'CLAUDE.md');
    const agentsPath = path.join(cwd, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      let needsCreate = true;
      if (fs.existsSync(claudePath)) {
        const stat = fs.lstatSync(claudePath);
        if (stat.isSymbolicLink() && fs.readlinkSync(claudePath) === 'AGENTS.md') {
          log(`  - CLAUDE.md (already symlink → AGENTS.md)`, 'yellow');
          needsCreate = false;
        } else {
          fs.unlinkSync(claudePath);
        }
      }
      if (needsCreate) {
        fs.symlinkSync('AGENTS.md', claudePath);
        log(`  ✓ CLAUDE.md → AGENTS.md (symlink)`, 'green');
      }
    }
  }

  // Copy sync script
  const syncScriptSrc = path.join(templatesDir, 'sync-skills.sh');
  const syncScriptDest = path.join(cwd, 'scripts', 'sync-skills.sh');

  if (fs.existsSync(syncScriptSrc)) {
    fs.copyFileSync(syncScriptSrc, syncScriptDest);
    fs.chmodSync(syncScriptDest, '755');
    log('  ✓ scripts/sync-skills.sh', 'green');
  }

  // Create README indexes
  log('\n📋 Creating document indexes...', 'blue');

  const adrReadme = path.join(cwd, 'docs/adr/README.md');
  if (!fs.existsSync(adrReadme)) {
    fs.writeFileSync(adrReadme, `# Architecture Decision Records

## Current Decisions

| Number | Title | Date | Status |
|--------|-------|------|--------|
| - | No ADRs yet | - | - |

## How to Add ADR

Use \`/verification-before-completion\` skill after making architectural decisions.
`);
    log('  ✓ docs/adr/README.md', 'green');
  }

  const plansReadme = path.join(cwd, 'docs/plans/README.md');
  if (!fs.existsSync(plansReadme)) {
    fs.writeFileSync(plansReadme, `# Design Documents & Implementation Plans

## Recent Documents

| Date | Feature | Type | Status |
|------|---------|------|--------|
| - | No documents yet | - | - |

## How to Create

- Design: Use \`/brainstorming\` skill
- Implementation Plan: Use \`/writing-plans\` skill
`);
    log('  ✓ docs/plans/README.md', 'green');
  }

  // Handle CLAUDE.md (legacy flow — harness mode uses AGENTS.md + CLAUDE.md symlink, handled above)
  if (!harnessMode) {
    log('\n⚙️  Configuring CLAUDE.md...', 'blue');
    const claudeMd = path.join(cwd, 'CLAUDE.md');

    if (!fs.existsSync(claudeMd)) {
      // No CLAUDE.md exists - prompt user to run claude init first
      log('  ⚠️  CLAUDE.md not found', 'yellow');
      log('', 'reset');
      log('It looks like this project hasn\'t been initialized with Claude Code yet.', 'yellow');
      log('', 'reset');
      log('Please run this first:', 'blue');
      log('  claude init', 'green');
      log('', 'reset');
      log('Then run facio-superpowers init again.', 'blue');
      log('', 'reset');
      process.exit(1);
    }

    // CLAUDE.md exists - inject workflow instructions at the top
    let content = fs.readFileSync(claudeMd, 'utf8');

    // Check if workflow already injected
    if (content.includes('## Mandatory Development Workflow')) {
      log('  - CLAUDE.md already configured (workflow found)', 'yellow');
    } else {
      // Read workflow template
      const workflowTemplate = fs.readFileSync(
        path.join(templatesDir, 'CLAUDE-WORKFLOW.md'),
        'utf8'
      );

      // Inject at the top (after the first heading)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find the first heading
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
          insertIndex = i + 1;
          break;
        }
      }

      // Insert workflow after first heading
      lines.splice(insertIndex, 0, '', workflowTemplate, '');
      content = lines.join('\n');

      fs.writeFileSync(claudeMd, content);
      log('  ✓ Injected workflow instructions into CLAUDE.md', 'green');
    }
  }

  // Success message
  log('\n✅ Initialization complete!\n', 'green');

  if (!projectLevel) {
    log('📍 Skills installed globally to ~/.claude/skills', 'green');
    log('   Works with both Claude Code and Cursor across all projects.\n', 'reset');
  }

  log('Next steps:', 'blue');
  log('1. Edit CLAUDE.md to add project-specific information');
  log('2. Start using skills:');
  log('   - /flow (start tracked discussion with facio-flow)');
  log('   - /brainstorming (explore ideas before implementation)');
  log('   - /prepare-context (before development)');
  log('   - /verification-before-completion (after development)');
  log('\n📚 Documentation: https://github.com/vattention/facio-superpowers\n');
}

function sync(projectLevel = false) {
  log('\n🔄 Syncing skills from facio-superpowers\n', 'blue');

  ensureCache();

  const cwd = process.cwd();
  const skillsMode = projectLevel ? 'project' : 'global';
  const displaySkillsPath = projectLevel ? '.claude/skills' : '~/.claude/skills';

  log(`📍 Skills mode: ${skillsMode} (${displaySkillsPath})`, 'blue');

  // Sync skills
  log('\n📚 Updating skills...', 'blue');

  // Get all skills from cache
  const skillsDir = path.join(CACHE_DIR, 'skills');
  let skills = [];
  if (fs.existsSync(skillsDir)) {
    skills = fs.readdirSync(skillsDir).filter(f => {
      const skillPath = path.join(skillsDir, f);
      return fs.statSync(skillPath).isDirectory() &&
             fs.existsSync(path.join(skillPath, 'SKILL.md'));
    });
  }

  skills.forEach(skill => {
    const src = path.join(CACHE_DIR, 'skills', skill);

    if (projectLevel) {
      const claudeDest = path.join(cwd, '.claude/skills', skill);
      const cursorDest = path.join(cwd, '.cursor/skills', skill);

      if (fs.existsSync(claudeDest)) {
        fs.rmSync(claudeDest, { recursive: true });
      }
      copyRecursive(src, claudeDest);

      if (fs.existsSync(cursorDest)) {
        fs.rmSync(cursorDest, { recursive: true });
      }
      copyRecursive(src, cursorDest);
    } else {
      const globalDest = path.join(GLOBAL_SKILLS_DIR, skill);

      if (fs.existsSync(globalDest)) {
        fs.rmSync(globalDest, { recursive: true });
      }
      copyRecursive(src, globalDest);
    }

    log(`  ✓ ${skill}`, 'green');
  });

  log(`\n  Total: ${skills.length} skills synced`, 'green');

  // Codex symlink (ensure it's up to date)
  log('\n🔗 Checking Codex integration...', 'blue');
  setupCodexSymlink();

  // Sync templates
  log('\n📄 Updating templates...', 'blue');
  const templates = [
    { src: 'adr-template.md', dest: 'templates/adr-template.md' },
    { src: 'README-ROOT.md', dest: 'templates/README-ROOT.md' },
    { src: 'DOCUMENTATION-MAP.md', dest: 'templates/DOCUMENTATION-MAP.md' },
  ];

  templates.forEach(({ src, dest }) => {
    const srcPath = path.join(CACHE_DIR, 'templates', src);
    const destPath = path.join(cwd, dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      log(`  ✓ ${dest}`, 'green');
    }
  });

  log('\n✅ Sync complete!\n', 'green');
}

function setupCodexSymlink() {
  const skillsSrc = path.join(CACHE_DIR, 'skills');

  if (!fs.existsSync(CODEX_SKILLS_DIR)) {
    fs.mkdirSync(CODEX_SKILLS_DIR, { recursive: true });
  }

  try {
    const stat = fs.lstatSync(CODEX_SYMLINK);
    if (stat.isSymbolicLink()) {
      if (fs.readlinkSync(CODEX_SYMLINK) === skillsSrc) {
        log('  - ~/.agents/skills/superpowers (already linked)', 'yellow');
        return;
      }
      fs.unlinkSync(CODEX_SYMLINK);
    } else {
      fs.rmSync(CODEX_SYMLINK, { recursive: true });
    }
  } catch {
    // Path doesn't exist — proceed to create
  }

  fs.symlinkSync(skillsSrc, CODEX_SYMLINK);
  log('  ✓ ~/.agents/skills/superpowers → ~/.facio-superpowers/skills/', 'green');
}

function harnessLint() {
  log('\n🔍 Harness Lint\n', 'blue');

  const cwd = process.cwd();
  let failed = false;

  // 11 required files (per spec §2.2)
  const requiredFiles = [
    'AGENTS.md',
    '.harness/pipeline.md',
    '.harness/gates.json',
    '.harness/role-bindings.yaml',
    '.harness/anchors/index.yaml',
    '.harness/README.md',
    'docs/reference/README.md',
    'docs/reference/architecture.md',
    'docs/reference/conventions.md',
    'docs/design/README.md',
    'docs/plan/README.md',
  ];

  requiredFiles.forEach(f => {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      log(`  ✓ ${f}`, 'green');
    } else {
      log(`  ✗ Missing: ${f}`, 'red');
      failed = true;
    }
  });

  // AGENTS.md must contain @import directives
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const content = fs.readFileSync(agentsPath, 'utf8');
    if (content.includes('@import')) {
      log(`  ✓ AGENTS.md contains @import directives`, 'green');
    } else {
      log(`  ✗ AGENTS.md missing @import directives`, 'red');
      failed = true;
    }
  }

  // CLAUDE.md must be a symlink to AGENTS.md
  const claudePath = path.join(cwd, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(claudePath);
      if (target === 'AGENTS.md') {
        log(`  ✓ CLAUDE.md → AGENTS.md (symlink)`, 'green');
      } else {
        log(`  ✗ CLAUDE.md symlink points to ${target}, expected AGENTS.md`, 'red');
        failed = true;
      }
    } else {
      log(`  ✗ CLAUDE.md exists but is not a symlink to AGENTS.md`, 'red');
      failed = true;
    }
  } else {
    log(`  ✗ Missing: CLAUDE.md (should be symlink → AGENTS.md)`, 'red');
    failed = true;
  }

  if (failed) {
    log('\n❌ Harness lint failed\n', 'red');
    process.exit(1);
  }
  log('\n✅ Harness lint passed\n', 'green');
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];
const projectLevel = args.includes('--project');
const harnessMode = args.includes('--harness');

switch (command) {
  case 'init':
    init(projectLevel, harnessMode);
    break;
  case 'sync':
    sync(projectLevel);
    break;
  case 'harness-lint':
    harnessLint();
    break;
  default:
    log('\nFacio Superpowers CLI\n', 'green');
    log('Usage:');
    log('  npx facio-superpowers init                          Install skills globally (~/.claude/skills)');
    log('  npx facio-superpowers init --project                Install skills to project (.claude/skills)');
    log('  npx facio-superpowers init --project --harness      Scaffold Harness Engineering layout (AGENTS.md / .harness/ / docs/{reference,design,plan}/)');
    log('  npx facio-superpowers sync                          Sync global skills to latest version');
    log('  npx facio-superpowers sync --project                Sync project skills to latest version');
    log('  npx facio-superpowers harness-lint                  Verify Harness file layout in current project');
    log('\nGlobal skills are shared across all projects (recommended).');
    log('Project skills are specific to the current project.');
    log('Harness mode adds AGENTS.md hierarchy + .harness/ configs + three-tier docs/.\n');
    break;
}
