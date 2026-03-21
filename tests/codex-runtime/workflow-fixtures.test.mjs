import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  REPO_ROOT,
  readUtf8,
} from './helpers/markdown-test-helpers.mjs';

const FIXTURE_ROOT = path.join(REPO_ROOT, 'tests/codex-runtime/fixtures/workflow-artifacts');

const SPEC_FIXTURES = [
  'specs/2026-01-22-document-review-system-design.md',
  'specs/2026-01-22-document-review-system-design-v2.md',
  'specs/2026-02-19-visual-brainstorming-refactor-design.md',
  'specs/2026-03-11-zero-dep-brainstorm-server-design.md',
];

const PLAN_FIXTURES = [
  'plans/2026-01-22-document-review-system.md',
  'plans/2026-02-19-visual-brainstorming-refactor.md',
  'plans/2026-03-11-zero-dep-brainstorm-server.md',
];

const STALE_PATH_PLAN_FIXTURE = 'plans/2026-01-22-document-review-system-stale-path.md';

function getExactHeaderLine(content, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^\\*\\*${escaped}:\\*\\* .+$`, 'm'));
  return match ? match[0] : null;
}

test('all workflow fixture files exist', () => {
  for (const relPath of [...SPEC_FIXTURES, ...PLAN_FIXTURES, STALE_PATH_PLAN_FIXTURE]) {
    const filePath = path.join(FIXTURE_ROOT, relPath);
    assert.equal(true, readUtf8(filePath).length > 0, `${relPath} should exist`);
  }
});

test('spec fixtures carry the required workflow headers', () => {
  for (const relPath of SPEC_FIXTURES) {
    const content = readUtf8(path.join(FIXTURE_ROOT, relPath));
    assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** CEO Approved', `${relPath} should use the exact approved-spec workflow state line`);
    assert.equal(getExactHeaderLine(content, 'Spec Revision'), '**Spec Revision:** 1', `${relPath} should use the exact spec revision line`);
    assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-ceo-review', `${relPath} should use the exact spec reviewer line`);
  }
});

test('plan fixtures carry the required workflow headers', () => {
  const happyPathSpecs = [
    'specs/2026-01-22-document-review-system-design.md',
    'specs/2026-02-19-visual-brainstorming-refactor-design.md',
    'specs/2026-03-11-zero-dep-brainstorm-server-design.md',
  ];
  for (const [index, relPath] of PLAN_FIXTURES.entries()) {
    const content = readUtf8(path.join(FIXTURE_ROOT, relPath));
    assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** Engineering Approved', `${relPath} should use the exact approved-plan workflow state line`);
    assert.equal(
      getExactHeaderLine(content, 'Source Spec'),
      `**Source Spec:** \`tests/codex-runtime/fixtures/workflow-artifacts/${happyPathSpecs[index]}\``,
      `${relPath} should point at the matching spec fixture`,
    );
    assert.equal(getExactHeaderLine(content, 'Source Spec Revision'), '**Source Spec Revision:** 1', `${relPath} should use the exact source revision line`);
    assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-eng-review', `${relPath} should use the exact plan reviewer line`);
  }
});

test('stale-path plan fixture preserves the source-spec path mismatch case', () => {
  const content = readUtf8(path.join(FIXTURE_ROOT, STALE_PATH_PLAN_FIXTURE));
  assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** Engineering Approved');
  assert.equal(
    getExactHeaderLine(content, 'Source Spec'),
    '**Source Spec:** `tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-01-22-document-review-system-design.md`',
  );
  assert.equal(getExactHeaderLine(content, 'Source Spec Revision'), '**Source Spec Revision:** 1');
  assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-eng-review');
});

test('fixture README documents provenance and intent', () => {
  const content = readUtf8(path.join(FIXTURE_ROOT, 'README.md'));
  assert.match(content, /108c0e8/);
  assert.match(content, /ce106d0/);
  assert.match(content, /header contract/i);
  assert.match(content, /stale source-spec path/i);
});

test('runtime sequencing coverage points at the fixture directory', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/codex-runtime/test-workflow-sequencing.sh'));
  assert.match(content, /WORKFLOW_FIXTURE_DIR="tests\/codex-runtime\/fixtures\/workflow-artifacts"/);
});
