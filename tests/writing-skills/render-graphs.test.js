const assert = require('assert');
const { extractDotBlocks, extractGraphBody } = require('../../skills/writing-skills/render-graphs');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('--- Testing extractDotBlocks ---');

test('extractDotBlocks: standard newline', () => {
  const markdown = '```dot\ndigraph G { a -> b }\n```';
  const blocks = extractDotBlocks(markdown);
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].name, 'G');
  assert.strictEqual(blocks[0].content, 'digraph G { a -> b }');
});

test('extractDotBlocks: Windows newline after ```dot', () => {
  const markdown = '```dot\r\ndigraph G { a -> b }\r\n```';
  const blocks = extractDotBlocks(markdown);
  assert.strictEqual(blocks.length, 1, 'Should find one block even with \r\n');
  assert.strictEqual(blocks[0].name, 'G');
});

test('extractDotBlocks: multiple blocks', () => {
  const markdown = 'One:\n```dot\ndigraph A { a }\n```\nTwo:\n```dot\ndigraph B { b }\n```';
  const blocks = extractDotBlocks(markdown);
  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0].name, 'A');
  assert.strictEqual(blocks[1].name, 'B');
});

test('extractDotBlocks: nameless digraph', () => {
  const markdown = '```dot\ndigraph { a -> b }\n```';
  const blocks = extractDotBlocks(markdown);
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].name, 'graph_1');
});

console.log('\n--- Testing extractGraphBody ---');

test('extractGraphBody: named digraph', () => {
  const dot = 'digraph MyGraph { a -> b; }';
  const body = extractGraphBody(dot);
  assert.strictEqual(body, 'a -> b;');
});

test('extractGraphBody: nameless digraph', () => {
  const dot = 'digraph { a -> b; }';
  const body = extractGraphBody(dot);
  assert.strictEqual(body, 'a -> b;');
});

test('extractGraphBody: removes rankdir', () => {
  const dot = 'digraph G {\n  rankdir=LR;\n  a -> b;\n}';
  const body = extractGraphBody(dot);
  assert.ok(!body.includes('rankdir=LR'));
  assert.ok(body.includes('a -> b;'));
});

test('extractGraphBody: complex nested braces', () => {
  const dot = 'digraph G { subgraph cluster_0 { label="test"; a; } b; }';
  const body = extractGraphBody(dot);
  assert.strictEqual(body, 'subgraph cluster_0 { label="test"; a; } b;');
});

test('extractGraphBody: malformed (no braces)', () => {
  const dot = 'digraph G a -> b;';
  const body = extractGraphBody(dot);
  assert.strictEqual(body, '');
});
