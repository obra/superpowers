# Complete Setup Guide - Superpowers Skills

This guide covers how to load and auto-update the superpowers skills across all Claude platforms.

---

## 📋 Table of Contents

1. [Claude Code Setup](#1-claude-code-setup)
2. [Claude Desktop Setup](#2-claude-desktop-setup)
3. [Claude API Setup](#3-claude-api-setup)
4. [Auto-Update Setup](#4-auto-update-setup)

---

## 1. Claude Code Setup

### Option A: Via Plugin Marketplace (Recommended - Auto-Updates)

```bash
# In Claude Code terminal
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Auto-updates:** Yes! Updates automatically when you run `/plugin update superpowers`

### Option B: From Local Repository (Development)

```bash
# Clone this repository
cd ~/projects  # or wherever you keep projects
git clone https://github.com/ashleytower/superpowers.git

# Link to Claude Code
ln -s ~/projects/superpowers ~/.claude/plugins/superpowers
```

**Auto-updates:** Manual - run `git pull` in the superpowers directory

### Verify Installation

```bash
/help
# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

### Using Skills in Claude Code

Skills activate automatically when relevant, or you can invoke them:

```
Use the pdf-processor skill to extract text from document.pdf
```

---

## 2. Claude Desktop Setup

Claude Desktop requires importing skills individually via ZIP files.

### Manual Import (One-time per skill)

1. **Download or locate ZIP files:**
   ```bash
   # All ZIP files are in: skills/{skill-name}/{skill-name}-skill.zip
   ```

2. **Import into Claude Desktop:**
   - Open Claude Desktop
   - Go to **Profile → Skills → Import Skill**
   - Select a ZIP file (e.g., `skills/pdf-processor/pdf-processor-skill.zip`)
   - Repeat for each skill you want

3. **Available ZIP files (28 total):**
   ```
   skills/pdf-processor/pdf-processor-skill.zip
   skills/content-research-writer/content-research-writer-skill.zip
   skills/brand-guidelines/brand-guidelines-skill.zip
   skills/test-driven-development/test-driven-development-skill.zip
   ... (all 28 skills)
   ```

### Automated Import Script (Batch Import)

**For macOS/Linux:**

```bash
#!/bin/bash
# batch-import-to-desktop.sh

SKILLS_DIR="$HOME/projects/superpowers/skills"

for zip_file in "$SKILLS_DIR"/*/*.zip; do
    echo "Import this file into Claude Desktop:"
    echo "  $zip_file"
    echo "Press Enter when done..."
    read
done
```

**Note:** Claude Desktop doesn't have CLI import yet, so this script helps you batch process manually.

### Auto-Update for Claude Desktop

**When skills are updated:**

1. Pull latest changes:
   ```bash
   cd ~/projects/superpowers
   git pull
   ```

2. Re-import updated skills:
   - Check RELEASE-NOTES.md for which skills changed
   - Re-import those ZIP files via Profile → Skills → Import Skill

**Future:** Watch for Claude Desktop CLI/API support for automated imports.

---

## 3. Claude API Setup

For applications using the Claude API (Python, TypeScript, etc.)

### Python Example

**Install Anthropic SDK:**
```bash
pip install anthropic
```

**Load and use skills:**

```python
from anthropic import Anthropic
import os
from pathlib import Path

class SkillLoader:
    def __init__(self, skills_dir: str = "~/projects/superpowers/skills"):
        self.skills_dir = Path(skills_dir).expanduser()

    def load_skill(self, skill_name: str) -> str:
        """Load a single skill by name."""
        skill_file = self.skills_dir / skill_name / "SKILL.md"

        if not skill_file.exists():
            raise FileNotFoundError(f"Skill not found: {skill_name}")

        return skill_file.read_text()

    def load_multiple(self, skill_names: list[str]) -> str:
        """Load multiple skills and combine them."""
        skills = []
        for name in skill_names:
            try:
                skills.append(self.load_skill(name))
            except FileNotFoundError:
                print(f"Warning: Skill '{name}' not found, skipping")

        return "\n\n---\n\n".join(skills)

    def list_available(self) -> list[str]:
        """List all available skills."""
        return [d.name for d in self.skills_dir.iterdir()
                if d.is_dir() and (d / "SKILL.md").exists()]

# Usage
loader = SkillLoader()

# Load single skill
pdf_skill = loader.load_skill("pdf-processor")

# Use with Claude API
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=f"{pdf_skill}\n\nUse this skill to complete the task.",
    messages=[{
        "role": "user",
        "content": "Extract text from invoice.pdf and organize it"
    }]
)

print(message.content)
```

**Load multiple skills:**

```python
# Load multiple skills for complex tasks
skills = loader.load_multiple([
    "pdf-processor",
    "invoice-organizer",
    "systematic-debugging"
])

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=f"{skills}\n\nUse these skills as needed.",
    messages=[{
        "role": "user",
        "content": "Process this invoice PDF and organize for tax filing"
    }]
)
```

### TypeScript Example

```typescript
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

class SkillLoader {
    private skillsDir: string;

    constructor(skillsDir: string = '~/projects/superpowers/skills') {
        this.skillsDir = skillsDir.replace('~', process.env.HOME || '');
    }

    loadSkill(skillName: string): string {
        const skillFile = path.join(this.skillsDir, skillName, 'SKILL.md');

        if (!fs.existsSync(skillFile)) {
            throw new Error(`Skill not found: ${skillName}`);
        }

        return fs.readFileSync(skillFile, 'utf-8');
    }

    loadMultiple(skillNames: string[]): string {
        return skillNames
            .map(name => this.loadSkill(name))
            .join('\n\n---\n\n');
    }
}

// Usage
const loader = new SkillLoader();
const skill = loader.loadSkill('pdf-processor');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: `${skill}\n\nUse this skill to complete the task.`,
    messages: [{
        role: 'user',
        content: 'Extract text from document.pdf'
    }]
});
```

### Auto-Update for Claude API Applications

**Method 1: Git Submodule (Recommended)**

```bash
# In your application repository
git submodule add https://github.com/ashleytower/superpowers.git skills

# Update skills
git submodule update --remote skills
```

**Method 2: Automated Pull Script**

```python
# update_skills.py
import subprocess
import os
from pathlib import Path

SKILLS_REPO = "~/projects/superpowers"

def update_skills():
    """Pull latest skills from git."""
    repo_path = Path(SKILLS_REPO).expanduser()

    if not repo_path.exists():
        print(f"Cloning skills repository...")
        subprocess.run([
            "git", "clone",
            "https://github.com/ashleytower/superpowers.git",
            str(repo_path)
        ])
    else:
        print(f"Updating skills repository...")
        subprocess.run(["git", "pull"], cwd=repo_path)

    print("✅ Skills updated!")

if __name__ == "__main__":
    update_skills()
```

**Run before deploying:**
```bash
python update_skills.py
```

**Method 3: Package Manager (Future)**

*Coming soon - npm/pip package for auto-updates*

---

## 4. Auto-Update Setup

### For Claude Code

**Manual updates:**
```bash
/plugin update superpowers
```

**Auto-update script (add to your shell profile):**

```bash
# ~/.bashrc or ~/.zshrc
alias update-claude-skills='cd ~/.claude/plugins/superpowers && git pull'
```

### For Claude Desktop

**Watch for updates:**

```bash
# setup-desktop-sync.sh
#!/bin/bash

SKILLS_DIR="$HOME/projects/superpowers"
LAST_UPDATE_FILE="$HOME/.claude-skills-last-update"

cd "$SKILLS_DIR"
git fetch

# Check if there are updates
if git status -uno | grep -q "behind"; then
    echo "🔔 New skills available!"
    git pull

    # Show what changed
    if [ -f "$LAST_UPDATE_FILE" ]; then
        LAST_COMMIT=$(cat "$LAST_UPDATE_FILE")
        echo "Changes:"
        git log --oneline "$LAST_COMMIT..HEAD"
    fi

    # Update last sync
    git rev-parse HEAD > "$LAST_UPDATE_FILE"

    echo ""
    echo "📦 Re-import updated skills in Claude Desktop:"
    echo "   Profile → Skills → Import Skill"
else
    echo "✅ Skills up to date"
fi
```

**Run weekly:**
```bash
chmod +x setup-desktop-sync.sh
./setup-desktop-sync.sh
```

### For Claude API Applications

**Option 1: Startup Check**

```python
# In your app's startup code
import subprocess
from pathlib import Path

def ensure_skills_updated():
    skills_path = Path("~/projects/superpowers").expanduser()

    if not skills_path.exists():
        subprocess.run([
            "git", "clone",
            "https://github.com/ashleytower/superpowers.git",
            str(skills_path)
        ])
    else:
        # Pull latest
        subprocess.run(["git", "pull"], cwd=skills_path, capture_output=True)

# Call on app startup
ensure_skills_updated()
```

**Option 2: Docker Image**

```dockerfile
# Dockerfile
FROM python:3.11

# Clone skills during build
RUN git clone https://github.com/ashleytower/superpowers.git /app/skills

WORKDIR /app
COPY . .

# Your app setup
RUN pip install -r requirements.txt

CMD ["python", "main.py"]
```

**Rebuild image to update skills:**
```bash
docker build --no-cache -t myapp .
```

**Option 3: Webhook Updates (Advanced)**

Set up GitHub webhook to trigger rebuild when skills repo updates:

```python
# webhook_handler.py
from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/webhook/skills-updated', methods=['POST'])
def skills_updated():
    # Verify GitHub webhook signature
    # ... security checks ...

    # Pull latest skills
    subprocess.run([
        "git", "pull"
    ], cwd="/app/skills")

    # Optionally: Restart application
    # subprocess.run(["systemctl", "restart", "myapp"])

    return {"status": "updated"}, 200
```

---

## 5. Monitoring Updates

### Using the Auto-Sync Skill

The repository includes an auto-sync system that monitors:
- Anthropic's official documentation
- Official skills repositories
- Best practices updates

**Manual check:**
```bash
cd ~/projects/superpowers
./scripts/auto-sync.sh
```

**Automated (GitHub Actions):**
- Runs every Monday at 9 AM UTC
- Creates issues when updates are detected
- Watch your GitHub repository for notifications

**Subscribe to updates:**
1. Watch the repository on GitHub
2. Enable notifications for Issues
3. Get notified when auto-sync finds updates

---

## 6. Best Practices

### Version Pinning (Production Apps)

For production applications, pin to specific versions:

```bash
# Use git tags/releases
cd ~/projects/superpowers
git checkout v4.0.0  # Pin to specific version
```

**In your code:**
```python
# config.py
SKILLS_VERSION = "v4.0.0"  # Update when tested

# In CI/CD
git clone --branch v4.0.0 https://github.com/ashleytower/superpowers.git
```

### Testing Updates

Before deploying skill updates:

1. **Pull to staging environment:**
   ```bash
   git pull
   ```

2. **Test critical skills:**
   ```bash
   # Run your test suite with new skills
   pytest tests/
   ```

3. **Review RELEASE-NOTES.md:**
   ```bash
   cat RELEASE-NOTES.md
   ```

4. **Deploy to production**

### Skill Selection

**Don't load ALL skills** - only load what you need:

```python
# Good - specific skills for your use case
needed_skills = [
    "pdf-processor",
    "systematic-debugging"
]

# Bad - loading everything (token overhead)
all_skills = loader.list_available()
```

---

## 7. Troubleshooting

### Skills Not Found

```bash
# Verify skills directory
ls ~/projects/superpowers/skills

# Check permissions
chmod -R 755 ~/projects/superpowers
```

### Git Pull Fails

```bash
# Reset to remote
cd ~/projects/superpowers
git fetch origin
git reset --hard origin/main
```

### Claude API Not Loading Skills

```python
# Debug: Print what's being loaded
skill_content = loader.load_skill("pdf-processor")
print(f"Loaded {len(skill_content)} characters")
print(skill_content[:200])  # First 200 chars
```

---

## 8. Quick Reference

| Platform | Install Method | Auto-Update | Command |
|----------|---------------|-------------|---------|
| **Claude Code** | Plugin marketplace | Yes | `/plugin update superpowers` |
| **Claude Desktop** | Import ZIP files | Manual | Re-import ZIPs after git pull |
| **Claude API** | Load SKILL.md files | Git pull | `git pull` in skills directory |

---

## Need Help?

- **Issues**: https://github.com/ashleytower/superpowers/issues
- **Documentation**: See USAGE_GUIDE.md
- **Examples**: See examples/ directory

---

**Built with ❤️ for the Claude community**
