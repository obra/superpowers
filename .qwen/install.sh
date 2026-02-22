#!/bin/bash
set -e

# ==============================================================================
# Superpowers Installer for Qwen Code CLI
# ==============================================================================
# 1. Symlinks each skill individually into ~/.qwen/skills/
# 2. Symlinks each agent definition individually into ~/.qwen/agents/
# 3. Symlinks Qwen-specific prompt templates for subagent skills
# 4. Injects Superpowers context block into ~/.qwen/QWEN.md
# ==============================================================================

QWEN_DIR="$HOME/.qwen"
SKILLS_DIR="$QWEN_DIR/skills"
QWEN_MD="$QWEN_DIR/QWEN.md"
REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills" && pwd)"

# Validate
if [ ! -d "$REPO_SKILLS_DIR" ]; then
    echo "Error: Skills directory not found at $REPO_SKILLS_DIR"
    exit 1
fi

# If skills dir is a symlink (old-style), convert to directory
if [ -L "$SKILLS_DIR" ]; then
    echo "Converting $SKILLS_DIR from symlink to directory..."
    rm "$SKILLS_DIR"
    mkdir -p "$SKILLS_DIR"
fi

# Ensure directories exist
mkdir -p "$QWEN_DIR"
mkdir -p "$SKILLS_DIR"

# --- Link skills individually (hub pattern) ---
echo "Linking skills from $REPO_SKILLS_DIR to $SKILLS_DIR..."

for skill_path in "$REPO_SKILLS_DIR"/*/; do
    if [ -d "$skill_path" ]; then
        skill_name=$(basename "$skill_path")
        # Strip trailing slash from path
        skill_path="${skill_path%/}"
        target_path="$SKILLS_DIR/$skill_name"

        if [ -e "$target_path" ] || [ -L "$target_path" ]; then
            if [ -L "$target_path" ]; then
                rm "$target_path"
            else
                echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                continue
            fi
        fi

        # Use relative path for portability (repo relocation doesn't break links)
        if ln -sr "$skill_path" "$target_path" 2>/dev/null; then
            : # GNU ln with -r support
        else
            # Fallback: compute relative path with Python
            rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$skill_path" "$SKILLS_DIR")"
            ln -s "$rel_path" "$target_path"
        fi
        echo "  ✓ $skill_name"
    fi
done

# --- Link agents individually (hub pattern) ---
AGENTS_DIR="$QWEN_DIR/agents"
REPO_AGENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/agents"

mkdir -p "$AGENTS_DIR"

if [ -d "$REPO_AGENTS_DIR" ]; then
    echo "Linking agents from $REPO_AGENTS_DIR to $AGENTS_DIR..."
    for agent_path in "$REPO_AGENTS_DIR"/*.md; do
        if [ -f "$agent_path" ]; then
            agent_name=$(basename "$agent_path")
            target_path="$AGENTS_DIR/$agent_name"

            if [ -e "$target_path" ] || [ -L "$target_path" ]; then
                if [ -L "$target_path" ]; then
                    rm "$target_path"
                else
                    echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                    continue
                fi
            fi

            # Use relative path for portability
            if ln -sr "$agent_path" "$target_path" 2>/dev/null; then
                : # GNU ln with -r support
            else
                rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$agent_path" "$AGENTS_DIR")"
                ln -s "$rel_path" "$target_path"
            fi
            echo "  ✓ $agent_name"
        fi
    done
else
    echo "No agents directory found at $REPO_AGENTS_DIR, skipping agent linking."
fi

# --- Symlink Qwen-specific prompt templates for subagent skills ---
PROMPT_TEMPLATES_DIR="$REPO_AGENTS_DIR"

if [ -d "$PROMPT_TEMPLATES_DIR" ]; then
    echo "Linking Qwen prompt templates to subagent skills..."
    for template in "$PROMPT_TEMPLATES_DIR"/*-prompt-template.md; do
        if [ -f "$template" ]; then
            template_name=$(basename "$template")
            # Map template names to skill directories
            if [[ "$template_name" == "implementer-prompt-template.md" ]]; then
                target_skill="$SKILLS_DIR/subagent-driven-development/implementer-prompt.md"
            elif [[ "$template_name" == "spec-reviewer-prompt-template.md" ]]; then
                target_skill="$SKILLS_DIR/subagent-driven-development/spec-reviewer-prompt.md"
            elif [[ "$template_name" == "code-reviewer-prompt-template.md" ]]; then
                target_skill="$SKILLS_DIR/subagent-driven-development/code-quality-reviewer-prompt.md"
            else
                continue
            fi

            if [ -L "$target_skill" ]; then
                rm "$target_skill"
            fi

            # Use relative path for portability
            if ln -sr "$template" "$target_skill" 2>/dev/null; then
                : # GNU ln with -r support
            else
                rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$template" "$(dirname "$target_skill")")"
                ln -s "$rel_path" "$target_skill"
            fi
            echo "  ✓ $(basename "$target_skill")"
        fi
    done
fi


# --- Context injection into QWEN.md ---
CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"

read -r -d '' CONTEXT_BLOCK << 'EOM' || true
<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.qwen/skills` and subagent definitions in `~/.qwen/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills in `~/.qwen/skills` and available agents in `~/.qwen/agents` before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- To use a skill, read its `SKILL.md` file. To use a subagent, use the `task()` tool with the appropriate `subagent_type` matching the agent's name.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Qwen"** (You).
- **"Task" tool** → Use your native `task()` tool. The required subagents (`implementer`, `spec-reviewer`, `code-reviewer`) have been linked into `~/.qwen/agents`.
- **"Skill" tool** → `read_file`. To invoke a skill, read `~/.qwen/skills/<skill-name>/SKILL.md`.
- **"TodoWrite"** → Write/update a plan file (e.g., `plan.md`).
- File operations → your native tools (`read_file`, `write_file`, `replace`, etc.)
- Search → `search_file_content` or `glob`
- Shell → `run_shell_command`
- Web fetch → `web_fetch`
<!-- SUPERPOWERS-CONTEXT-END -->
EOM

# Create QWEN.md if missing
if [ ! -f "$QWEN_MD" ]; then
    echo "Creating $QWEN_MD..."
    touch "$QWEN_MD"
fi

# Idempotent: remove existing block if present
if grep -q "$CONTEXT_HEADER" "$QWEN_MD"; then
    echo "Updating Superpowers context in $QWEN_MD..."
    sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$QWEN_MD"
    rm -f "${QWEN_MD}.bak"
else
    echo "Injecting Superpowers context into $QWEN_MD..."
fi

# Trim trailing blank lines (prevents accumulation on repeated runs)
if sed -i.bak -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$QWEN_MD" 2>/dev/null; then
    rm -f "${QWEN_MD}.bak"
else
    # Fallback: awk version for systems without GNU sed
    awk '{print; n=0} /^$/{n++} END{for(i=0;i<n-1;i++)print ""}' "$QWEN_MD" > "${QWEN_MD}.tmp" && mv "${QWEN_MD}.tmp" "$QWEN_MD"
fi

# Append context block with single newline separator
printf '\n%s\n' "$CONTEXT_BLOCK" >> "$QWEN_MD"

echo ""
echo "✅ Installation complete!"
echo "Restart Qwen Code CLI to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
