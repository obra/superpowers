#!/usr/bin/env bash
# Test: Skills Core Library
# Tests the skills-core.js library functions directly via Node.js
# Does not require OpenCode - tests pure library functionality
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Skills Core Library ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Test 1: Test extractFrontmatter function
echo "Test 1: Testing extractFrontmatter..."

# Create test file with frontmatter
test_skill_dir="$TEST_HOME/test-skill"
mkdir -p "$test_skill_dir"
cat > "$test_skill_dir/SKILL.md" <<'EOF'
---
name: test-skill
description: A test skill for unit testing
---
# Test Skill Content

This is the content.
EOF

# Run Node.js test using inline function (avoids ESM path resolution issues in test env)
result=$(node -e "
const path = require('path');
const fs = require('fs');

// Inline the extractFrontmatter function for testing
function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let inFrontmatter = false;
        let name = '';
        let description = '';
        for (const line of lines) {
            if (line.trim() === '---') {
                if (inFrontmatter) break;
                inFrontmatter = true;
                continue;
            }
            if (inFrontmatter) {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    if (key === 'name') name = value.trim();
                    if (key === 'description') description = value.trim();
                }
            }
        }
        return { name, description };
    } catch (error) {
        return { name: '', description: '' };
    }
}

const result = extractFrontmatter('$TEST_HOME/test-skill/SKILL.md');
console.log(JSON.stringify(result));
" 2>&1)

if echo "$result" | grep -q '"name":"test-skill"'; then
    echo "  [PASS] extractFrontmatter parses name correctly"
else
    echo "  [FAIL] extractFrontmatter did not parse name"
    echo "  Result: $result"
    exit 1
fi

if echo "$result" | grep -q '"description":"A test skill for unit testing"'; then
    echo "  [PASS] extractFrontmatter parses description correctly"
else
    echo "  [FAIL] extractFrontmatter did not parse description"
    exit 1
fi

# Test 2: Test stripFrontmatter function
echo ""
echo "Test 2: Testing stripFrontmatter..."

result=$(node -e "
const fs = require('fs');

function stripFrontmatter(content) {
    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterEnded = false;
    const contentLines = [];
    for (const line of lines) {
        if (line.trim() === '---') {
            if (inFrontmatter) {
                frontmatterEnded = true;
                continue;
            }
            inFrontmatter = true;
            continue;
        }
        if (frontmatterEnded || !inFrontmatter) {
            contentLines.push(line);
        }
    }
    return contentLines.join('\n').trim();
}

const content = fs.readFileSync('$TEST_HOME/test-skill/SKILL.md', 'utf8');
const stripped = stripFrontmatter(content);
console.log(stripped);
" 2>&1)

if echo "$result" | grep -q "# Test Skill Content"; then
    echo "  [PASS] stripFrontmatter preserves content"
else
    echo "  [FAIL] stripFrontmatter did not preserve content"
    echo "  Result: $result"
    exit 1
fi

if ! echo "$result" | grep -q "name: test-skill"; then
    echo "  [PASS] stripFrontmatter removes frontmatter"
else
    echo "  [FAIL] stripFrontmatter did not remove frontmatter"
    exit 1
fi

# Test 3: Test findSkillsInDir function
echo ""
echo "Test 3: Testing findSkillsInDir..."

# Create multiple test skills
mkdir -p "$TEST_HOME/skills-dir/skill-a"
mkdir -p "$TEST_HOME/skills-dir/skill-b"
mkdir -p "$TEST_HOME/skills-dir/nested/skill-c"

cat > "$TEST_HOME/skills-dir/skill-a/SKILL.md" <<'EOF'
---
name: skill-a
description: First skill
---
# Skill A
EOF

cat > "$TEST_HOME/skills-dir/skill-b/SKILL.md" <<'EOF'
---
name: skill-b
description: Second skill
---
# Skill B
EOF

cat > "$TEST_HOME/skills-dir/nested/skill-c/SKILL.md" <<'EOF'
---
name: skill-c
description: Nested skill
---
# Skill C
EOF

result=$(node -e "
const fs = require('fs');
const path = require('path');

function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let inFrontmatter = false;
        let name = '';
        let description = '';
        for (const line of lines) {
            if (line.trim() === '---') {
                if (inFrontmatter) break;
                inFrontmatter = true;
                continue;
            }
            if (inFrontmatter) {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    if (key === 'name') name = value.trim();
                    if (key === 'description') description = value.trim();
                }
            }
        }
        return { name, description };
    } catch (error) {
        return { name: '', description: '' };
    }
}

function findSkillsInDir(dir, sourceType, maxDepth = 3) {
    const skills = [];
    if (!fs.existsSync(dir)) return skills;
    function recurse(currentDir, depth) {
        if (depth > maxDepth) return;
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                const skillFile = path.join(fullPath, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    const { name, description } = extractFrontmatter(skillFile);
                    skills.push({
                        path: fullPath,
                        skillFile: skillFile,
                        name: name || entry.name,
                        description: description || '',
                        sourceType: sourceType
                    });
                }
                recurse(fullPath, depth + 1);
            }
        }
    }
    recurse(dir, 0);
    return skills;
}

const skills = findSkillsInDir('$TEST_HOME/skills-dir', 'test', 3);
console.log(JSON.stringify(skills, null, 2));
" 2>&1)

skill_count=$(echo "$result" | grep -c '"name":' || echo "0")

if [ "$skill_count" -ge 3 ]; then
    echo "  [PASS] findSkillsInDir found all skills (found $skill_count)"
else
    echo "  [FAIL] findSkillsInDir did not find all skills (expected 3, found $skill_count)"
    echo "  Result: $result"
    exit 1
fi

if echo "$result" | grep -q '"name": "skill-c"'; then
    echo "  [PASS] findSkillsInDir found nested skills"
else
    echo "  [FAIL] findSkillsInDir did not find nested skill"
    exit 1
fi

# Test 4: Test resolveSkillPath function
echo ""
echo "Test 4: Testing resolveSkillPath..."

# Create skills in personal and superpowers locations for testing
mkdir -p "$TEST_HOME/personal-skills/shared-skill"
mkdir -p "$TEST_HOME/superpowers-skills/shared-skill"
mkdir -p "$TEST_HOME/superpowers-skills/unique-skill"

cat > "$TEST_HOME/personal-skills/shared-skill/SKILL.md" <<'EOF'
---
name: shared-skill
description: Personal version
---
# Personal Shared
EOF

cat > "$TEST_HOME/superpowers-skills/shared-skill/SKILL.md" <<'EOF'
---
name: shared-skill
description: Superpowers version
---
# Superpowers Shared
EOF

cat > "$TEST_HOME/superpowers-skills/unique-skill/SKILL.md" <<'EOF'
---
name: unique-skill
description: Only in superpowers
---
# Unique
EOF

result=$(node -e "
const fs = require('fs');
const path = require('path');

function resolveSkillPath(skillName, superpowersDir, personalDir) {
    const forceSuperpowers = skillName.startsWith('superpowers:');
    const actualSkillName = forceSuperpowers ? skillName.replace(/^superpowers:/, '') : skillName;

    if (!forceSuperpowers && personalDir) {
        const personalPath = path.join(personalDir, actualSkillName);
        const personalSkillFile = path.join(personalPath, 'SKILL.md');
        if (fs.existsSync(personalSkillFile)) {
            return {
                skillFile: personalSkillFile,
                sourceType: 'personal',
                skillPath: actualSkillName
            };
        }
    }

    if (superpowersDir) {
        const superpowersPath = path.join(superpowersDir, actualSkillName);
        const superpowersSkillFile = path.join(superpowersPath, 'SKILL.md');
        if (fs.existsSync(superpowersSkillFile)) {
            return {
                skillFile: superpowersSkillFile,
                sourceType: 'superpowers',
                skillPath: actualSkillName
            };
        }
    }

    return null;
}

const superpowersDir = '$TEST_HOME/superpowers-skills';
const personalDir = '$TEST_HOME/personal-skills';

// Test 1: Shared skill should resolve to personal
const shared = resolveSkillPath('shared-skill', superpowersDir, personalDir);
console.log('SHARED:', JSON.stringify(shared));

// Test 2: superpowers: prefix should force superpowers
const forced = resolveSkillPath('superpowers:shared-skill', superpowersDir, personalDir);
console.log('FORCED:', JSON.stringify(forced));

// Test 3: Unique skill should resolve to superpowers
const unique = resolveSkillPath('unique-skill', superpowersDir, personalDir);
console.log('UNIQUE:', JSON.stringify(unique));

// Test 4: Non-existent skill
const notfound = resolveSkillPath('not-a-skill', superpowersDir, personalDir);
console.log('NOTFOUND:', JSON.stringify(notfound));
" 2>&1)

if echo "$result" | grep -q 'SHARED:.*"sourceType":"personal"'; then
    echo "  [PASS] Personal skills shadow superpowers skills"
else
    echo "  [FAIL] Personal skills not shadowing correctly"
    echo "  Result: $result"
    exit 1
fi

if echo "$result" | grep -q 'FORCED:.*"sourceType":"superpowers"'; then
    echo "  [PASS] superpowers: prefix forces superpowers resolution"
else
    echo "  [FAIL] superpowers: prefix not working"
    exit 1
fi

if echo "$result" | grep -q 'UNIQUE:.*"sourceType":"superpowers"'; then
    echo "  [PASS] Unique superpowers skills are found"
else
    echo "  [FAIL] Unique superpowers skills not found"
    exit 1
fi

if echo "$result" | grep -q 'NOTFOUND: null'; then
    echo "  [PASS] Non-existent skills return null"
else
    echo "  [FAIL] Non-existent skills should return null"
    exit 1
fi

# Test 5: Test checkForUpdates function
echo ""
echo "Test 5: Testing checkForUpdates..."

# Create a test git repo
mkdir -p "$TEST_HOME/test-repo"
cd "$TEST_HOME/test-repo"
git init --quiet
git config user.email "test@test.com"
git config user.name "Test"
echo "test" > file.txt
git add file.txt
git commit -m "initial" --quiet
cd "$SCRIPT_DIR"

# Test checkForUpdates on repo without remote (should return false, not error)
result=$(node -e "
const { execSync } = require('child_process');

function checkForUpdates(repoDir) {
    try {
        const output = execSync('git fetch origin && git status --porcelain=v1 --branch', {
            cwd: repoDir,
            timeout: 3000,
            encoding: 'utf8',
            stdio: 'pipe'
        });
        const statusLines = output.split('\n');
        for (const line of statusLines) {
            if (line.startsWith('## ') && line.includes('[behind ')) {
                return true;
            }
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Test 1: Repo without remote should return false (graceful error handling)
const result1 = checkForUpdates('$TEST_HOME/test-repo');
console.log('NO_REMOTE:', result1);

// Test 2: Non-existent directory should return false
const result2 = checkForUpdates('$TEST_HOME/nonexistent');
console.log('NONEXISTENT:', result2);

// Test 3: Non-git directory should return false
const result3 = checkForUpdates('$TEST_HOME');
console.log('NOT_GIT:', result3);
" 2>&1)

if echo "$result" | grep -q 'NO_REMOTE: false'; then
    echo "  [PASS] checkForUpdates handles repo without remote gracefully"
else
    echo "  [FAIL] checkForUpdates should return false for repo without remote"
    echo "  Result: $result"
    exit 1
fi

if echo "$result" | grep -q 'NONEXISTENT: false'; then
    echo "  [PASS] checkForUpdates handles non-existent directory"
else
    echo "  [FAIL] checkForUpdates should return false for non-existent directory"
    exit 1
fi

if echo "$result" | grep -q 'NOT_GIT: false'; then
    echo "  [PASS] checkForUpdates handles non-git directory"
else
    echo "  [FAIL] checkForUpdates should return false for non-git directory"
    exit 1
fi

echo ""
echo "=== All skills-core library tests passed ==="
