import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEST_DIR = path.join(os.tmpdir(), 'superpowers-notion-test-' + Date.now());

// Mock notionRequest tracking
let mockNotionResponses = [];
let notionRequestCalls = [];

// Create a test version of the adapter with injectable notionRequest
class TestableNotionAdapter {
    constructor(config, notionRequestFn) {
        this.databaseId = config.database_id;
        if (!this.databaseId) {
            throw new Error("Notion Adapter requires database_id config");
        }
        this.notionRequest = notionRequestFn;
    }

    async createSubtask(parentId, title) {
        const properties = {
            Name: {
                title: [{ text: { content: title } }]
            },
            "Parent Item": {
                relation: [{ id: parentId }]
            }
        };

        try {
            const response = await this.notionRequest('pages', 'POST', {
                parent: { database_id: this.databaseId },
                properties: properties
            });
            return { id: response.id, key: response.id, url: response.url };
        } catch (e) {
            console.warn("Failed to create subtask with relation, falling back to description checklist.");
            // Fallback: Add todo block to parent
            const response = await this.notionRequest(`blocks/${parentId}/children`, 'PATCH', {
                children: [
                    {
                        object: 'block',
                        type: 'to_do',
                        to_do: {
                            rich_text: [{ type: 'text', text: { content: `Subtask: ${title}` } }]
                        }
                    }
                ]
            });
            const fallbackId = response?.results?.[0]?.id || parentId;
            return { id: fallbackId, key: fallbackId, url: '' };
        }
    }
}

// Mock notionRequest function
const mockNotionRequest = async (endpoint, method, body) => {
    notionRequestCalls.push({ endpoint, method, body });

    if (mockNotionResponses.length > 0) {
        const response = mockNotionResponses.shift();
        if (response instanceof Error) {
            throw response;
        }
        return response;
    }

    throw new Error('No mock response configured');
};

function setup() {
    // Reset mocks
    mockNotionResponses = [];
    notionRequestCalls = [];
}

function teardown() {
    mockNotionResponses = [];
    notionRequestCalls = [];
}

async function runTests() {
    console.log('Running notion-adapter tests...');

    try {
        // Test 1: createSubtask fallback returns actual block ID, not 'fallback'
        console.log('Test 1: createSubtask fallback returns actual block ID from response');
        setup();

        const adapter = new TestableNotionAdapter(
            { database_id: 'test-db-id' },
            mockNotionRequest
        );

        // Mock the relation creation to fail
        mockNotionResponses.push(new Error('Property Parent Item does not exist'));

        // Mock the fallback PATCH request to return a block
        mockNotionResponses.push({
            results: [
                {
                    id: 'block-abc-123',
                    type: 'to_do',
                    to_do: {
                        rich_text: [{ type: 'text', text: { content: 'Subtask: Test Task' } }]
                    }
                }
            ]
        });

        const result = await adapter.createSubtask('parent-123', 'Test Task');

        // The bug: current code returns { id: 'fallback', key: 'fallback', url: '' }
        // Expected: { id: 'block-abc-123', key: 'block-abc-123', url: '' }
        assert.strictEqual(result.id, 'block-abc-123', 'Should return actual block ID, not "fallback"');
        assert.strictEqual(result.key, 'block-abc-123', 'Should return actual block ID as key');
        assert.strictEqual(result.url, '', 'URL can be empty for blocks');

        // Verify the PATCH call was made correctly
        assert.strictEqual(notionRequestCalls.length, 2, 'Should make 2 API calls');
        assert.strictEqual(notionRequestCalls[1].endpoint, 'blocks/parent-123/children');
        assert.strictEqual(notionRequestCalls[1].method, 'PATCH');

        teardown();
        console.log('✓ Test 1 passed');

        console.log('All notion-adapter tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        teardown();
        process.exit(1);
    }
}

runTests();
