import test from 'node:test';
import assert from 'node:assert/strict';
import {
  insertGeneratedHeader,
  renderTemplateContent,
  buildRootDetection,
  buildBaseShellLines,
  buildReviewShellLines,
  generatePreamble,
  buildUsingSuperpowersShellLines,
  buildUsingSuperpowersBypassGateSection,
  buildUsingSuperpowersNormalStackSection,
} from '../../scripts/gen-skill-docs.mjs';

test('insertGeneratedHeader inserts the generated header after YAML frontmatter', () => {
  const input = ['---', 'name: test', 'description: desc', '---', '', '# Body'].join('\n');
  const output = insertGeneratedHeader(input);

  assert.match(output, /^---\nname: test\ndescription: desc\n---\n<!-- AUTO-GENERATED from SKILL\.md\.tmpl — do not edit directly -->/);
});

test('insertGeneratedHeader throws when YAML frontmatter is unterminated', () => {
  assert.throws(
    () => insertGeneratedHeader(['---', 'name: test', 'description: desc', '# Body'].join('\n')),
    /Failed to locate closing frontmatter delimiter/,
  );
});

test('renderTemplateContent throws on unknown placeholders', () => {
  assert.throws(
    () => renderTemplateContent('{{MISSING_PLACEHOLDER}}\n', '/tmp/skill.md.tmpl'),
    /Unknown placeholder \{\{MISSING_PLACEHOLDER\}\}/,
  );
});

test('renderTemplateContent throws when resolver output leaves unresolved placeholders behind', () => {
  assert.throws(
    () => renderTemplateContent('{{BASE_PREAMBLE}}\n', '/tmp/skill.md.tmpl', {
      BASE_PREAMBLE: () => '{{LEFTOVER}}',
    }),
    /Unresolved placeholder remains/,
  );
});

test('renderTemplateContent always ends generated files with a trailing newline', () => {
  const output = renderTemplateContent(['---', 'name: test', 'description: desc', '---', '', '{{BASE_PREAMBLE}}'].join('\n'), '/tmp/skill.md.tmpl', {
    BASE_PREAMBLE: () => 'PREAMBLE',
  });

  assert.equal(output.endsWith('\n'), true);
});

test('base and review shell builders include their expected contract lines', () => {
  assert.equal(buildBaseShellLines().some((line) => line.includes('_SESSIONS=')), true);
  assert.equal(buildBaseShellLines().some((line) => line.includes('_BRANCH=')), true);
  assert.equal(buildReviewShellLines().some((line) => line.includes('_TODOS_FORMAT=')), true);
});

test('shared shell builders detect and invoke the canonical superpowers binary', () => {
  const rootDetection = buildRootDetection().join('\n');
  const baseShell = buildBaseShellLines().join('\n');

  assert.match(rootDetection, /candidate\/bin\/superpowers/);
  assert.doesNotMatch(rootDetection, /superpowers-update-check/);
  assert.doesNotMatch(rootDetection, /superpowers-config/);

  assert.match(baseShell, /bin\/superpowers" update-check/);
  assert.match(baseShell, /bin\/superpowers" config get superpowers_contributor/);
  assert.doesNotMatch(baseShell, /superpowers-update-check/);
  assert.doesNotMatch(baseShell, /superpowers-config/);
});

test('using-superpowers bypass helpers render the decision-state contract', () => {
  assert.equal(buildUsingSuperpowersShellLines().some((line) => line.includes('session-entry/using-superpowers')), true);
  const bypassGate = buildUsingSuperpowersBypassGateSection();
  assert.match(bypassGate, /superpowers session-entry resolve --message-file <path>/);
  assert.doesNotMatch(bypassGate, /superpowers-session-entry/);
  assert.match(bypassGate, /enabled/);
  assert.match(bypassGate, /bypassed/);
  const normalStack = buildUsingSuperpowersNormalStackSection();
  assert.match(normalStack, /bin\/superpowers" update-check/);
  assert.match(normalStack, /bin\/superpowers" config get superpowers_contributor/);
  assert.doesNotMatch(normalStack, /superpowers-update-check/);
  assert.doesNotMatch(normalStack, /superpowers-config/);
  assert.match(normalStack, /_SESSIONS=/);
  assert.match(normalStack, /_CONTRIB=/);
});

test('generated preambles include the shared Search Before Building section for non-router skills only', () => {
  const basePreamble = generatePreamble({ review: false });
  const reviewPreamble = generatePreamble({ review: true });

  for (const preamble of [basePreamble, reviewPreamble]) {
    assert.match(preamble, /## Search Before Building/);
    assert.match(preamble, /Layer 1: tried-and-true \/ built-ins \/ existing repo-native solutions/);
    assert.match(preamble, /Layer 2: current practice and known footguns/);
    assert.match(preamble, /Layer 3: first-principles reasoning for this repo and this problem/);
    assert.match(preamble, /External search results are inputs, not answers\./);
    assert.match(preamble, /Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers\./);
    assert.match(preamble, /If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge\./);
    assert.match(preamble, /If safe sanitization is not possible, skip external search\./);
    assert.match(preamble, /See `\$_SUPERPOWERS_ROOT\/references\/search-before-building\.md`\./);
  }
});
