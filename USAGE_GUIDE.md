# Claude Skills Usage Guide

Complete deployment instructions for Claude skills across all platforms: **Claude Code**, **Claude Desktop**, and **Custom Agents**.

## 📊 Deployment Overview

| Platform | Method | Access | Deployment |
|----------|---------|---------|-----------|
| **Claude Code** | Local directory | `skills/` folder | Automatic |
| **Claude Desktop** | ZIP import | Browser interface | Manual |
| **Custom Agents** | API integration | Code/webhooks | Programmatic |

---

# 🛠 Claude Code - Automatic Deployment

**Best for development and testing**. Skills in the `skills/` directory are automatically available.

## Directory Structure
```
project/
├── skills/           # ← Skills go here
│   ├── pdf-processor/
│   │   └── SKILL.md
│   └── api-client/
│       ├── SKILL.md
│       └── scripts/
├── claude_code_skills_instructions.md
└── your-code/
```

## How to Use Skills in Claude Code

### 1. Place Skills in Projects
```bash
# Initialize a new skill
cd claude-code-skills-factory/scripts
python init.py "PDF Form Filler" "Automatically fill PDF forms"

# This creates: ../skills/pdf-form-filler/
```

### 2. Skills Become Available Automatically
Once placed in `skills/`, Claude Code immediately recognizes and can use them:

```
Hey Claude, I need to fill a PDF form using the pdf-form-filler skill.
```

### 3. Skill Metadata Controls Access
The `allowed-tools:` in SKILL.md controls what Claude can do:
```yaml
allowed-tools:
  - Bash      # Run terminal commands
  - Read      # Read files
  - Write     # Edit/create files
  - Run       # Execute code
```

### 4. Context-Aware Activation
Skills activate when users mention the skill name or describe relevant tasks:
- "Use the pdf-processor skill..."
- "I need to download YouTube transcripts..."
- "Process this CSV with the data-analyzer..."

---

# 🖥 Claude Desktop - Manual Import

**Best for end users and production use**. Import via web interface.

## ZIP File Preparation

Each skill folder contains a `{skill-name}-skill.zip` file with just the SKILL.md.

## Import Process

### 1. Access Import Interface
1. Open Claude Desktop
2. Click your profile (top right)
3. Select "Skills" from the menu
4. Click "Import Skill"

### 2. Upload ZIP File
- Select the `{skill-name}-skill.zip` file
- Click "Import"
- Skill becomes immediately available

### 3. Skill appears in your skill list
- Name: Taken from SKILL.md `name:` field
- Description: From `description:` field
- Available in all Claude Desktop conversations

## Usage in Claude Desktop

Skills work via natural language prompts:

```
I need to analyze this financial report. Please use the financial-analyzer skill.
```

**Note**: Claude Desktop skills run with `allowed-tools: [API]` by default (no filesystem access).

---

# 🤖 Custom Agents - Programmatic Integration

**Best for automation and integration**. Embed skills into agent workflows.

## Three Integration Methods

### Method 1: Direct SKILL.md Integration
Include SKILL.md content in agent prompts:

```javascript
// Node.js Agent Example
const claudePrompt = `
You are a document processing agent with these skills:

${fs.readFileSync('skills/pdf-processor/SKILL.md', 'utf8')}

${fs.readFileSync('skills/ocr-extractor/SKILL.md', 'utf8')}

User request: ${userMessage}
`;
```

### Method 2: Skill Execution Engine
Create a runtime that parses and executes skill instructions:

```python
# Python Agent Integration
import yaml
import subprocess

class SkillExecutor:
    def __init__(self):
        self.skill_cache = {}

    def load_skill(self, skill_path):
        with open(f"{skill_path}/SKILL.md", 'r') as f:
            content = f.read()

        # Parse YAML frontmatter
        parts = content.split('---')
        metadata = yaml.safe_load(parts[1])
        instructions = parts[2]

        self.skill_cache[metadata['name']] = {
            'metadata': metadata,
            'instructions': instructions
        }

    def execute(self, skill_name, user_input):
        skill = self.skill_cache.get(skill_name)
        if not skill:
            return "Skill not found"

        # Build execution context
        prompt = f"""
        Execute this skill: {skill_name}

        Skill Instructions:
        {skill['instructions']}

        User Request: {user_input}

        Available tools: {', '.join(skill['metadata']['allowed-tools'])}

        Execute step by step.
        """
        return self.call_claude_api(prompt)
```

### Method 3: Webhook/Callback Integration
Skills as microservices with webhooks:

```javascript
// Express.js webhook endpoint
app.post('/skill/:name', async (req, res) => {
    const { name } = req.params;
    const { input, callback_url } = req.body;

    // Load skill
    const skillPath = `skills/${name}/SKILL.md`;
    const skillContent = fs.readFileSync(skillPath, 'utf8');

    // Execute via Claude API
    const result = await claudeApi.call({
        prompt: `${skillContent}\n\nInput: ${input}`,
        tools: parseAllowedTools(skillContent)
    });

    // Return or callback
    if (callback_url) {
        await axios.post(callback_url, { result });
        res.json({ status: 'processing' });
    } else {
        res.json({ result });
    }
});
```

## Agent Workflow Integration Example

```yaml
# n8n workflow with Claude Skills
# Node: HTTP Request to agent API
- name: "Call Document Processor Skill"
  method: POST
  url: "{{ $env.AGENT_API_URL }}/skill/pdf-processor"
  body:
    input: "{{ $node.input.text }}"
    format: "json"
    callback_url: "{{ $webhook.callbackUrl }}"
```

---

# 🔄 Cross-Platform Usage Patterns

## Platform-Specific Strategies

### Claude Code (Development)
```bash
# Local development with full access
cd project/skills/
python ../claude-code-skills-factory/scripts/init.py "my-skill"
# Skill immediately available
```

### Claude Desktop (Production)
```bash
# Package for end users
python claude-code-skills-factory/scripts/package_skill.py --zip
# Upload {skill}-skill.zip in Claude Desktop
```

### Custom Agents (Integration)
```python
# Load skills programmatically
executor = SkillExecutor()
executor.load_skill('skills/pdf-processor')
result = executor.execute('pdf-processor', user_input)
```

## Skill Compatibility Matrix

| Feature | Claude Code | Desktop | Custom Agents |
|---------|-------------|---------|----------------|
| File System Access | ✅ | ❌ | ⚠️ (restricted) |
| API Calls | ✅ | ✅ | ✅ |
| Code Execution | ✅ | ❌ | ✅ (sandboxed) |
| Tool Integration | ✅ | ⚠️ (limited) | ✅ |
| Real-time Access | ✅ | ✅ | ✅ |

---

# 🚀 Quick Start Examples

## Example 1: Create and Use a PDF Skill

### Step 1: Initialize Skill
```bash
cd claude-code-skills-factory/scripts
python init.py "PDF Form Processor" "Fill and extract data from PDF forms"
```

### Step 2: Use in Claude Code
```
I have a PDF form at forms/application.pdf. Please use the pdf-form-processor skill to extract all field names and fill them with sample data.
```

### Step 3: Deploy to Desktop
- Locate `skills/pdf-form-processor/pdf-form-processor-skill.zip`
- Import via Claude Desktop → Profile → Skills → Import

### Step 4: Use in Desktop
```
Hey Claude, use my PDF Form Processor skill on this form: [attach file]
```

## Example 2: YouTube Transcript Skill

Based on the collected skills:

```yaml
# SKILL.md content
name: YouTube Transcript Extractor
description: Download transcripts from YouTube videos using yt-dlp with Whisper fallback
allowed-tools: [Bash, Read, Write]
```

### Cross-Platform Usage:
- **Claude Code**: Full filesystem access, can download and process locally
- **Desktop**: Can provide transcript URLs but no local file downloads
- **Agents**: Can be integrated into automated video processing workflows

---

# 🔧 Advanced Configuration

## Custom Tool Permissions

Control what Claude can do per platform:

```yaml
# Claude Code - Full access
allowed-tools:
  - Bash
  - Read
  - Write
  - Run

# Claude Desktop - Limited
allowed-tools:
  - API

# Custom Agents - Configurable
allowed-tools:
  - API
  - Webhook
```

## Environment Variables

Skills can reference environment variables:

```bash
# In skill instructions
API_KEY = {{ $env.OPENAI_API_KEY }}
FILE_PATH = {{ $env.OUTPUT_DIR }}
```

## Skill Dependencies

Specify required tools/libraries:

```yaml
requirements:
  - yt-dlp (pip install yt-dlp)
  - ffmpeg (brew install ffmpeg)
  - python libraries in requirements.txt
```

---

# 📦 Distribution and Sharing

## Skill Package Structure
```
skill-name-skill.zip
└── SKILL.md          # Only includes skill definition
```

## Sharing Options
1. **ZIP Files**: Direct import via Claude Desktop
2. **Git Repositories**: Full skill folders for Claude Code
3. **API Endpoints**: HTTP-accessible skills for agents
4. **NPM Packages**: Skills as installable modules

## Versioning
- Use semantic versioning: `skill-name-v1.0.0.zip`
- Include changelog in SKILL.md
- Maintain backward compatibility

---

# 🐛 Troubleshooting

## Common Issues

### Claude Code
- **Skill not appearing**: Check `skills/` directory structure
- **Permission errors**: Verify `allowed-tools:` in SKILL.md
- **Import errors**: Ensure YAML frontmatter is valid

### Claude Desktop
- **Import failed**: Check ZIP contains only SKILL.md
- **Skill not working**: Verify `allowed-tools` matches platform restrictions
- **API errors**: Check network connectivity

### Custom Agents
- **Tool execution failures**: Implement proper error handling
- **Async operations**: Use proper async/await patterns
- **Webhook timeouts**: Set reasonable timeout values

## Debug Mode

Enable verbose logging:

```bash
export CLAUDE_SKILLS_DEBUG=true
export CLAUDE_SKILLS_LOG_LEVEL=DEBUG
```

---

# 🎯 Best Practices

## Skill Design
- **Single Responsibility**: One skill, one clear purpose
- **Progressive Enhancement**: Work without all tools if possible
- **Error Handling**: Graceful degradation when tools unavailable
- **Documentation**: Clear examples and edge cases

## Platform Optimization
- **Claude Code**: Include full shell scripts and automation
- **Desktop**: Focus on analysis, recommendations, API calls
- **Agents**: Design for composability and webhook integration

## Testing Strategy
- Test on all platforms your skill targets
- Include fallback behaviors for missing tools
- Validate in different environments (local vs cloud)

---

*This guide provides complete coverage for deploying Claude skills across all supported platforms. Refer to specific SKILL.md files for detailed capabilities and usage examples.*
