import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
