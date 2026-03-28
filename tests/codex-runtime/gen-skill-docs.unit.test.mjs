import test from 'node:test';
import assert from 'node:assert/strict';
import {
  insertGeneratedHeader,
  renderTemplateContent,
  buildRootDetection,
  buildBaseShellLines,
  buildReviewShellLines,
  generatePreamble,
  buildUsingFeatureForgeShellLines,
  buildUsingFeatureForgeBypassGateSection,
  buildUsingFeatureForgeNormalStackSection,
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

test('shared shell builders delegate runtime-root discovery to the helper contract', () => {
  const rootDetection = buildRootDetection().join('\n');
  const baseShell = buildBaseShellLines().join('\n');

  assert.match(rootDetection, /repo runtime-root --path/);
  assert.match(rootDetection, /\$HOME\/\.featureforge\/install/);
  assert.match(rootDetection, /_FEATUREFORGE_INSTALL_ROOT/);
  assert.match(rootDetection, /_FEATUREFORGE_BIN="\$_FEATUREFORGE_INSTALL_ROOT\/bin\/featureforge"/);
  assert.match(rootDetection, /featureforge\.exe/);
  assert.match(rootDetection, /_FEATUREFORGE_BIN="\$_FEATUREFORGE_INSTALL_ROOT\/bin\/featureforge\.exe"/);
  assert.doesNotMatch(rootDetection, /_REPO_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(rootDetection, /_FEATUREFORGE_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(rootDetection, /\$INSTALL_DIR\/bin\/featureforge/);
  assert.doesNotMatch(rootDetection, /command -v featureforge/);
  assert.doesNotMatch(rootDetection, /_IS_FEATUREFORGE_RUNTIME_ROOT/);
  assert.doesNotMatch(rootDetection, /\.codex\/featureforge/);
  assert.doesNotMatch(rootDetection, /\.copilot\/featureforge/);
  assert.doesNotMatch(rootDetection, /sed -n/);

  // Intentional invariant: generated skill runtime commands must stay on the
  // packaged install binary at ~/.featureforge/install/bin/featureforge.
  // Runtime-root resolution only selects companion files from the install. It
  // must NEVER switch runtime execution back to a root-selected binary or a
  // PATH-selected fallback.
  assert.match(baseShell, /repo runtime-root --path/);
  assert.match(baseShell, /"\$_FEATUREFORGE_BIN" update-check/);
  assert.match(baseShell, /"\$_FEATUREFORGE_BIN" config get featureforge_contributor/);
  assert.doesNotMatch(baseShell, /repo runtime-root --path.*\|\| true/);
  assert.doesNotMatch(baseShell, /\$_REPO_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(baseShell, /\$_FEATUREFORGE_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(baseShell, /\$_FEATUREFORGE_ROOT\/bin\/featureforge\.exe/);
  assert.doesNotMatch(baseShell, /\$INSTALL_DIR\/bin\/featureforge/);
  assert.doesNotMatch(baseShell, /\$INSTALL_DIR\/bin\/featureforge\.exe/);
  assert.doesNotMatch(baseShell, /\$\{_FEATUREFORGE_BIN:-featureforge\}/);
  assert.doesNotMatch(baseShell, /command -v featureforge/);
  assert.doesNotMatch(baseShell, /featureforge-update-check/);
  assert.doesNotMatch(baseShell, /featureforge-config/);
});

test('using-featureforge bypass helpers render the decision-state contract', () => {
  assert.equal(buildUsingFeatureForgeShellLines().some((line) => line.includes('session-entry/using-featureforge')), true);
  const bypassGate = buildUsingFeatureForgeBypassGateSection();
  assert.match(bypassGate, /featureforge session-entry resolve --message-file <path>/);
  assert.match(bypassGate, /Fresh-session spec review, plan review, and execution-preflight intents must still surface the bypass prompt first/);
  assert.doesNotMatch(bypassGate, /featureforge-session-entry/);
  assert.match(bypassGate, /enabled/);
  assert.match(bypassGate, /bypassed/);
  const normalStack = buildUsingFeatureForgeNormalStackSection();
  assert.match(normalStack, /"\$_FEATUREFORGE_BIN" update-check/);
  assert.match(normalStack, /"\$_FEATUREFORGE_BIN" config get featureforge_contributor/);
  assert.doesNotMatch(normalStack, /\$_FEATUREFORGE_ROOT\/bin\/featureforge/);
  assert.doesNotMatch(normalStack, /featureforge-update-check/);
  assert.doesNotMatch(normalStack, /featureforge-config/);
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
    assert.match(preamble, /See `\$_FEATUREFORGE_ROOT\/references\/search-before-building\.md`\./);
  }
});
