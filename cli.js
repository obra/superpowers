#!/usr/bin/env node

/**
 * Facio Superpowers CLI
 * Initialize documentation management for AI-assisted development
 *
 * Usage:
 *   npx facio-superpowers init [--no-harness] [--project]
 *   npx facio-superpowers sync [--project]
 *   npx facio-superpowers harness-lint
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

// Harness mode safe merge: before installing Harness templates, detect existing
// AGENTS.md / CLAUDE.md that would otherwise be silently skipped (AGENTS.md stub
// case) or destructively replaced (CLAUDE.md regular file → symlink).
//
// Strategy:
//   - AGENTS.md with `@import` → already Harness-compliant, leave alone.
//   - AGENTS.md without `@import` → back up to AGENTS.md.bak.<ts>, capture content.
//   - CLAUDE.md symlink → AGENTS.md → leave alone.
//   - CLAUDE.md symlink → other → unlink (will be recreated).
//   - CLAUDE.md regular file, non-empty → back up to CLAUDE.md.bak.<ts>, capture content.
//   - CLAUDE.md regular file, empty → unlink.
//
// Returns { sections, backups } where `sections` is captured content to be
// appended to the new AGENTS.md as a "项目级既有约束" section by the caller.
function harnessSafeMerge(cwd) {
  const ts = Math.floor(Date.now() / 1000);
  const backups = [];
  const sections = [];

  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const stat = fs.lstatSync(agentsPath);
    if (!stat.isSymbolicLink()) {
      const content = fs.readFileSync(agentsPath, 'utf8');
      if (!content.includes('@import')) {
        const bakName = `AGENTS.md.bak.${ts}`;
        fs.renameSync(agentsPath, path.join(cwd, bakName));
        backups.push({ from: 'AGENTS.md', to: bakName });
        sections.push({ source: 'AGENTS.md', content });
      }
    }
  }

  const claudePath = path.join(cwd, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      if (fs.readlinkSync(claudePath) !== 'AGENTS.md') {
        fs.unlinkSync(claudePath);
      }
    } else {
      const content = fs.readFileSync(claudePath, 'utf8');
      if (content.trim()) {
        const bakName = `CLAUDE.md.bak.${ts}`;
        fs.renameSync(claudePath, path.join(cwd, bakName));
        backups.push({ from: 'CLAUDE.md', to: bakName });
        sections.push({ source: 'CLAUDE.md', content });
      } else {
        fs.unlinkSync(claudePath);
      }
    }
  }

  return { sections, backups };
}

function buildPreservedSection(sections, backups) {
  if (sections.length === 0) return null;
  const bakList = backups.map(b => `\`${b.to}\``).join(', ');
  let out = '\n---\n\n## 项目级既有约束（合并自 init 前的 AGENTS.md / CLAUDE.md）\n\n';
  out += `> 由 \`facio-superpowers init --harness\` 自动合并。Harness 骨架通过 \`@import\` 先打底，本节由 closest-wins 后置覆盖（later-overrides-earlier）。\n`;
  out += `> 原始备份：${bakList}\n\n`;
  for (const { source, content } of sections) {
    out += `### 来自原 ${source}\n\n`;
    out += content.trim() + '\n\n';
  }
  return out;
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
      '.github/workflows',
      'docs/reference',
      'docs/reference/capabilities',
      'docs/reference/decisions',
      'docs/reference/guidelines',
      'docs/reference/pitfalls',
      'docs/design',
      'docs/design/system',
      'docs/design/changes',
      'docs/superpowers/specs',
      'docs/superpowers/plans',
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
    // Safe-merge pass: back up + capture existing AGENTS.md / CLAUDE.md content
    // before the template install loop, so prior project rules (OpenSpec stubs,
    // workflow reminders, etc.) aren't silently dropped.
    log('\n🔄 Checking existing AGENTS.md / CLAUDE.md...', 'blue');
    const { sections: preservedSections, backups: preservedBackups } = harnessSafeMerge(cwd);
    if (preservedBackups.length > 0) {
      preservedBackups.forEach(b => log(`  ↳ Backed up: ${b.from} → ${b.to}`, 'yellow'));
    } else {
      log(`  - nothing to preserve (clean slate or already Harness-compliant)`, 'yellow');
    }

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
      { src: 'codeowners.template',                 dest: '.github/CODEOWNERS.template',          substitute: true },
      { src: 'docs-reference-decisions-readme.md',  dest: 'docs/reference/decisions/README.md' },
      { src: 'docs-reference-guidelines-readme.md', dest: 'docs/reference/guidelines/README.md' },
      { src: 'docs-reference-pitfalls-readme.md',   dest: 'docs/reference/pitfalls/README.md' },
      { src: 'docs-reference-catalog-stub.md',      dest: 'docs/reference/catalog.md' },
      { src: 'github-workflows-catalog-sync.yml',   dest: '.github/workflows/catalog-sync.yml' },
      { src: 'github-workflows-spec-sync.yml',      dest: '.github/workflows/spec-sync.yml' },
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
     'docs/reference/decisions/.gitkeep',
     'docs/reference/guidelines/.gitkeep',
     'docs/reference/pitfalls/.gitkeep',
     'docs/design/system/.gitkeep',
     'docs/design/changes/.gitkeep',
     'docs/superpowers/specs/.gitkeep',
     'docs/superpowers/plans/.gitkeep'].forEach(p => {
      const full = path.join(cwd, p);
      if (!fs.existsSync(full)) {
        fs.writeFileSync(full, '');
        log(`  ✓ ${p}`, 'green');
      }
    });

    // Append captured prior content (if any) to the freshly-installed AGENTS.md
    // before creating the symlink. Skipped when AGENTS.md was already
    // Harness-compliant (harnessSafeMerge left it untouched).
    const agentsPath = path.join(cwd, 'AGENTS.md');
    const preservedSection = buildPreservedSection(preservedSections, preservedBackups);
    if (preservedSection && fs.existsSync(agentsPath)) {
      fs.appendFileSync(agentsPath, preservedSection);
      log(`  ✓ Appended preserved project rules to AGENTS.md`, 'green');
    }

    // CLAUDE.md → AGENTS.md symlink (Codex/Claude both follow it).
    // harnessSafeMerge has already handled any conflicting regular file or
    // wrong-target symlink, so by this point CLAUDE.md either does not exist
    // or is already the correct symlink.
    const claudePath = path.join(cwd, 'CLAUDE.md');
    if (fs.existsSync(agentsPath)) {
      if (fs.existsSync(claudePath)) {
        log(`  - CLAUDE.md (already symlink → AGENTS.md)`, 'yellow');
      } else {
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

  // Copy rebuild-catalog script (M0+; for catalog-sync CI workflow)
  if (harnessMode) {
    const rebuildCatalogSrc = path.join(templatesDir, 'rebuild-catalog.sh');
    const rebuildCatalogDest = path.join(cwd, 'scripts', 'rebuild-catalog.sh');
    if (fs.existsSync(rebuildCatalogSrc)) {
      fs.copyFileSync(rebuildCatalogSrc, rebuildCatalogDest);
      fs.chmodSync(rebuildCatalogDest, '755');
      log('  ✓ scripts/rebuild-catalog.sh', 'green');
    }
  }

  // Copy spec-status script (M0+; superpowers util for spec.md status
  // frontmatter transitions; consumed by spec-ratifier Step 5)
  if (harnessMode) {
    const specStatusSrc = path.join(templatesDir, 'spec-status.mjs');
    const specStatusDest = path.join(cwd, 'scripts', 'spec-status.mjs');
    if (fs.existsSync(specStatusSrc)) {
      fs.copyFileSync(specStatusSrc, specStatusDest);
      fs.chmodSync(specStatusDest, '755');
      log('  ✓ scripts/spec-status.mjs', 'green');
    }
  }

  // Copy generate-spec-html script (M1+; spec-author Step 14 / spec-ratifier
  // regenerate; produces L2 dual-artifact spec.html. Mermaid pre-rendered via
  // build-time mmdc; output has zero runtime deps.)
  if (harnessMode) {
    const genSpecHtmlSrc = path.join(templatesDir, 'scripts-generate-spec-html.mjs');
    const genSpecHtmlDest = path.join(cwd, 'scripts', 'generate-spec-html.mjs');
    if (fs.existsSync(genSpecHtmlSrc)) {
      fs.copyFileSync(genSpecHtmlSrc, genSpecHtmlDest);
      fs.chmodSync(genSpecHtmlDest, '755');
      log('  ✓ scripts/generate-spec-html.mjs', 'green');
    }
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

  // 12 required files (per spec §2.2; docs/plan/ dropped in v1.3.1;
  // docs/superpowers/{specs,plans} .gitkeep added in v1.3.2)
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
    'docs/superpowers/specs/.gitkeep',
    'docs/superpowers/plans/.gitkeep',
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

  // AGENTS.md must contain @import directives AND Superpowers workflow reminders.
  // Missing @import → caller likely has a foreign-tool stub (e.g. openspec init);
  // missing reminders → AGENTS.md predates v1.3.3 template.
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const content = fs.readFileSync(agentsPath, 'utf8');
    if (content.includes('@import')) {
      log(`  ✓ AGENTS.md contains @import directives`, 'green');
    } else {
      log(`  ✗ AGENTS.md missing @import directives`, 'red');
      log(`     ↳ AGENTS.md looks like a foreign-tool stub (e.g. openspec). Re-run`, 'red');
      log(`       \`facio-superpowers init --project --harness\` — v1.3.3+ safely`, 'red');
      log(`       backs up and merges the existing content.`, 'red');
      failed = true;
    }
    const hasPrepare = content.includes('/prepare-context');
    const hasVerify = content.includes('/verification-before-completion');
    if (hasPrepare && hasVerify) {
      log(`  ✓ AGENTS.md contains Superpowers workflow reminders`, 'green');
    } else {
      log(`  ✗ AGENTS.md missing Superpowers workflow reminders (/prepare-context, /verification-before-completion)`, 'red');
      log(`     ↳ AGENTS.md predates the v1.3.3 template. Re-run init --harness or`, 'red');
      log(`       merge §9 from templates/AGENTS-PROJECT.md.`, 'red');
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

// Expose internals for unit tests (no side-effects on require()).
module.exports = { harnessSafeMerge, buildPreservedSection };

// CLI dispatch only runs when the script is invoked directly, not on require().
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const projectLevel = args.includes('--project');
  const noHarness = args.includes('--no-harness');

  // --harness is deprecated in v2.0.0 (Harness is now the default).
  // Detect it only to emit a warning; behavior is unaffected.
  const hasLegacyHarnessFlag = args.includes('--harness');
  if (hasLegacyHarnessFlag) {
    log('⚠️  --harness flag is deprecated (Harness is now the default).', 'yellow');
    log('   Drop the flag for the same behavior. See RELEASE-NOTES.md v2.0.0.', 'yellow');
  }

  // Real intent: Harness on unless explicitly opted out.
  const harnessMode = !noHarness;

  // Warn on --project (regardless of harness): copies skills locally — usually wrong.
  if (command === 'init' && projectLevel) {
    log('⚠️  --project copies 19 skills × 2 IDEs (38 directories) into this repo.', 'yellow');
    log('   This is rarely what you want. Industry standard is global skills.', 'yellow');
    log('   See: https://code.claude.com/docs/en/skills', 'yellow');
    log('   Recommended: drop --project (skills install globally to ~/.claude/skills/).', 'yellow');
  }

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
      log('  npx facio-superpowers init                          [DEFAULT] Install skills globally + scaffold Harness layout');
      log('  npx facio-superpowers init --no-harness             Install skills globally only (no Harness scaffold, advanced)');
      log('  npx facio-superpowers init --project                Install skills to project + Harness scaffold (rare)');
      log('  npx facio-superpowers sync                          Sync global skills to latest');
      log('  npx facio-superpowers sync --project                Sync project skills (only if --project was used at init)');
      log('  npx facio-superpowers harness-lint                  Verify Harness file layout in cwd');
      log('\nDeprecated:');
      log('  --harness                                            v1.x flag; now default. Drop the flag.\n');
      break;
  }
}
