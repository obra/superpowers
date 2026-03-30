import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, readUtf8 } from './helpers/markdown-test-helpers.mjs';

const MEMORY_DIR = path.join(REPO_ROOT, 'docs/project_notes');
const PROJECT_MEMORY_SKILL_DIR = path.join(REPO_ROOT, 'skills/project-memory');
const REQUIRED_FILES = [
  'README.md',
  'bugs.md',
  'decisions.md',
  'key_facts.md',
  'issues.md',
];

function memoryPath(name) {
  return path.join(MEMORY_DIR, name);
}

function readMemory(name) {
  return readUtf8(memoryPath(name));
}

function readProjectMemorySkillFile(name) {
  return readUtf8(path.join(PROJECT_MEMORY_SKILL_DIR, name));
}

function readExamples() {
  return readProjectMemorySkillFile('examples.md');
}

function examplesSection(name) {
  const content = readExamples();
  const heading = `## \`${name}\``;
  const start = content.indexOf(heading);
  assert.notEqual(start, -1, `examples.md should include a ${name} section`);
  const nextSection = content.indexOf('\n## `', start + heading.length);
  return content.slice(start, nextSection === -1 ? undefined : nextSection).trim();
}

function bulletEntries(name) {
  return readMemory(name)
    .replace(/^# .*\n+/, '')
    .split(/\n(?=- )/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const APPROVED_ARTIFACT_SOURCE_REFERENCE =
  /^(?:docs\/featureforge\/specs\/.+\.md|docs\/featureforge\/plans\/.+\.md|docs\/featureforge\/execution-evidence\/.+\.md|\.featureforge\/reviews\/.+\.md)$/;
const STABLE_REPO_DOC_SOURCE_REFERENCE =
  /^(?:(?:README|AGENTS|TODOS)\.md|docs\/(?!featureforge\/|project_notes\/|archive\/).+\.md|review\/.+\.md|skills\/.+\.md)$/;

function sourceReferences(entry, name) {
  const sourceLine = entry.match(/\n\s*Source:\s*([^\n]+)/);
  assert.ok(sourceLine, `${name} entries should include a Source line`);
  const references = [...sourceLine[1].matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  assert.notEqual(references.length, 0, `${name} entries should include at least one backticked source reference`);
  return references;
}

function isAllowedSeedSourceReference(name, reference) {
  return (
    APPROVED_ARTIFACT_SOURCE_REFERENCE.test(reference)
    || STABLE_REPO_DOC_SOURCE_REFERENCE.test(reference)
  );
}

function resolveRepoSourceReference(reference) {
  assert.doesNotMatch(
    reference,
    /^(?:\.\/|\.\.\/)/,
    `source references should be repo-relative, not file-relative: ${reference}`,
  );
  return path.join(REPO_ROOT, reference);
}

function assertApprovedSeedSources(name, entry) {
  for (const reference of sourceReferences(entry, name)) {
    assert.equal(
      isAllowedSeedSourceReference(name, reference),
      true,
      `${name} should cite approved artifacts or stable repo docs: ${reference}`,
    );
    assert.doesNotMatch(
      reference,
      /^(?:target|node_modules)\//,
      `${name} should not cite generated or vendored paths: ${reference}`,
    );
    assert.equal(
      fs.existsSync(resolveRepoSourceReference(reference)),
      true,
      `${name} should cite an existing repo path: ${reference}`,
    );
  }
}

test('seed provenance contract allows documented stable-source variants without widening to junk paths', () => {
  const reviewArtifact = '.featureforge/reviews/example-review.md';
  assert.equal(isAllowedSeedSourceReference('bugs.md', 'README.md'), true);
  assert.equal(isAllowedSeedSourceReference('bugs.md', reviewArtifact), true);
  assert.throws(() => resolveRepoSourceReference('./README.md'), /repo-relative/);
  assert.equal(isAllowedSeedSourceReference('key_facts.md', 'src/main.rs'), false);
  assert.equal(isAllowedSeedSourceReference('bugs.md', 'src/main.rs'), false);
  assert.equal(isAllowedSeedSourceReference('key_facts.md', 'node_modules/pkg/index.js'), false);
  assert.equal(fs.existsSync(resolveRepoSourceReference('README.md')), true);
  assert.equal(isAllowedSeedSourceReference('bugs.md', 'docs/project_notes/issues.md'), false);
  assert.equal(isAllowedSeedSourceReference('bugs.md', 'docs/archive/old-note.md'), false);
});

test('project-memory reference templates stay aligned with enforced entry shapes', () => {
  const decisionsTemplate = readProjectMemorySkillFile('references/decisions_template.md');
  assert.match(decisionsTemplate, /Context:/, 'decisions template should include Context');
  assert.match(decisionsTemplate, /Decision:/, 'decisions template should include Decision');
  assert.match(decisionsTemplate, /Alternatives considered:/, 'decisions template should include Alternatives considered');
  assert.match(decisionsTemplate, /Consequence:/, 'decisions template should include Consequence');
  assert.match(decisionsTemplate, /Source:/, 'decisions template should include Source');
});

test('project memory corpus includes the required repo-visible files', () => {
  assert.equal(fs.existsSync(MEMORY_DIR), true, 'docs/project_notes should exist');

  for (const name of REQUIRED_FILES) {
    assert.equal(fs.existsSync(memoryPath(name)), true, `${name} should exist`);
  }
});

test('project memory README teaches the boundary and maintenance rubric', () => {
  const content = readMemory('README.md');

  assert.match(content, /supportive (?:project )?memory/i, 'README should describe project memory as supportive');
  assert.match(content, /not authoritative|supportive context only/i, 'README should reject authority drift');
  assert.match(content, /approved specs?, approved plans?, execution evidence, review artifacts?, and runtime state/i, 'README should name the higher-authority workflow surfaces');
  assert.match(content, /if project memory conflicts/i, 'README should describe the conflict-resolution rule');
  assert.match(content, /bugs\.md/i, 'README should mention bugs.md');
  assert.match(content, /decisions\.md/i, 'README should mention decisions.md');
  assert.match(content, /key_facts\.md/i, 'README should mention key_facts.md');
  assert.match(content, /issues\.md/i, 'README should mention issues.md');
  assert.match(content, /recurring-only/i, 'README should describe recurring-only bug retention');
  assert.match(content, /breadcrumb/i, 'README should describe breadcrumb-only issue retention');
  assert.match(content, /Last Verified/i, 'README should describe Last Verified refresh guidance');
  assert.match(content, /supersede|annotate/i, 'README should describe conservative decision retention');
  assert.match(content, /AGENTS\.md.*remain authoritative|repo instructions.*remain authoritative/i, 'README should keep repo instructions above project memory');
  assert.match(content, /never store credentials, secrets, or secret-shaped values/i, 'README should state the no-secrets rule');
});

test('seeded project memory entries carry inspectable provenance', () => {
  for (const entry of bulletEntries('bugs.md')) {
    assert.match(entry, /\n\s*Source:/, 'each bugs.md entry should include a Source marker');
    assertApprovedSeedSources('bugs.md', entry);
  }

  for (const entry of bulletEntries('decisions.md')) {
    assert.match(entry, /\n\s*Context:/, 'each decisions.md entry should include Context');
    assert.match(entry, /\n\s*Decision:/, 'each decisions.md entry should include Decision');
    assert.match(entry, /\n\s*Alternatives considered:/, 'each decisions.md entry should include Alternatives considered');
    assert.match(entry, /\n\s*Consequence:/, 'each decisions.md entry should include Consequence');
    assert.match(entry, /\n\s*Source:/, 'each decisions.md entry should include Source');
    assertApprovedSeedSources('decisions.md', entry);
  }

  for (const entry of bulletEntries('issues.md')) {
    assert.match(entry, /\n\s*Source:/, 'each issues.md entry should include a Source marker');
    assertApprovedSeedSources('issues.md', entry);
  }

  for (const entry of bulletEntries('key_facts.md')) {
    assert.match(entry, /\n\s*Last Verified:/, 'each key_facts.md entry should include Last Verified');
    assert.match(entry, /\n\s*Source:/, 'each key_facts.md entry should include Source');
    assertApprovedSeedSources('key_facts.md', entry);
  }
});

test('project memory avoids tracker drift, authority drift, and obvious secret-like content', () => {
  const combined = REQUIRED_FILES.map(readMemory).join('\n');
  const issues = readMemory('issues.md');

  assert.doesNotMatch(issues, /(?:^|\n)\s*(?:[-*]\s*)?(?:In Progress|Blocked|Completed|Open|Todo|Done|Pending|Waiting|Review|Doing|Backlog|Paused|WIP)\b|(?:^|\n)\s*(?:[-*]\s*)?Status:\s*\w+|^\s*-\s*\[[ xX]\]/im, 'issues.md should stay breadcrumb-only');
  assert.doesNotMatch(issues, /(?:^|\n)\s*(?:[-*]\s*)?(?:started|resumed|finished|completed)\s+step(?:\s+\d+)?\b/im, 'issues.md should not become a second execution log');
  assert.doesNotMatch(issues, /\bAttempt\s+\d+\b|\bRecorded At:\b|\bTask Number:\b|\bStep Number:\b/i, 'issues.md should not include execution-log metadata markers');
  assert.doesNotMatch(issues, /\bexecution log\b|\bday-by-day\b|\bdaily progress\b/i, 'issues.md should not become a day-by-day progress log');
  assert.doesNotMatch(combined, /ignore the approved plan|this file is authoritative|route through this file instead|follow the notes in this file instead|always do .* first|(?:check|consult|read) this file .* first|use this file to decide/i, 'project memory should not contain instruction-authority drift');
  assert.doesNotMatch(combined, /\btoken\b|api key|private key|password|\bgh[pousr]_[A-Za-z0-9]{10,}\b|\bbearer\s+[A-Za-z0-9._-]+\b|client[_ -]?secret/i, 'project memory should not contain obvious secret-like content');
});

test('project-memory examples cover the positive and negative matrix for all memory files', () => {
  const bugs = examplesSection('bugs.md');
  assert.match(bugs, /### Good/, 'bugs.md examples should include a good example');
  assert.match(bugs, /### Bad: `OversizedDuplication`/, 'bugs.md examples should include OversizedDuplication');
  assert.match(bugs, /### Bad: `MissingProvenance`/, 'bugs.md examples should include MissingProvenance');

  const decisions = examplesSection('decisions.md');
  assert.match(decisions, /### Good/, 'decisions.md examples should include a good example');
  assert.match(decisions, /\n\s*Context:/, 'decisions.md good example should include Context');
  assert.match(decisions, /\n\s*Decision:/, 'decisions.md good example should include Decision');
  assert.match(decisions, /\n\s*Alternatives considered:/, 'decisions.md good example should include Alternatives considered');
  assert.match(decisions, /\n\s*Consequence:/, 'decisions.md good example should include Consequence');
  assert.match(decisions, /### Bad: `AuthorityConflict`/, 'decisions.md examples should include AuthorityConflict');
  assert.match(decisions, /### Bad: `InstructionAuthorityDrift`/, 'decisions.md examples should include InstructionAuthorityDrift');

  const keyFacts = examplesSection('key_facts.md');
  assert.match(keyFacts, /### Good/, 'key_facts.md examples should include a good example');
  assert.match(keyFacts, /### Bad: `SecretLikeContent`/, 'key_facts.md examples should include SecretLikeContent');
  assert.match(keyFacts, /### Bad: `MissingProvenance`/, 'key_facts.md examples should include MissingProvenance');

  const issues = examplesSection('issues.md');
  assert.match(issues, /### Good/, 'issues.md examples should include a good example');
  assert.match(issues, /### Bad: `TrackerDrift`/, 'issues.md examples should include TrackerDrift');
  assert.match(issues, /### Bad: `InstructionAuthorityDrift`/, 'issues.md examples should include InstructionAuthorityDrift');

  const examples = readExamples();
  assert.match(examples, /## Worked Distillation Example/, 'examples.md should include the distillation example');
  assert.match(examples, /### Good Memory Entry/, 'examples.md should include a worked good memory entry');
  assert.match(examples, /Source:\s*`docs\/featureforge\/plans\/2026-03-29-featureforge-project-memory-integration\.md`,\s*`docs\/featureforge\/execution-evidence\/2026-03-29-featureforge-project-memory-integration-r4-evidence\.md`/, 'worked distillation example should backlink the approved plan and execution evidence on one Source line');
  assert.match(examples, /`docs\/featureforge\/execution-evidence\/2026-03-29-featureforge-project-memory-integration-r4-evidence\.md`/, 'worked distillation example should backlink execution evidence');
});
