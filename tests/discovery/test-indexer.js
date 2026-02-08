import assert from 'assert';
import { indexSkills } from '../../lib/index-skills.js';
import fs from 'fs';

// Setup mock skills directory
const mockDir = './tests/mock-skills';
if (!fs.existsSync(`${mockDir}/test-skill`)) fs.mkdirSync(`${mockDir}/test-skill`, { recursive: true });
fs.writeFileSync(`${mockDir}/test-skill/SKILL.md`, '---\nname: test\ndescription: A test skill\nsemantic_tags: [test, mock]\n---\nBody');

try {
    const index = indexSkills(mockDir);
    assert.strictEqual(index[0].name, 'test');
    assert.deepStrictEqual(index[0].semantic_tags, ['test', 'mock']);
    console.log("PASS");
} catch (e) {
    console.error("FAIL", e.message);
    process.exit(1);
}
