import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  REPO_ROOT,
  SKILLS_DIR,
  listGeneratedSkills,
  readUtf8,
  parseFrontmatter,
  getGeneratedHeader,
  findUnresolvedPlaceholders,
  countOccurrences,
} from './helpers/markdown-test-helpers.mjs';

test('every generated skill has a template and SKILL.md artifact', () => {
  const skills = listGeneratedSkills();
  assert.ok(skills.length > 0);

  for (const skill of skills) {
    const skillDir = path.join(SKILLS_DIR, skill);
    assert.equal(fs.existsSync(path.join(skillDir, 'SKILL.md.tmpl')), true, `${skill} should have a template`);
    assert.equal(fs.existsSync(path.join(skillDir, 'SKILL.md')), true, `${skill} should have a generated SKILL.md`);
    assert.equal(true, readUtf8(path.join(skillDir, 'SKILL.md')).length > 0);
  }
});

test('every generated SKILL.md preserves expected frontmatter semantics', () => {
  for (const skill of listGeneratedSkills()) {
    const generatedFrontmatter = parseFrontmatter(readUtf8(path.join(SKILLS_DIR, skill, 'SKILL.md')));
    const templateFrontmatter = parseFrontmatter(readUtf8(path.join(SKILLS_DIR, skill, 'SKILL.md.tmpl')));
    assert.ok(generatedFrontmatter, `${skill} should have YAML frontmatter`);
    assert.ok(templateFrontmatter, `${skill} template should have YAML frontmatter`);
    assert.equal(generatedFrontmatter.name, skill, `${skill} should declare a frontmatter name that matches its directory`);
    assert.equal(generatedFrontmatter.name, templateFrontmatter.name, `${skill} should preserve the template frontmatter name`);
    assert.equal(generatedFrontmatter.description, templateFrontmatter.description, `${skill} should preserve the template frontmatter description`);
  }
});

test('every generated SKILL.md has exactly one generated header and regenerate command', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(path.join(SKILLS_DIR, skill, 'SKILL.md'));
    assert.ok(getGeneratedHeader(content), `${skill} should include the generated header`);
    assert.equal(
      countOccurrences(content, '<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->'),
      1,
      `${skill} should include the generated header exactly once`,
    );
  }
});

test('no generated SKILL.md contains unresolved placeholders', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(path.join(SKILLS_DIR, skill, 'SKILL.md'));
    assert.deepEqual(findUnresolvedPlaceholders(content), [], `${skill} should not contain unresolved placeholders`);
  }
});

test('gen-skill-docs --check exits successfully', () => {
  const result = spawnSync('node', ['scripts/gen-skill-docs.mjs', '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Generated skill docs are up to date\./);
});

test('gen-skill-docs --check fails on stale generated artifacts', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'featureforge-skill-docs-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'scripts'), { recursive: true });
    fs.copyFileSync(
      path.join(REPO_ROOT, 'scripts/gen-skill-docs.mjs'),
      path.join(tempRoot, 'scripts/gen-skill-docs.mjs'),
    );
    fs.cpSync(path.join(REPO_ROOT, 'skills'), path.join(tempRoot, 'skills'), { recursive: true });

    fs.appendFileSync(path.join(tempRoot, 'skills/brainstorming/SKILL.md'), '\n<!-- stale generated artifact -->\n');

    const result = spawnSync('node', ['scripts/gen-skill-docs.mjs', '--check'], {
      cwd: tempRoot,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0, 'stale generated docs should fail the freshness check');
    assert.match(result.stdout + result.stderr, /Generated skill docs are stale:/);
    assert.match(result.stdout + result.stderr, /skills\/brainstorming\/SKILL\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('upgrade instructions use the runtime-root helper instead of embedded root-search order', () => {
  const upgradeSkill = readUtf8(path.join(REPO_ROOT, 'featureforge-upgrade', 'SKILL.md'));
  const installRuntimeExecPattern = /(?:^|\n)\s*(?:if|while|until)?\s*!?\s*"\$INSTALL_RUNTIME_BIN"\s|\$\("\$INSTALL_RUNTIME_BIN"\s/;

  // Intentional invariant: the packaged install binary remains the only runtime
  // command path in shipped skill docs. INSTALL_DIR is for locating companion
  // files from the selected install, not for selecting a new executable. Do
  // not weaken these assertions unless product direction explicitly changes.
  assert.match(upgradeSkill, /repo runtime-root --path/);
  assert.match(upgradeSkill, /repo runtime-root --field upgrade-eligible/);
  assert.match(upgradeSkill, /_FEATUREFORGE_INSTALL_ROOT="\$HOME\/\.featureforge\/install"/);
  assert.match(upgradeSkill, /FEATUREFORGE_RUNTIME_BIN/);
  assert.match(upgradeSkill, /featureforge\.exe/);
  assert.match(upgradeSkill, /_FEATUREFORGE_ROOT/);
  assert.match(upgradeSkill, /\$_FEATUREFORGE_INSTALL_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*"\$_FEATUREFORGE_ROOT\/bin\/featureforge"/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*"\$INSTALL_DIR\/bin\/featureforge"/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*"\$_FEATUREFORGE_ROOT\/bin\/featureforge\.exe"/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*"\$INSTALL_DIR\/bin\/featureforge\.exe"/);
  assert.doesNotMatch(upgradeSkill, /FEATUREFORGE_BIN="\$INSTALL_DIR\/bin\/featureforge"/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$INSTALL_DIR\/bin\/featureforge"/);
  assert.doesNotMatch(upgradeSkill, /(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$INSTALL_DIR\/bin\/featureforge\.exe"/);
  assert.doesNotMatch(upgradeSkill, installRuntimeExecPattern);
  assert.doesNotMatch(upgradeSkill, /FEATUREFORGE_RUNTIME_BIN="\$INSTALL_RUNTIME_BIN"/);
  assert.doesNotMatch(upgradeSkill, /\$\{_FEATUREFORGE_BIN:-featureforge\}/);
  assert.doesNotMatch(upgradeSkill, /command -v featureforge/);
  assert.doesNotMatch(upgradeSkill, /sed -n 's\/\.\*"root"/);
  assert.doesNotMatch(upgradeSkill, /\.codex\/featureforge/);
  assert.doesNotMatch(upgradeSkill, /\.copilot\/featureforge/);
});

test('active public and generated surfaces do not advertise retired legacy install roots', () => {
  const legacyRootPattern = /\.(codex|copilot)\/featureforge\b/;
  const surfacePaths = [
    'scripts/gen-skill-docs.mjs',
    'featureforge-upgrade/SKILL.md',
    'README.md',
    'docs/README.codex.md',
    'docs/README.copilot.md',
    '.codex/INSTALL.md',
    '.copilot/INSTALL.md',
  ];

  for (const relativePath of surfacePaths) {
    assert.doesNotMatch(
      readUtf8(path.join(REPO_ROOT, relativePath)),
      legacyRootPattern,
      `${relativePath} should not mention retired legacy install roots`,
    );
  }

  for (const skill of listGeneratedSkills()) {
    assert.doesNotMatch(
      readUtf8(path.join(SKILLS_DIR, skill, 'SKILL.md')),
      legacyRootPattern,
      `${skill} generated skill doc should not mention retired legacy install roots`,
    );
  }
});

test('workflow-status ambiguity snapshot stays checked in and is covered by workflow_runtime', () => {
  const workflowRuntime = readUtf8(path.join(REPO_ROOT, 'tests/workflow_runtime.rs'));
  const fixture = JSON.parse(readUtf8(path.join(REPO_ROOT, 'tests/fixtures/differential/workflow-status.json')));

  assert.match(workflowRuntime, /canonical_workflow_status_ambiguous_specs_matches_checked_in_snapshot/);
  assert.match(workflowRuntime, /tests\/fixtures\/differential\/workflow-status\.json/);
  assert.match(workflowRuntime, /"workflow", "status", "--refresh"/);
  assert.doesNotMatch(workflowRuntime, /run_legacy_vs_rust/);

  assert.equal(typeof fixture.status, 'string');
  assert.equal(Array.isArray(fixture.reason_codes), true);
  assert.equal(fixture.reason_codes.includes('ambiguous_spec_candidates'), true);
});
