#!/bin/bash
set -e

# ==============================================================================
# Superpowers Installer for GitHub Copilot CLI
# ==============================================================================
# 1. Symlinks each skill individually into ~/.copilot/skills/
# 2. Symlinks each agent definition individually into ~/.copilot/agents/
# 3. Injects Superpowers context block into ~/.copilot/copilot-instructions.md
# ==============================================================================

COPILOT_DIR="$HOME/.copilot"
SKILLS_DIR="$COPILOT_DIR/skills"
COPILOT_INSTRUCTIONS="$COPILOT_DIR/copilot-instructions.md"
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
mkdir -p "$COPILOT_DIR"
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
AGENTS_DIR="$COPILOT_DIR/agents"
REPO_AGENTS_DIR="$REPO_DIR/agents"

mkdir -p "$AGENTS_DIR"

if [ -d "$REPO_AGENTS_DIR" ] && [ "$(ls -A "$REPO_AGENTS_DIR" 2>/dev/null)" ]; then
    echo "Linking agents from $REPO_AGENTS_DIR to $AGENTS_DIR..."
    for agent_path in "$REPO_AGENTS_DIR"/*.md; do
        if [ -f "$agent_path" ]; then
            # Prefer .agent.md over plain .md when both exist
            base_name="${agent_path##*/}"
            if [[ "$base_name" != *.agent.md ]]; then
                agent_md_version="${agent_path%.md}.agent.md"
                [ -f "$agent_md_version" ] && continue
            fi
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

# --- Context injection into copilot-instructions.md ---
CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"

read -r -d '' CONTEXT_BLOCK << 'EOM' || true
<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.copilot/skills` and agent definitions in `~/.copilot/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- Use the `skill` tool to load a skill. Skills are listed in the available_skills section of your context.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Copilot"** (You).
- **"Task" tool** → Use sub-agents (explore, task, general-purpose, code-review).
- **"Skill" tool** → Use the `skill` tool with the skill name.
- **"TodoWrite"** → Write/update a plan file (e.g., `plan.md`).
- File operations → your native tools (view, edit, create, bash, etc.)
- Search → grep or glob tools
- Shell → bash tool
- Web fetch → web_fetch tool
<!-- SUPERPOWERS-CONTEXT-END -->
EOM

# Create copilot-instructions.md if missing
if [ ! -f "$COPILOT_INSTRUCTIONS" ]; then
    echo "Creating $COPILOT_INSTRUCTIONS..."
    touch "$COPILOT_INSTRUCTIONS"
fi

# Idempotent: remove existing block if present
if grep -q "$CONTEXT_HEADER" "$COPILOT_INSTRUCTIONS"; then
    echo "Updating Superpowers context in $COPILOT_INSTRUCTIONS..."
    sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$COPILOT_INSTRUCTIONS"
    rm -f "${COPILOT_INSTRUCTIONS}.bak"
else
    echo "Injecting Superpowers context into $COPILOT_INSTRUCTIONS..."
fi

# Trim trailing blank lines (prevents accumulation on repeated runs)
if sed -i.bak -e :a -e '/^[[:space:]]*$/{$d;N;ba' -e '}' "$COPILOT_INSTRUCTIONS" 2>/dev/null; then
    rm -f "${COPILOT_INSTRUCTIONS}.bak"
elif awk '{lines[NR]=$0} END{e=NR; while(e>0 && lines[e]=="") e--; for(i=1;i<=e;i++) print lines[i]}' "$COPILOT_INSTRUCTIONS" > "${COPILOT_INSTRUCTIONS}.tmp" 2>/dev/null; then
    mv "${COPILOT_INSTRUCTIONS}.tmp" "$COPILOT_INSTRUCTIONS"
else
    echo "Warning: Could not trim blank lines from $COPILOT_INSTRUCTIONS" >&2
fi

# Append context block (add newline separator only if file already has content)
if [ -s "$COPILOT_INSTRUCTIONS" ]; then
    printf '\n%s\n' "$CONTEXT_BLOCK" >> "$COPILOT_INSTRUCTIONS"
else
    printf '%s\n' "$CONTEXT_BLOCK" >> "$COPILOT_INSTRUCTIONS"
fi

echo ""
echo "✅ Installation complete!"
echo "Restart GitHub Copilot CLI to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
