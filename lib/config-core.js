import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Load configuration from project and user config files.
 * Project config overrides user config.
 *
 * @param {string} projectDir - Current project directory (optional, defaults to process.cwd())
 * @returns {object} - Merged configuration object
 */
export function loadConfig(projectDir = process.cwd()) {
    const userConfigPath = path.join(os.homedir(), '.superpowers', 'config.json');
    const projectConfigPath = path.join(projectDir, '.superpowers', 'config.json');

    let userConfig = {};
    let projectConfig = {};

    if (fs.existsSync(userConfigPath)) {
        try {
            userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Failed to parse user config at ${userConfigPath}`);
        }
    }

    if (fs.existsSync(projectConfigPath)) {
        try {
            projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Failed to parse project config at ${projectConfigPath}`);
        }
    }

    return mergeDeep(userConfig, projectConfig);
}

/**
 * Deep merge two objects.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
