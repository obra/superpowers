import test from 'node:test';
import assert from 'node:assert/strict';
import {
  insertGeneratedHeader,
  renderTemplateContent,
  buildBaseShellLines,
  buildReviewShellLines,
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
  assert.equal(buildReviewShellLines().some((line) => line.includes('_TODOS_FORMAT=')), true);
});
