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
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_SKILLS_DIR="$REPO_DIR/skills"

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
                link_target="$(realpath "$target_path" 2>/dev/null || readlink "$target_path")"
                if [[ "$link_target" == "$REPO_DIR"* ]]; then
                    rm "$target_path"
                else
                    echo "  ⚠ $skill_name points to $link_target (not this repo). Skipping."
                    continue
                fi
            else
                echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                continue
            fi
        fi

        # Use relative path for portability (repo relocation doesn't break links)
        if ln -sr "$skill_path" "$target_path" 2>/dev/null; then
            : # GNU ln with -r support
        elif command -v python3 >/dev/null 2>&1; then
            # Fallback: compute relative path with Python
            rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$skill_path" "$SKILLS_DIR")"
            ln -s "$rel_path" "$target_path"
        else
            echo "  ⚠ Warning: Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
            ln -s "$skill_path" "$target_path"
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
                    link_target="$(realpath "$target_path" 2>/dev/null || readlink "$target_path")"
                    if [[ "$link_target" == "$REPO_DIR"* ]]; then
                        rm "$target_path"
                    else
                        echo "  ⚠ $agent_name points to $link_target (not this repo). Skipping."
                        continue
                    fi
                else
                    echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                    continue
                fi
            fi

            # Use relative path for portability
            if ln -sr "$agent_path" "$target_path" 2>/dev/null; then
                : # GNU ln with -r support
            elif command -v python3 >/dev/null 2>&1; then
                rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$agent_path" "$AGENTS_DIR")"
                ln -s "$rel_path" "$target_path"
            else
                echo "  ⚠ Warning: Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
                ln -s "$agent_path" "$target_path"
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
    templates_linked=0
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

            # Skip if target directory is itself a symlink (would modify the repo source)
            target_dir="$(dirname "$target_skill")"
            if [ -L "$target_dir" ]; then
                echo "  ⚠ Skipping $(basename "$target_skill"): parent directory is a symlink (would modify repo source)"
                continue
            fi

            if [ -L "$target_skill" ]; then
                rm "$target_skill"
            elif [ -f "$target_skill" ]; then
                echo "  ⚠ $(basename "$target_skill") exists as a regular file. Skipping."
                continue
            fi

            # Use relative path for portability
            if ln -sr "$template" "$target_skill" 2>/dev/null; then
                : # GNU ln with -r support
            elif command -v python3 >/dev/null 2>&1; then
                rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$template" "$(dirname "$target_skill")")"
                ln -s "$rel_path" "$target_skill"
            else
                echo "  ⚠ Warning: Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
                ln -s "$template" "$target_skill"
            fi
            echo "  ✓ $(basename "$target_skill")"
            templates_linked=$((templates_linked + 1))
        fi
    done
    if [ "$templates_linked" -eq 0 ]; then
        echo "  ℹ No prompt template files found in $PROMPT_TEMPLATES_DIR"
    fi
else
    echo "No agents directory found at $REPO_AGENTS_DIR, skipping agent linking."
fi


# --- Link custom commands (deterministic skill triggers) ---
COMMANDS_DIR="$QWEN_DIR/commands"
REPO_COMMANDS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/commands"

mkdir -p "$COMMANDS_DIR"

if [ -d "$REPO_COMMANDS_DIR" ]; then
    echo "Linking custom commands from $REPO_COMMANDS_DIR to $COMMANDS_DIR..."
    for cmd_path in "$REPO_COMMANDS_DIR"/*.md; do
        if [ -f "$cmd_path" ]; then
            cmd_name=$(basename "$cmd_path")
            target_path="$COMMANDS_DIR/$cmd_name"

            if [ -e "$target_path" ] || [ -L "$target_path" ]; then
                if [ -L "$target_path" ]; then
                    link_target="$(realpath "$target_path" 2>/dev/null || readlink "$target_path")"
                    if [[ "$link_target" == "$REPO_DIR"* ]]; then
                        rm "$target_path"
                    else
                        echo "  ⚠ $cmd_name points to $link_target (not this repo). Skipping."
                        continue
                    fi
                else
                    echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                    continue
                fi
            fi

            if ln -sr "$cmd_path" "$target_path" 2>/dev/null; then
                :
            elif command -v python3 >/dev/null 2>&1; then
                rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$cmd_path" "$COMMANDS_DIR")"
                ln -s "$rel_path" "$target_path"
            else
                echo "  ⚠ Warning: Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
                ln -s "$cmd_path" "$target_path"
            fi
            echo "  ✓ /${cmd_name%.md}"
        fi
    done
else
    echo "No commands directory found at $REPO_COMMANDS_DIR, skipping command linking."
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

## Quick Skill Commands
These slash commands deterministically activate specific skills:
- `/brainstorm` — brainstorming (design before implementation)
- `/debug` — systematic debugging
- `/plan` — write implementation plans
- `/tdd` — test-driven development
- `/review` — request code review
- `/verify` — verification before completion
- `/execute` — execute an implementation plan
- `/finish` — finish a development branch
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

# Trim trailing blank/whitespace-only lines (prevents accumulation on repeated runs)
if awk '{lines[NR]=$0} END{e=NR; while(e>0 && lines[e] ~ /^[[:space:]]*$/) e--; for(i=1;i<=e;i++) print lines[i]}' "$QWEN_MD" > "${QWEN_MD}.tmp" 2>/dev/null; then
    mv "${QWEN_MD}.tmp" "$QWEN_MD"
else
    echo "Warning: Could not trim blank lines from $QWEN_MD" >&2
fi

# Append context block (add newline separator only if file already has content)
if [ -s "$QWEN_MD" ]; then
    printf '\n%s\n' "$CONTEXT_BLOCK" >> "$QWEN_MD"
else
    printf '%s\n' "$CONTEXT_BLOCK" >> "$QWEN_MD"
fi

echo ""
echo "✅ Installation complete!"
echo "Restart Qwen Code CLI to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
