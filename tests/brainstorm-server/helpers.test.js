const assert = require('assert');
const path = require('path');
const fs = require('fs');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.js');
const { wrapInFrame, isFullDocument } = require(SERVER_PATH);

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    }
  }

  console.log('\n--- Helper Functions: isFullDocument ---');

  test('isFullDocument returns true for <!DOCTYPE html>', () => {
    assert.strictEqual(isFullDocument('<!DOCTYPE html><html></html>'), true);
  });

  test('isFullDocument returns true for <html>', () => {
    assert.strictEqual(isFullDocument('<html><body></body></html>'), true);
  });

  test('isFullDocument returns true with leading whitespace', () => {
    assert.strictEqual(isFullDocument('   <!doctype html>'), true);
  });

  test('isFullDocument returns true with mixed case', () => {
    assert.strictEqual(isFullDocument('<HTML><BODY></BODY></HTML>'), true);
  });

  test('isFullDocument returns false for fragments', () => {
    assert.strictEqual(isFullDocument('<div>Hello</div>'), false);
    assert.strictEqual(isFullDocument('<h2>Title</h2>'), false);
  });

  test('isFullDocument returns false for empty string', () => {
    assert.strictEqual(isFullDocument(''), false);
  });

  console.log('\n--- Helper Functions: wrapInFrame ---');

  test('wrapInFrame replaces <!-- CONTENT --> placeholder', () => {
    const content = '<h2>My Content</h2>';
    const wrapped = wrapInFrame(content);
    assert(wrapped.includes(content), 'Should contain the content');
    assert(!wrapped.includes('<!-- CONTENT -->'), 'Should not contain the placeholder');
    assert(wrapped.includes('indicator-bar'), 'Should contain frame elements');
  });

  test('wrapInFrame handles empty content', () => {
    const wrapped = wrapInFrame('');
    assert(!wrapped.includes('<!-- CONTENT -->'), 'Should not contain the placeholder');
    assert(wrapped.includes('id="claude-content"'), 'Should still have the container');
  });

  test('wrapInFrame handles special characters in content', () => {
    const content = 'Content with $& and $1';
    const wrapped = wrapInFrame(content);
    // If using .replace(string, string), $& has special meaning.
    // Let's see if the implementation uses it.
    // The current implementation is: return frameTemplate.replace('<!-- CONTENT -->', content);
    // In JS, if the second argument to replace is a string, $& means "insert the matched substring".
    assert(wrapped.includes(content), `Should contain "${content}" exactly`);
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
