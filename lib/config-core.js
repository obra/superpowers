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

    // Default configuration structure
    const defaultConfig = {
        project_management: {
            provider: "local", // "jira", "notion", "trello", "local"
            jira: {
                host: "",
                email: "",
                api_token: "",
                project_key: ""
            },
            notion: {
                api_key: "",
                database_id: "",
                root_page_id: "",
                map_database_id: "" // For file path mapping
            },
            local: {
                todo_file: "TODO.md"
            }
        },
        documentation: {
             root_dir: "docs",
             notion_root_page_id: ""
        }
    };

    let userConfig = {};
    let projectConfig = {};

    if (fs.existsSync(userConfigPath)) {
        try {
            userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Failed to parse user config at ${userConfigPath}: ${error.message}`);
        }
    }
    if (!isObject(userConfig)) {
        console.warn(`Warning: User config at ${userConfigPath} must be an object; ignoring.`);
        userConfig = {};
    }

    if (fs.existsSync(projectConfigPath)) {
        try {
            projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Failed to parse project config at ${projectConfigPath}: ${error.message}`);
        }
    }
    if (!isObject(projectConfig)) {
        console.warn(`Warning: Project config at ${projectConfigPath} must be an object; ignoring.`);
        projectConfig = {};
    }

    // Merge default -> user -> project
    const mergedUser = mergeDeep(defaultConfig, userConfig);
    return mergeDeep(mergedUser, projectConfig);
}

/**
 * Deep merge two objects.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
        const output = Object.assign({}, target);
        Object.keys(source).forEach(key => {
            // Skip prototype pollution vectors
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                return;
            }
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
        return output;
    }
    // If not both objects, source wins.
    // If source is an object, return a shallow clone to avoid mutation issues,
    // although for config loading it might not matter much.
    if (isObject(source)) {
        return Object.assign({}, source);
    }
    return source;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
