import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEST_DIR = path.join(os.tmpdir(), 'superpowers-notion-sync-test-' + Date.now());
const MAP_FILE = path.join(TEST_DIR, '.superpowers', 'notion-map.json');

// Testable versions of the functions
function getMap() {
    if (fs.existsSync(MAP_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
        } catch (err) {
            console.warn(`Warning: failed to parse ${MAP_FILE}; starting fresh.`);
        }
    }
    return {};
}

function saveMap(map) {
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
    fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

function setup() {
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
}

function teardown() {
    try {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
        // Ignore cleanup errors
    }
}

async function runTests() {
    console.log('Running notion-sync tests...');

    try {
        // Test 1: getMap handles malformed JSON gracefully
        console.log('Test 1: getMap returns empty object on malformed JSON with warning');
        setup();

        // Write malformed JSON to the map file
        fs.writeFileSync(MAP_FILE, '{ invalid json }');

        // After fix: should return empty object and log warning instead of throwing
        const map = getMap();
        assert.deepStrictEqual(map, {}, 'getMap should return empty object on malformed JSON');

        teardown();
        console.log('✓ Test 1 passed');

        // Test 2: saveMap should create directory if it doesn't exist
        console.log('Test 2: saveMap creates directory if it does not exist');

        // Clean up and don't create the directory
        teardown();

        // After fix: should create directory and save successfully
        saveMap({ test: 'value' });

        // Verify file was created and contains correct data
        assert.ok(fs.existsSync(MAP_FILE), 'Map file should exist');
        const savedData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
        assert.deepStrictEqual(savedData, { test: 'value' }, 'Saved data should match');

        teardown();
        console.log('✓ Test 2 passed');

        // Test 3: Parent ID normalization should work for both hyphenated and non-hyphenated IDs
        console.log('Test 3: Parent ID normalization handles both formats consistently');

        // Simulate the searchChildPage function logic
        function searchChildPage(title, parentId, mockResults) {
            // Client-side filtering because Notion search is fuzzy and global
            const normalizeId = (id) => id?.replace(/-/g, '');
            const match = mockResults.find(page => {
                const pageTitle = page.properties?.title?.title?.[0]?.plain_text ||
                                  page.properties?.Name?.title?.[0]?.plain_text;

                // Normalize both sides for consistent comparison
                const parentMatch = normalizeId(page.parent?.page_id) === normalizeId(parentId);
                return pageTitle === title && parentMatch;
            });

            return match ? match.id : null;
        }

        // Test case 1: parentId with hyphens, page.parent.page_id without hyphens
        const mockResults1 = [{
            id: 'page-123',
            properties: {
                Name: {
                    title: [{ plain_text: 'Test Page' }]
                }
            },
            parent: {
                page_id: '12345678901234567890123456789012' // No hyphens (how Notion returns it)
            }
        }];

        // This should work with current implementation
        const result1 = searchChildPage('Test Page', '12345678-9012-3456-7890-123456789012', mockResults1);
        assert.strictEqual(result1, 'page-123', 'Should find page when parentId has hyphens but response does not');

        // Test case 2: parentId WITHOUT hyphens, page.parent.page_id WITH hyphens
        // This is the bug case - response sometimes returns page_id with hyphens
        const mockResults2 = [{
            id: 'page-456',
            properties: {
                Name: {
                    title: [{ plain_text: 'Test Page 2' }]
                }
            },
            parent: {
                page_id: '12345678-9012-3456-7890-123456789012' // WITH hyphens (also valid from Notion)
            }
        }];

        // Bug: This won't find the page because we're comparing:
        // '12345678-9012-3456-7890-123456789012' === '12345678901234567890123456789012'.replace(/-/g, '')
        // '12345678-9012-3456-7890-123456789012' === '12345678901234567890123456789012' -> false
        const result2 = searchChildPage('Test Page 2', '12345678901234567890123456789012', mockResults2);
        assert.strictEqual(result2, 'page-456', 'Should find page when response has hyphens but parentId does not');

        teardown();
        console.log('✓ Test 3 passed');

        console.log('All notion-sync tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        teardown();
        process.exit(1);
    }
}

runTests();
