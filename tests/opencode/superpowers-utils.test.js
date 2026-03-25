const assert = require('assert');
const path = require('path');
const os = require('os');

// In modern Node.js, we might need to handle ESM imports if superpowers.js is ESM
// but the test environment seems to prefer CommonJS for existing tests.
// Let's check how other tests do it.
// Actually, superpowers.js uses 'import' so it's ESM.
// Node can import ESM into CommonJS using dynamic import().
// Or we can write the test as ESM too.
// Given superpowers.js uses import, we'll use dynamic import for simplicity in a CJS test runner.

async function runTests() {
    console.log('--- Loading superpowers.js utils ---');
    const { extractAndStripFrontmatter, normalizePath } = await import('../../.opencode/plugins/superpowers.js');

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

    console.log('\n--- Testing extractAndStripFrontmatter ---');

    test('extractAndStripFrontmatter: valid frontmatter', () => {
        const content = '---\ntitle: My Skill\nauthor: Jules\n---\nThis is the body content.';
        const result = extractAndStripFrontmatter(content);
        assert.deepStrictEqual(result.frontmatter, { title: 'My Skill', author: 'Jules' });
        assert.strictEqual(result.content, 'This is the body content.');
    });

    test('extractAndStripFrontmatter: no frontmatter', () => {
        const content = 'This content has no frontmatter.';
        const result = extractAndStripFrontmatter(content);
        assert.deepStrictEqual(result.frontmatter, {});
        assert.strictEqual(result.content, content);
    });

    test('extractAndStripFrontmatter: quoted values', () => {
        const content = '---\ntitle: "Quoted Title"\n"key": \'Single Quoted\'\n---\nBody';
        const result = extractAndStripFrontmatter(content);
        // Note: The current implementation only strips quotes from the value, not the key.
        // And it only strips if they are at the start AND end of the value.
        assert.strictEqual(result.frontmatter.title, 'Quoted Title');
        assert.strictEqual(result.frontmatter['"key"'], 'Single Quoted');
    });

    test('extractAndStripFrontmatter: empty frontmatter', () => {
        const content = '---\n\n---\nBody content';
        const result = extractAndStripFrontmatter(content);
        assert.deepStrictEqual(result.frontmatter, {});
        assert.strictEqual(result.content, 'Body content');
    });

    test('extractAndStripFrontmatter: malformed (missing closing ---)', () => {
        const content = '---\ntitle: test\nBody without closing';
        const result = extractAndStripFrontmatter(content);
        assert.deepStrictEqual(result.frontmatter, {});
        assert.strictEqual(result.content, content);
    });

    test('extractAndStripFrontmatter: handles multiple colons in value', () => {
        const content = '---\nurl: http://example.com\n---\nBody';
        const result = extractAndStripFrontmatter(content);
        assert.strictEqual(result.frontmatter.url, 'http://example.com');
    });

    console.log('\n--- Testing normalizePath ---');
    const homeDir = '/home/user';

    test('normalizePath: tilde expansion with path', () => {
        const p = '~/docs/file.txt';
        const result = normalizePath(p, homeDir);
        assert.strictEqual(result, path.resolve('/home/user/docs/file.txt'));
    });

    test('normalizePath: simple tilde', () => {
        const p = '~';
        const result = normalizePath(p, homeDir);
        assert.strictEqual(result, path.resolve(homeDir));
    });

    test('normalizePath: normal absolute path', () => {
        const p = '/tmp/test';
        const result = normalizePath(p, homeDir);
        assert.strictEqual(result, path.resolve('/tmp/test'));
    });

    test('normalizePath: relative path', () => {
        const p = 'relative/path';
        const result = normalizePath(p, homeDir);
        assert.strictEqual(result, path.resolve('relative/path'));
    });

    test('normalizePath: trimming whitespace', () => {
        const p = '  ~/path  ';
        const result = normalizePath(p, homeDir);
        assert.strictEqual(result, path.resolve('/home/user/path'));
    });

    test('normalizePath: null/undefined/non-string inputs', () => {
        assert.strictEqual(normalizePath(null, homeDir), null);
        assert.strictEqual(normalizePath(undefined, homeDir), null);
        assert.strictEqual(normalizePath(123, homeDir), null);
        assert.strictEqual(normalizePath('', homeDir), null);
        assert.strictEqual(normalizePath('   ', homeDir), null);
    });

    console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
