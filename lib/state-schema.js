export const SCHEMA = {
    architecture: 'object',
    implementation: 'object',
    diagnostics: 'object',
    registry: 'object',
    knowledge_base: {
        decisions: 'array',
        patterns: 'array',
        glossary: 'object'
    },
    metadata: {
        last_agent: 'string',
        timestamp: 'string'
    }
};

export function validate(state) {
    for (const key in state) {
        if (!SCHEMA[key]) {
            throw new Error(`Validation failed: Invalid top-level key "${key}"`);
        }
        
        if (key === 'metadata') {
            const metadata = state[key];
            if (typeof metadata !== 'object' || metadata === null) {
                throw new Error('Validation failed: "metadata" must be an object');
            }
            for (const mKey in metadata) {
                if (!SCHEMA.metadata[mKey]) {
                    throw new Error(`Validation failed: Invalid metadata key "${mKey}"`);
                }
                if (typeof metadata[mKey] !== SCHEMA.metadata[mKey]) {
                    throw new Error(`Validation failed: Metadata key "${mKey}" must be a ${SCHEMA.metadata[mKey]}`);
                }
            }
        } else if (key === 'knowledge_base') {
            const kb = state[key];
            if (typeof kb !== 'object' || kb === null) {
                throw new Error('Validation failed: "knowledge_base" must be an object');
            }
            for (const kKey in kb) {
                if (!SCHEMA.knowledge_base[kKey]) {
                    throw new Error(`Validation failed: Invalid knowledge_base key "${kKey}"`);
                }
                const expectedType = SCHEMA.knowledge_base[kKey];
                if (expectedType === 'array') {
                    if (!Array.isArray(kb[kKey])) {
                        throw new Error(`Validation failed: knowledge_base key "${kKey}" must be an array`);
                    }
                } else if (typeof kb[kKey] !== expectedType) {
                    throw new Error(`Validation failed: knowledge_base key "${kKey}" must be a ${expectedType}`);
                }
            }
        } else {
            if (typeof state[key] !== 'object' || state[key] === null) {
                throw new Error(`Validation failed: "${key}" must be an object`);
            }
        }
    }
}

export function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!result[key] || typeof result[key] !== 'object' || Array.isArray(result[key])) {
                result[key] = {};
            }
            result[key] = deepMerge(result[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}
