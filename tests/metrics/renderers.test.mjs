import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { renderTerminal } from '../../lib/metrics/render-terminal.mjs';
import { renderMarkdown } from '../../lib/metrics/render-markdown.mjs';
import { renderJson } from '../../lib/metrics/render-json.mjs';
import { blockedModel, incompleteModel, passModel } from './fixtures.mjs';

const readGolden = name => readFileSync(
  new URL(`./golden/${name}`, import.meta.url),
  'utf8',
);

for (const fixture of [
  ['pass-terminal.txt', renderTerminal, passModel()],
  ['pass-report.md', renderMarkdown, passModel()],
  ['pass.json', renderJson, passModel()],
  ['blocked-report.md', renderMarkdown, blockedModel()],
  ['incomplete-report.md', renderMarkdown, incompleteModel()],
]) {
  test(`matches ${fixture[0]}`, () => {
    assert.equal(fixture[1](fixture[2]), readGolden(fixture[0]));
  });
}

test('rendering is deterministic and does not expose raw events', () => {
  const first = renderMarkdown(passModel());
  assert.equal(renderMarkdown(passModel()), first);
  assert.doesNotMatch(first, /events\.jsonl|prompt|diff --git|command output/i);
});
