import assert from 'assert';
import { test, mock } from 'node:test';
import fs from 'fs';
import child_process from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the plugin
import { SuperpowersPlugin } from '../../.opencode/plugins/superpowers.js';

test('Automated Skill Activation', async (t) => {
    
    // Step 1: Mock Persona State
    await t.test('simulates an Architect session and verifies brainstorming is injected', async () => {
        const execMock = mock.method(child_process, 'execSync', (cmd) => {
            if (cmd.includes('git notes') && cmd.includes('show')) {
                return Buffer.from(JSON.stringify({
                    metadata: { last_agent: "Zen Architect" }
                }));
            }
            return Buffer.from('');
        });

        const existsSyncMock = mock.method(fs, 'existsSync', (p) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.includes('using-superpowers')) return true;
            if (normalizedP.includes('brainstorming')) return true;
            if (normalizedP.endsWith('skills')) return true;
            return false;
        });

        const readdirSyncMock = mock.method(fs, 'readdirSync', (p, options) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.endsWith('skills')) {
                return [
                    { name: 'brainstorming', isDirectory: () => true },
                    { name: 'using-superpowers', isDirectory: () => true }
                ];
            }
            return [];
        });

        const readFileSyncMock = mock.method(fs, 'readFileSync', (p) => {
            if (p.includes('brainstorming')) {
                return '---\nname: brainstorming\nsemantic_tags: [role:architect]\n---\nBrainstorming Content';
            }
            if (p.includes('using-superpowers')) {
                return '---\nname: using-superpowers\n---\nUsing Superpowers Content';
            }
            return '';
        });

        try {
            const plugin = await SuperpowersPlugin({ client: {}, directory: process.cwd() });
            const transform = plugin['experimental.chat.system.transform'];
            
            const _input = { message: { content: '' } };
            const output = { system: [] };
            
            await transform(_input, output);
            
            assert.ok(output.system.some(s => s.includes('Brainstorming Content')), 'Should include brainstorming content');
        } finally {
            execMock.mock.restore();
            existsSyncMock.mock.restore();
            readdirSyncMock.mock.restore();
            readFileSyncMock.mock.restore();
        }
    });

    // Step 2: Mock Prompt Mention
    await t.test('simulates a mention in prompt and verifies TDD is injected', async () => {
        const execMock = mock.method(child_process, 'execSync', (cmd) => {
            return Buffer.from(''); // No state
        });

        const existsSyncMock = mock.method(fs, 'existsSync', (p) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.includes('using-superpowers')) return true;
            if (normalizedP.includes('test-driven-development')) return true;
            if (normalizedP.endsWith('skills')) return true;
            return false;
        });

        const readdirSyncMock = mock.method(fs, 'readdirSync', (p) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.endsWith('skills')) {
                return [
                    { name: 'test-driven-development', isDirectory: () => true },
                    { name: 'using-superpowers', isDirectory: () => true }
                ];
            }
            return [];
        });

        const readFileSyncMock = mock.method(fs, 'readFileSync', (p) => {
            if (p.includes('test-driven-development')) {
                return '---\nname: test-driven-development\nsemantic_tags: [role:builder]\n---\nTDD Content';
            }
            if (p.includes('using-superpowers')) {
                return '---\nname: using-superpowers\n---\nUsing Superpowers Content';
            }
            return '';
        });

        try {
            const plugin = await SuperpowersPlugin({ client: {}, directory: process.cwd() });
            const transform = plugin['experimental.chat.system.transform'];
            
            const _input = { message: { content: 'Hey @modular-builder, implement this' } };
            const output = { system: [] };
            
            await transform(_input, output);
            
            assert.ok(output.system.some(s => s.includes('TDD Content')), 'Should include TDD content');
        } finally {
            execMock.mock.restore();
            existsSyncMock.mock.restore();
            readdirSyncMock.mock.restore();
            readFileSyncMock.mock.restore();
        }
    });

    // Step 3: Verify Deduplication
    await t.test('verifies skill content is only injected once even if both state and mention match', async () => {
        const execMock = mock.method(child_process, 'execSync', (cmd) => {
            if (cmd.includes('git notes') && cmd.includes('show')) {
                return Buffer.from(JSON.stringify({
                    metadata: { last_agent: "Modular Builder" }
                }));
            }
            return Buffer.from('');
        });

        const existsSyncMock = mock.method(fs, 'existsSync', (p) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.includes('using-superpowers')) return true;
            if (normalizedP.includes('test-driven-development')) return true;
            if (normalizedP.endsWith('skills')) return true;
            return false;
        });

        const readdirSyncMock = mock.method(fs, 'readdirSync', (p) => {
            const normalizedP = p.replace(/\\/g, '/');
            if (normalizedP.endsWith('skills')) {
                return [
                    { name: 'test-driven-development', isDirectory: () => true },
                    { name: 'using-superpowers', isDirectory: () => true }
                ];
            }
            return [];
        });

        const readFileSyncMock = mock.method(fs, 'readFileSync', (p) => {
            if (p.includes('test-driven-development')) {
                return '---\nname: test-driven-development\nsemantic_tags: [role:builder]\n---\nTDD Content';
            }
            if (p.includes('using-superpowers')) {
                return '---\nname: using-superpowers\n---\nUsing Superpowers Content';
            }
            return '';
        });

        try {
            const plugin = await SuperpowersPlugin({ client: {}, directory: process.cwd() });
            const transform = plugin['experimental.chat.system.transform'];
            
            const _input = { message: { content: 'Hey @modular-builder, implement this' } };
            const output = { system: [] };
            
            await transform(_input, output);
            
            const tddContents = output.system.filter(s => s.includes('TDD Content'));
            assert.strictEqual(tddContents.length, 1, 'Should only include TDD content once');
        } finally {
            execMock.mock.restore();
            existsSyncMock.mock.restore();
            readdirSyncMock.mock.restore();
            readFileSyncMock.mock.restore();
        }
    });
});
