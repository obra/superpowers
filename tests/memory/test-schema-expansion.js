import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SCHEMA, validate } from '../../lib/state-schema.js';

describe('State Schema Expansion', () => {
    it('should include knowledge_base in SCHEMA', () => {
        assert.ok(SCHEMA.knowledge_base, 'knowledge_base missing from SCHEMA');
        assert.strictEqual(SCHEMA.knowledge_base.decisions, 'array');
        assert.strictEqual(SCHEMA.knowledge_base.patterns, 'array');
        assert.strictEqual(SCHEMA.knowledge_base.glossary, 'object');
    });

    it('should validate knowledge_base structure', () => {
        const validState = {
            knowledge_base: {
                decisions: [],
                patterns: [],
                glossary: {}
            }
        };

        try {
            validate(validState);
        } catch (e) {
            assert.fail(`Validation failed for valid state: ${e.message}`);
        }
    });

    it('should reject invalid knowledge_base entries', () => {
        const invalidState = {
            knowledge_base: {
                decisions: 'not-an-array', // Should be array
                patterns: [],
                glossary: {}
            }
        };

        assert.throws(() => validate(invalidState), /Validation failed/);
    });

    it('should reject extra keys in knowledge_base', () => {
        const invalidState = {
            knowledge_base: {
                decisions: [],
                patterns: [],
                glossary: {},
                extra: 'not-allowed'
            }
        };

        assert.throws(() => validate(invalidState), /Validation failed/);
    });
});
