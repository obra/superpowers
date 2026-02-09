
import { getState, updateState } from './git-notes-state.js';

export function queryMemory(path) {
    const state = getState();
    if (!path) return state;
    
    const keys = path.split('.');
    let current = state;
    
    for (const key of keys) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[key];
    }
    
    return current;
}

export function appendToMemory(path, item) {
    const currentValue = queryMemory(path);
    
    let newValue;
    if (Array.isArray(currentValue)) {
        newValue = [...currentValue, item];
    } else if (typeof currentValue === 'object' && currentValue !== null) {
        // Validation: item must be object for merging into object
        if (typeof item !== 'object' || item === null) {
             throw new Error(`Cannot merge non-object item into object section "${path}"`);
        }
        // For object merge, we just pass the item to be merged via deepMerge in updateState.
        // But wait! If we construct updateObject with JUST item, deepMerge will merge it into existing.
        // Yes, deepMerge(target, source) merges source into target.
        // So newValue = item is correct strategy for object merging IF we construct the full path object.
        newValue = item;
    } else {
        // If path doesn't exist (undefined) or is primitive.
        // If undefined, we can't infer type.
        // If primitive, we can't append/merge.
        throw new Error(`Section "${path}" not found or is not an array/object.`);
    }

    // Construct the update object: { key1: { key2: ... : newValue } ... }
    const keys = path.split('.');
    const updateObject = keys.reduceRight((acc, key) => ({ [key]: acc }), newValue);
    
    updateState(updateObject);
}
