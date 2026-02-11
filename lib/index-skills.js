import { findSkillsInDir } from './skills-core.js';

/**
 * Index all skills in a directory, extracting metadata including semantic tags.
 * 
 * @param {string} dir - Directory to scan for skills
 * @returns {Array} - Array of indexed skill objects
 */
export function indexSkills(dir, namespace = 'superpowers') {
    return findSkillsInDir(dir, namespace);
}
