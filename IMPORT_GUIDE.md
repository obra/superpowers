# Claude Skills Import Guide

Complete guide for importing, managing, and sharing Claude skills from external Git repositories.

## 🎯 **Quick Start - Import Any Skill**

### **Import a skill from GitHub**
```bash
cd claude-code-skills-factory/scripts
python import_skill.py https://github.com/user/awesome-skill.git
```

This automatically:
- ✅ Clones the repository
- 🔍 Validates skill structure
- 📂 Installs to your `skills/` directory
- 📦 Creates ZIP for Desktop import

## 🚀 **Import Methods**

### **Method 1: Automatic Import Tool (Recommended)**
```bash
# Basic import (auto-naming)
python import_skill.py https://github.com/user/pdf-processor.git

# Custom naming
python import_skill.py https://github.com/user/pdf-processor.git "my-custom-pdf-tool"

# List available skills
python import_skill.py list
```

### **Method 2: Manual Git Clone**
```bash
# Navigate to skills directory
cd skills

# Clone any Git repository
git clone https://github.com/user/external-skill.git my-skill-name

# Import to factory system (optional)
cd ../claude-code-skills-factory/scripts
python import_skill.py ../skills/my-skill-name
```

### **Method 3: Direct Download**
```bash
# Download ZIP from GitHub
curl -L https://github.com/user/skill-repo/archive/main.zip -o skill.zip

# Extract to skills directory
unzip skill.zip -d skills/
mv skills/skill-repo-main skills/my-skill-name
```

## 🔍 **Finding Claude Skills Online**

### **Search Strategies**
- **GitHub Search**: `"claude skill"`, `"anthropic skill"`, `"claude-code skill"`
- **Topics**: Look for repositories tagged with `claude-ai`, `anthropic-claude`, `claude-skills`
- **Organizations**: Watch for skill hubs and community collections

### **Popular Skill Categories**

| Category | Use Case | Search Terms |
|----------|----------|--------------|
| **Document Processing** | PDF, DOCX, OCR | `pdf claude skill`, `document processing ai` |
| **Data Analysis** | CSV, Excel, JSON | `data analysis skill`, `csv processor claude` |
| **Web Automation** | Scraping, APIs | `web scraper skill`, `api integration claude` |
| **Creative Tools** | Art, content, media | `creative skill claude`, `content generator ai` |
| **Business Tools** | Reports, automation | `business automation`, `workflow claude skill` |

### **Skill Discovery Commands**
```bash
# Check the provided skills list
python import_skill.py list

# GitHub CLI search (if available)
gh search repos --topic claude-skills --topic anthropic

# Browser search
open "https://github.com/search?q=claude+skill&type=repositories"
```

## ⚙️ **Import Tool Features**

### **Automatic Validation**
- ✅ **SKILL.md structure** - Verifies YAML frontmatter and required fields
- ✅ **File integrity** - Checks for proper skill components
- ✅ **Naming conventions** - Generates proper kebab-case directory names
- ✅ **ZIP creation** - Automatically packages for Desktop import

### **Customization Options**
- 🎨 **Custom naming** - Override auto-generated skill names
- 📝 **Metadata updates** - Modify skill descriptions during import
- 🔄 **Overwrite protection** - Warns before replacing existing skills

### **Security Features**
- 🛡️ **Repository validation** - Ensures proper skill structure
- 🔒 **Isolated execution** - Imports run in temporary directories
- ⚠️ **Trust warnings** - Prompts for third-party skill verification

## 📋 **Import Workflow**

### **Step-by-Step Process**

1. **Find a Skill**
   ```bash
   # Search for skills
   python import_skill.py list
   ```

2. **Import the Skill**
   ```bash
   python import_skill.py https://github.com/example/skill-repo.git
   ```

3. **Verify Installation**
   ```bash
   # Check skills directory
   ls -la ../skills/
   ```

4. **Use in Claude Code**
   ```
   Hey Claude, use the [skill-name] skill to [task]
   ```

5. **Deploy to Desktop**
   ```bash
   # Find the generated ZIP file
   ls ../skills/[skill-name]/*.zip
   # Import via Claude Desktop
   ```

## 🔧 **Advanced Import Options**

### **Import with Custom Settings**
```bash
# Import with specific name and description
python import_skill.py \
  https://github.com/user/skill.git \
  "my-custom-skill-name"

# Force refresh existing skill
# (Tool automatically handles overwrites)
```

### **Batch Import Multiple Skills**
```bash
#!/bin/bash
# batch_import.sh
SKILLS=(
    "https://github.com/user/pdf-skill.git"
    "https://github.com/user/api-tool.git"
    "https://github.com/user/data-processor.git"
)

for skill_url in "${SKILLS[@]}"; do
    echo "Importing: $skill_url"
    python import_skill.py "$skill_url"
done
```

### **Import with Git Submodules**
```bash
# Add as git submodule (advanced)
cd skills
git submodule add https://github.com/user/external-skill.git external-skill-name
git submodule update --init --recursive

# Then register with factory
cd ../claude-code-skills-factory/scripts
python import_skill.py ../skills/external-skill-name
```

## 🛡️ **Security & Trust Considerations**

### **Verify Before Import**
```bash
# Always inspect before importing
python import_skill.py https://github.com/suspicious/repo.git --dry-run

# Check skill metadata
cat skills/imported-skill/SKILL.md | head -10

# Review permissions
grep "allowed-tools:" skills/imported-skill/SKILL.md
```

### **Risk Assessment**
- 🔴 **High Risk**: Skills requiring full `allowed-tools: [Bash, Read, Write, Run]`
- 🟡 **Medium Risk**: API-only skills with `allowed-tools: [API]`
- 🟢 **Low Risk**: Skills with no external dependencies

### **Sandbox Testing**
```bash
# Test in isolated environment first
mkdir test-skills
cd test-skills
git clone https://github.com/user/new-skill.git
# Test functionality here before production import
```

## 🌐 **Skill Sharing & Distribution**

### **Share Your Skills**
```bash
# Package skill for sharing
cd skills/my-skill
zip -r my-skill.zip .

# Create Git repository
git init
git add .
git commit -m "Initial skill commit"
# Push to GitHub or other Git hosting
```

### **Skill Repository Structure**
```
my-claude-skill/
├── SKILL.md           # Required: Skill definition
├── scripts/           # Optional: Python implementations
├── data/             # Optional: Sample data files
├── README.md         # Optional: Detailed documentation
├── LICENSE           # Optional: License information
└── .gitignore       # Optional: Git ignore rules
```

### **Publishing Checklist**
- ✅ Valid SKILL.md with proper YAML frontmatter
- ✅ Functional implementation and testing
- ✅ Clear documentation and examples
- ✅ Appropriate license (MIT, Apache, etc.)
- ✅ Repository tags: `claude-skill`, `anthropic`, etc.

## 🐛 **Troubleshooting Imports**

### **Common Issues & Solutions**

| Problem | Solution |
|---------|----------|
| **Repository not found** | Verify Git URL is correct and public |
| **SKILL.md missing** | Repository may not contain a valid skill |
| **Permission denied** | Check Git credentials or repository access |
| **Import validation failed** | Review SKILL.md YAML syntax and required fields |

### **Debug Mode**
```bash
# Enable verbose import logging
export CLAUDE_SKILLS_DEBUG=true
python import_skill.py <url> 2>&1 | tee import_log.txt
```

### **Manual Recovery**
```bash
# Clean failed imports
rm -rf skills/temp-*
rm -rf skills/*-skill/ # Only if import failed

# Reset factory state
cd claude-code-skills-factory/scripts
git checkout -- import_skill.py # If modified
```

## 📚 **Skill Registry & Discovery**

### **Community Skill Hubs**
- **Official Anthropic**: `github.com/anthropic/claude-skills`
- **Community Collections**: Search GitHub for "claude skill collection"
- **Organization Hubs**: Company-internal skill repositories

### **Skill Categories & Tags**
- `#document-processing` - PDF, DOCX, text manipulation
- `#data-analysis` - CSV, Excel, statistical operations
- `#api-integration` - External service connections
- `#automation` - Workflow and process automation
- `#creative` - Art, content, and media generation
- `#business-tools` - Reports, analytics, business logic

### **Quality Indicators**
- ⭐ **Stars** - Community approval
- 🍴 **Forks** - Active development
- 📅 **Last Updated** - Maintenance status
- 🐛 **Issues/PRs** - Active community engagement
- 📖 **Documentation** - Quality of instructions

## 🎯 **Best Practices**

### **For Skill Consumers (Importers)**
1. **Verify source reputation** - Prefer well-known contributors
2. **Review allowed-tools** - Understand security implications
3. **Test in isolation** - Try new skills in separate environments
4. **Keep backups** - Version control your skills directory
5. **Monitor updates** - Check for security updates regularly

### **For Skill Creators (Publishers)**
1. **Clear documentation** - Detailed README and SKILL.md
2. **Security-conscious** - Minimal required permissions
3. **Test thoroughly** - Include sample usages and edge cases
4. **Open source friendly** - Use permissive licenses
5. **Community engagement** - Respond to issues and PRs

### **For Skill Sharing**
1. **Use semantic versioning** - `v1.0.0`, `v1.1.0`, etc.
2. **Clear changelog** - Document changes between versions
3. **Backward compatibility** - Don't break existing functionality
4. **Dependency management** - Specify required tools/libraries
5. **Cross-platform testing** - Verify on Claude Code and Desktop

---

## 🔗 **Integration Examples**

### **Claude Code Integration**
```bash
# Import and use immediately
python import_skill.py https://github.com/example/pdf-skill.git

# Then use naturally
"Hey Claude, use the pdf-skill to extract text from this document"
```

### **Agent Workflow Integration**
```javascript
// Load external skills into agent
const skillContent = require('child_process')
  .execSync('python import_skill.py https://github.com/example/skill.git')
  .toString();

// Parse and integrate into agent capabilities
const skills = parseImportedSkills(skillContent);
```

### **CI/CD Pipeline Integration**
```yaml
# GitHub Actions workflow
- name: Import Latest Skills
  run: |
    cd claude-code-skills-factory/scripts
    python import_skill.py https://github.com/company/skills-repo.git
```

---

*This guide provides comprehensive coverage for importing, managing, and sharing Claude skills across the ecosystem. Start with the quick import tool, then explore advanced options based on your needs.*
