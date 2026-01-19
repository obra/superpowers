# Superpowers Installation Guide for CodeBuddy

## Quick Install (One-Command)

Tell CodeBuddy in Craft mode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/binbinao/superpowers/refs/heads/main/.codebuddy/INSTALL.md
```

Or run these commands in your terminal:

```bash
# Clone superpowers
mkdir -p ~/.codebuddy
git clone https://github.com/binbinao/superpowers.git ~/.codebuddy/superpowers

# Install MCP server dependencies
cd ~/.codebuddy/superpowers/.codebuddy/mcp-server
npm install

# Verify installation
node test.js
```

## Manual Installation

### Step 1: Clone Repository

```bash
mkdir -p ~/.codebuddy
git clone https://github.com/binbinao/superpowers.git ~/.codebuddy/superpowers
cd ~/.codebuddy/superpowers
```

### Step 2: Install Dependencies

```bash
cd .codebuddy/mcp-server
npm install
```

### Step 3: Configure MCP in CodeBuddy

#### For VS Code Plugin:

1. Open VS Code with CodeBuddy plugin installed
2. Click CodeBuddy icon in the sidebar
3. Select **Craft** mode
4. Click **MCP** option
5. Click **Add MCP Server** or **Configure**
6. Add new server with these settings:

**Method A: Using npx (Easiest)**

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "github.com/binbinao/superpowers#main/.codebuddy/mcp-server"
  ],
  "disabled": false
}
```

**Method B: Using local installation**

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": ["/Users/YOUR_HOME/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"],
  "disabled": false
}
```

Replace `/Users/YOUR_HOME` with your actual home directory (run `echo ~` to see it).

#### For JetBrains Plugin:

1. Open CodeBuddy settings in your JetBrains IDE
2. Navigate to **MCP Configuration**
3. Add new server with same settings as above

#### For Internal Version:

The internal version of CodeBuddy supports additional configuration options:

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": ["/Users/YOUR_HOME/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"],
  "disabled": false,
  "configSource": "user",
  "timeout": 60
}
```

### Step 4: Restart CodeBuddy

Restart CodeBuddy to load the MCP server.

### Step 5: Verify Installation

In CodeBuddy Craft mode, ask:

```
Use find_skills tool to list all available superpowers skills
```

You should see a list of available skills.

## Verification

Run the test suite:

```bash
cd ~/.codebuddy/superpowers/.codebuddy/mcp-server
node test.js
```

All tests should pass with ✓ marks.

## Usage Examples

### Load a Skill

```
Use use_skill tool with skill_name: "superpowers:brainstorming"
```

### Find Available Skills

```
Use find_skills tool
```

### Get Bootstrap

```
Use get_bootstrap tool
```

## Creating Personal Skills

Create your own skills in `~/.config/codebuddy/skills/`:

```bash
mkdir -p ~/.config/codebuddy/skills/my-skill
cat > ~/.config/codebuddy/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
EOF
```

Then use it: `use_skill tool with skill_name: "my-skill"`

## Creating Project Skills

For project-specific skills, create them in your project directory:

```bash
mkdir -p .codebuddy/skills/my-project-skill
cat > .codebuddy/skills/my-project-skill/SKILL.md << 'EOF'
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
EOF
```

Then use: `use_skill tool with skill_name: "project:my-project-skill"`

## Skill Priority

When you use `use_skill` with a skill name:

1. **Project skills** (`.codebuddy/skills/`) - Checked first
2. **Personal skills** (`~/.config/codebuddy/skills/`) - Checked second
3. **Superpowers skills** (`~/.codebuddy/superpowers/skills/`) - Checked last

Force specific skill type:
- `project:skill-name` - Only check project skills
- `skill-name` - Check project → personal → superpowers
- `superpowers:skill-name` - Only check superpowers skills

## Troubleshooting

### Installation Fails

```bash
# Check Node.js version
node --version  # Should be 18+

# Verify git clone worked
ls ~/.codebuddy/superpowers

# Check npm install worked
ls ~/.codebuddy/superpowers/.codebuddy/mcp-server/node_modules
```

### MCP Server Won't Start

```bash
# Test manually
node ~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js

# Check for errors
# Should see: "Superpowers MCP server running on stdio"
```

### Skills Not Found

```bash
# Run test to verify skills discovery
cd ~/.codebuddy/superpowers/.codebuddy/mcp-server
node test.js

# Should show "Found XX skills"
```

### CodeBuddy Can't Connect to MCP

1. Check CodeBuddy version (requires recent version with MCP support)
2. Verify MCP configuration file syntax is correct JSON
3. Check file paths are absolute (not relative)
4. Enable debug logging in CodeBuddy to see error messages
5. Try disabling and re-enabling the MCP server

## Next Steps

- Read full documentation: [docs/README.codebuddy.md](../docs/README.codebuddy.md)
- Learn skill development: [skills/writing-skills/SKILL.md](../skills/writing-skills/SKILL.md)
- Browse available skills: [skills/](../skills/)
- Report issues: [https://github.com/binbinao/superpowers/issues](https://github.com/binbinao/superpowers/issues)

## Uninstallation

```bash
# Remove the superpowers repository
rm -rf ~/.codebuddy/superpowers

# Remove MCP configuration from CodeBuddy settings
# (Go to CodeBuddy MCP settings and delete superpowers server)
```

Your personal and project skills in `~/.config/codebuddy/skills/` and `.codebuddy/skills/` will remain unless you delete them.

## Support

- **Issues**: https://github.com/binbinao/superpowers/issues
- **CodeBuddy Docs**: https://cloud.tencent.com/document/product/1749
- **CodeBuddy MCP Guide**: https://cloud.tencent.com/developer/article/2526313
