# Skill Discovery and Subagent Coordination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement semantic skill discovery and git-notes based subagent coordination.

**Architecture:** We will build a CLI-driven indexer for semantic discovery and a git-notes backed state manager for cross-worktree subagent coordination. This ensures metadata-rich skill selection and collision-free parallel task state.

**Tech Stack:** Node.js, Git (Notes), JSON.

---

### Task 1: Skill Indexer

**Files:**
- Create: `lib/index-skills.js`
- Modify: `lib/skills-core.js`

**Step 1: Write the failing test**
Create `tests/discovery/test-indexer.js`.

```javascript
import assert from 'assert';
import { indexSkills } from '../lib/index-skills.js';
import fs from 'fs';

// Setup mock skills directory
const mockDir = './tests/mock-skills';
if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir, { recursive: true });
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
```

**Step 2: Run test to verify it fails**
Run: `node tests/discovery/test-indexer.js`
Expected: FAIL (module not found)

**Step 3: Implement `indexSkills` in `lib/index-skills.js`**

```javascript
import fs from 'fs';
import path from 'path';
import { extractFrontmatter, findSkillsInDir } from './skills-core.js';

export function indexSkills(dir) {
    const skills = findSkillsInDir(dir, 'superpowers');
    return skills.map(skill => {
        const content = fs.readFileSync(skill.skillFile, 'utf8');
        // Enhance extractFrontmatter or parse here
        const match = content.match(/semantic_tags:\s*\[(.*?)\]/);
        const tags = match ? match[1].split(',').map(t => t.trim()) : [];
        return { ...skill, semantic_tags: tags };
    });
}
```

**Step 4: Update `lib/skills-core.js` if needed to support `semantic_tags`**

**Step 5: Run test to verify it passes**
Run: `node tests/discovery/test-indexer.js`
Expected: PASS

**Step 6: Commit**
```bash
git add lib/index-skills.js tests/discovery/test-indexer.js
git commit -m "feat: add skill indexer for semantic discovery"
```

---

### Task 2: Git Notes State Manager

**Files:**
- Create: `lib/git-notes-state.js`

**Step 1: Write the failing test**
Create `tests/coordination/test-git-notes.js`.

```javascript
import assert from 'assert';
import { updateState, getState } from '../lib/git-notes-state.js';

try {
    const testData = { task: "T1", status: "done" };
    updateState(testData);
    const state = getState();
    assert.deepStrictEqual(state.task, "T1");
    console.log("PASS");
} catch (e) {
    console.error("FAIL", e.message);
    process.exit(1);
}
```

**Step 2: Run test to verify it fails**
Run: `node tests/coordination/test-git-notes.js`
Expected: FAIL

**Step 3: Implement `lib/git-notes-state.js`**

```javascript
import { execSync } from 'child_process';

const REF = 'refs/notes/superpowers';

export function getState() {
    try {
        const output = execSync(`git notes --ref ${REF} show`, { stdio: 'pipe' }).toString();
        return JSON.parse(output);
    } catch (e) {
        return {};
    }
}

export function updateState(newData) {
    const currentState = getState();
    const newState = { ...currentState, ...newData };
    const json = JSON.stringify(newState);
    // Use 'add -f' to overwrite existing note
    execSync(`git notes --ref ${REF} add -f -m '${json.replace(/'/g, "'\\''")}'`);
}
```

**Step 4: Run test to verify it passes**
Run: `node tests/coordination/test-git-notes.js`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/git-notes-state.js tests/coordination/test-git-notes.js
git commit -m "feat: add git-notes state manager for subagent coordination"
```

---

### Task 3: Integrate with Subagent Workflow

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Step 1: Update the skill description and process**
Update the frontmatter to include coordination instructions.

**Step 2: Add specific steps to the DOT flowchart**
Add nodes for "Read shared state from git notes" and "Update findings in git notes".

**Step 3: Commit**
```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: integrate git-notes coordination into subagent-driven-development"
```
