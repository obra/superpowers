export const SCHEMA = {
    architecture: 'object',
    implementation: 'object',
    diagnostics: 'object',
    registry: 'object',
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
