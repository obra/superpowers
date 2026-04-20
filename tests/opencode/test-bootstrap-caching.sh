#!/usr/bin/env bash
# Test: Bootstrap Content Caching (#1202)
# Verifies that getBootstrapContent() caches at module level,
# eliminating per-step file I/O and regex parsing overhead.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Bootstrap Content Caching (#1202) ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

passed=0
failed=0

pass() { echo "  [PASS] $1"; passed=$((passed + 1)); }
fail() { echo "  [FAIL] $1"; failed=$((failed + 1)); }

# ──────────────────────────────────────────────────────────────
# Test 1: Module-level _bootstrapCache variable exists
# ──────────────────────────────────────────────────────────────
echo "Test 1: Module-level cache variable exists..."
if grep -q '_bootstrapCache' "$SUPERPOWERS_PLUGIN_FILE"; then
    pass "Module-level _bootstrapCache variable found"
else
    fail "_bootstrapCache variable not found in plugin"
fi

# ──────────────────────────────────────────────────────────────
# Test 2: Cache is checked before fs operations
# ──────────────────────────────────────────────────────────────
echo "Test 2: Cache checked before filesystem access..."
# The pattern: if (_bootstrapCache !== undefined) return should appear
# BEFORE any fs.existsSync / fs.readFileSync in getBootstrapContent
if grep -qP '_bootstrapCache !== undefined.*return' "$SUPERPOWERS_PLUGIN_FILE"; then
    pass "Early return on cache hit exists"
else
    fail "No early return on cache hit"
fi

# ──────────────────────────────────────────────────────────────
# Test 3: Cache is populated after file read
# ──────────────────────────────────────────────────────────────
echo "Test 3: Cache populated after successful file read..."
if grep -q '_bootstrapCache =' "$SUPERPOWERS_PLUGIN_FILE"; then
    pass "Cache assignment exists"
else
    fail "No cache assignment found"
fi

# ──────────────────────────────────────────────────────────────
# Test 4: Missing file path also cached (null sentinel)
# ──────────────────────────────────────────────────────────────
echo "Test 4: Missing file case also cached (null sentinel)..."
if grep -q '_bootstrapCache = null' "$SUPERPOWERS_PLUGIN_FILE"; then
    pass "Null sentinel for missing file path"
else
    fail "Missing file path not cached — would re-check fs.existsSync every step"
fi

# ──────────────────────────────────────────────────────────────
# Test 5: No redundant fs.readFileSync on cached path
# Verify via Node.js: call getBootstrapContent() twice, count reads
# ──────────────────────────────────────────────────────────────
echo "Test 5: Second call returns cached content without file I/O..."

cat > "$TEST_HOME/test-cache.mjs" <<'TESTEOF'
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

// Monkey-patch fs to count calls
let readCount = 0;
let existsCount = 0;
const origReadFileSync = fs.readFileSync;
const origExistsSync = fs.existsSync;

fs.readFileSync = function(...args) {
  readCount++;
  return origReadFileSync.apply(this, args);
};
fs.existsSync = function(...args) {
  existsCount++;
  return origExistsSync.apply(this, args);
};

// Import the plugin (this sets __dirname based on plugin location)
const pluginPath = process.argv[2];
const mod = await import(pluginPath);

// Initialize plugin
const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });

// Reset cache for clean test
mod._testing.resetCache();

// First call — should hit fs
readCount = 0;
existsCount = 0;
const result1 = await plugin['experimental.chat.messages.transform'](
  {},
  { messages: [{
    info: { role: 'user' },
    parts: [{ type: 'text', text: 'hello' }]
  }]}
);
const firstReadCount = readCount;
const firstExistsCount = existsCount;

// Reset cache state check
const cacheAfterFirst = mod._testing.getCache();

// Reset counters, call again (should be cached)
// Need to reset the injection guard — create fresh messages
readCount = 0;
existsCount = 0;
const result2 = await plugin['experimental.chat.messages.transform'](
  {},
  { messages: [{
    info: { role: 'user' },
    parts: [{ type: 'text', text: 'hello again' }]
  }]}
);
const secondReadCount = readCount;
const secondExistsCount = existsCount;

// Output results
console.log(JSON.stringify({
  firstReadCount,
  firstExistsCount,
  secondReadCount,
  secondExistsCount,
  cachePopulated: cacheAfterFirst !== undefined && cacheAfterFirst !== null,
  contentIncludesMarker: cacheAfterFirst?.includes('EXTREMELY_IMPORTANT') ?? false
}));
TESTEOF

RESULT=$(node "$TEST_HOME/test-cache.mjs" "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null)
if [ $? -ne 0 ]; then
    fail "Cache test script failed to execute"
else
    SECOND_READ=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.secondReadCount))")
    SECOND_EXISTS=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.secondExistsCount))")
    CACHE_POP=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.cachePopulated))")
    CONTENT_OK=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.contentIncludesMarker))")

    if [ "$SECOND_READ" = "0" ] && [ "$SECOND_EXISTS" = "0" ]; then
        pass "Second call made 0 fs.readFileSync and 0 fs.existsSync calls"
    else
        fail "Second call still made fs calls (read=$SECOND_READ, exists=$SECOND_EXISTS)"
    fi

    if [ "$CACHE_POP" = "true" ]; then
        pass "Cache populated after first call"
    else
        fail "Cache not populated after first call"
    fi

    if [ "$CONTENT_OK" = "true" ]; then
        pass "Cached content contains EXTREMELY_IMPORTANT marker"
    else
        fail "Cached content missing expected marker"
    fi
fi

# ──────────────────────────────────────────────────────────────
# Test 6: _testing.resetCache() clears the cache
# ──────────────────────────────────────────────────────────────
echo "Test 6: resetCache() allows re-reading from disk..."

cat > "$TEST_HOME/test-reset.mjs" <<'TESTEOF'
import fs from 'fs';

const pluginPath = process.argv[2];
const mod = await import(pluginPath);

// Initialize and populate cache
const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });
await plugin['experimental.chat.messages.transform'](
  {},
  { messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'test' }] }] }
);

const beforeReset = mod._testing.getCache();
mod._testing.resetCache();
const afterReset = mod._testing.getCache();

console.log(JSON.stringify({
  beforeResetDefined: beforeReset !== undefined,
  afterResetUndefined: afterReset === undefined
}));
TESTEOF

RESULT=$(node "$TEST_HOME/test-reset.mjs" "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null)
if [ $? -ne 0 ]; then
    fail "Reset test script failed to execute"
else
    BEFORE=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.beforeResetDefined))")
    AFTER=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.afterResetUndefined))")

    if [ "$BEFORE" = "true" ] && [ "$AFTER" = "true" ]; then
        pass "resetCache() transitions from defined to undefined"
    else
        fail "resetCache() did not clear properly (before=$BEFORE, after=$AFTER)"
    fi
fi

# ──────────────────────────────────────────────────────────────
# Test 7: Injection guard prevents double-injection in same array
# ──────────────────────────────────────────────────────────────
echo "Test 7: Injection guard prevents double-injection..."

cat > "$TEST_HOME/test-guard.mjs" <<'TESTEOF'
const pluginPath = process.argv[2];
const mod = await import(pluginPath);
mod._testing.resetCache();

const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });

// Create a message array and inject once
const messages = [{
  info: { role: 'user' },
  parts: [{ type: 'text', text: 'hello' }]
}];

await plugin['experimental.chat.messages.transform']({}, { messages });
const partsAfterFirst = messages[0].parts.length;

// Call again on the SAME messages array (simulates what would happen
// if the hook fired twice on the same in-memory messages)
await plugin['experimental.chat.messages.transform']({}, { messages });
const partsAfterSecond = messages[0].parts.length;

console.log(JSON.stringify({
  partsAfterFirst,
  partsAfterSecond,
  noDuplication: partsAfterFirst === partsAfterSecond
}));
TESTEOF

RESULT=$(node "$TEST_HOME/test-guard.mjs" "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null)
if [ $? -ne 0 ]; then
    fail "Guard test script failed to execute"
else
    NO_DUP=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.noDuplication))")
    FIRST=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.partsAfterFirst))")

    if [ "$NO_DUP" = "true" ]; then
        pass "Guard prevented double injection (parts count stable at $FIRST)"
    else
        fail "Bootstrap injected twice into same message"
    fi
fi

# ──────────────────────────────────────────────────────────────
# Test 8: Missing skill file → null cached (no repeated fs probes)
# ──────────────────────────────────────────────────────────────
echo "Test 8: Missing SKILL.md file produces cached null..."

cat > "$TEST_HOME/test-missing.mjs" <<'TESTEOF'
import fs from 'fs';

const pluginPath = process.argv[2];
const mod = await import(pluginPath);
mod._testing.resetCache();

// Temporarily rename the skill file to simulate missing
const skillDir = new URL('../../skills/using-superpowers/SKILL.md', import.meta.resolve(pluginPath));
// We can't easily rename, so instead we'll test by checking the cache
// behavior when _bootstrapCache is set to null
mod._testing.resetCache();

const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });

// Monkey-patch fs.existsSync to return false for SKILL.md
const orig = fs.existsSync;
fs.existsSync = (p) => {
  if (typeof p === 'string' && p.includes('using-superpowers')) return false;
  return orig(p);
};

let readCount = 0;
const origRead = fs.readFileSync;
fs.readFileSync = function(...args) { readCount++; return origRead.apply(this, args); };

// First call — should set null cache
const msgs1 = [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'test' }] }];
await plugin['experimental.chat.messages.transform']({}, { messages: msgs1 });
const cacheAfterMissing = mod._testing.getCache();
const firstReadCount = readCount;

// Second call — should hit null cache, skip fs entirely
readCount = 0;
const msgs2 = [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'test2' }] }];
await plugin['experimental.chat.messages.transform']({}, { messages: msgs2 });

// Restore
fs.existsSync = orig;
fs.readFileSync = origRead;

console.log(JSON.stringify({
  cacheIsNull: cacheAfterMissing === null,
  secondCallReads: readCount,
  noInjection: msgs1[0].parts.length === 1
}));
TESTEOF

RESULT=$(node "$TEST_HOME/test-missing.mjs" "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null)
if [ $? -ne 0 ]; then
    fail "Missing file test script failed to execute"
else
    IS_NULL=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.cacheIsNull))")
    SEC_READS=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.secondCallReads))")
    NO_INJ=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.noInjection))")

    if [ "$IS_NULL" = "true" ]; then
        pass "Cache set to null for missing file"
    else
        fail "Cache not set to null for missing file"
    fi

    if [ "$SEC_READS" = "0" ]; then
        pass "Second call with missing file made 0 fs reads"
    else
        fail "Second call with missing file still read fs ($SEC_READS times)"
    fi

    if [ "$NO_INJ" = "true" ]; then
        pass "No bootstrap injected when file missing"
    else
        fail "Bootstrap somehow injected despite missing file"
    fi
fi

# ──────────────────────────────────────────────────────────────
# Test 9: Source audit — no uncached fs.readFileSync in getBootstrapContent
# ──────────────────────────────────────────────────────────────
echo "Test 9: Source audit — getBootstrapContent caches all fs paths..."

# Extract getBootstrapContent function body and verify cache pattern
# The function should: check cache → fs.existsSync → fs.readFileSync → assign cache
FUNC_BODY=$(sed -n '/const getBootstrapContent/,/^  };$/p' "$SUPERPOWERS_PLUGIN_FILE")

# Verify the cache check comes before any fs call
CACHE_LINE=$(echo "$FUNC_BODY" | grep -n '_bootstrapCache !== undefined' | head -1 | cut -d: -f1)
EXISTS_LINE=$(echo "$FUNC_BODY" | grep -n 'fs.existsSync' | head -1 | cut -d: -f1)

if [ -n "$CACHE_LINE" ] && [ -n "$EXISTS_LINE" ] && [ "$CACHE_LINE" -lt "$EXISTS_LINE" ]; then
    pass "Cache check (line $CACHE_LINE) precedes fs.existsSync (line $EXISTS_LINE)"
else
    fail "Cache check does not precede fs.existsSync (cache=$CACHE_LINE, exists=$EXISTS_LINE)"
fi

# ──────────────────────────────────────────────────────────────
# Test 10: JavaScript syntax still valid after changes
# ──────────────────────────────────────────────────────────────
echo "Test 10: Plugin JavaScript syntax remains valid..."
if node --check "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null; then
    pass "Plugin JavaScript syntax is valid"
else
    fail "Plugin has JavaScript syntax errors"
fi

# ──────────────────────────────────────────────────────────────
# Test 11: _testing export exists for test infrastructure
# ──────────────────────────────────────────────────────────────
echo "Test 11: _testing export available..."
if grep -q 'export const _testing' "$SUPERPOWERS_PLUGIN_FILE"; then
    pass "_testing export exists"
else
    fail "_testing export not found"
fi

# ──────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────
echo ""
total=$((passed + failed))
echo "=== Results: $passed/$total passed ==="

if [ "$failed" -gt 0 ]; then
    exit 1
fi
echo "=== All bootstrap caching tests passed ==="
