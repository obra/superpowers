# Installing Superpowers for Gemini CLI

Enable Superpowers skills in your Gemini CLI environment.

## Installation

### 1. Clone the repository

Clone the Superpowers repository into your Gemini configuration directory:

```bash
mkdir -p ~/.gemini/superpowers
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers
```

### 2. Create personal skills directory (Optional)

If you want to create your own skills:

```bash
mkdir -p ~/.gemini/skills
```

### 3. Configure Gemini Context

You need to tell Gemini about these superpowers. Add the following instruction to your global `~/.gemini/GEMINI.md` or your project-specific `GEMINI.md` file:

```markdown
# Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
RIGHT NOW run: `~/.gemini/superpowers/.gemini/superpowers-gemini bootstrap` and follow the instructions it returns.
</EXTREMELY_IMPORTANT>
```

## Verification

Start a new Gemini CLI session. You should see the agent run the bootstrap command and list available skills.

To test manually, ask the agent:
"Do you have superpowers?"

Or run the bootstrap command yourself to check output:
```bash
~/.gemini/superpowers/.gemini/superpowers-gemini bootstrap
```
