#!/bin/bash
set -e

# ==============================================================================
# Superpowers Installer for Gemini CLI
# ==============================================================================
# 1. Symlinks each skill individually into ~/.gemini/skills/
# 2. Symlinks each agent definition individually into ~/.gemini/agents/
# 3. Injects Superpowers context block into ~/.gemini/GEMINI.md
# ==============================================================================

GEMINI_DIR="$HOME/.gemini"
SKILLS_DIR="$GEMINI_DIR/skills"
GEMINI_MD="$GEMINI_DIR/GEMINI.md"
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
mkdir -p "$GEMINI_DIR"
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
                link_target="$(realpath -m "$target_path" 2>/dev/null || python3 -c "import os; print(os.path.abspath(os.path.realpath('$target_path')))" 2>/dev/null || readlink "$target_path")"
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
AGENTS_DIR="$GEMINI_DIR/agents"
REPO_AGENTS_DIR="$REPO_DIR/agents"

mkdir -p "$AGENTS_DIR"

if [ -d "$REPO_AGENTS_DIR" ]; then
    echo "Linking agents from $REPO_AGENTS_DIR to $AGENTS_DIR..."
    for agent_path in "$REPO_AGENTS_DIR"/*.md; do
        if [ -f "$agent_path" ]; then
            agent_name=$(basename "$agent_path")
            target_path="$AGENTS_DIR/$agent_name"

            if [ -e "$target_path" ] || [ -L "$target_path" ]; then
                if [ -L "$target_path" ]; then
                    link_target="$(realpath -m "$target_path" 2>/dev/null || python3 -c "import os; print(os.path.abspath(os.path.realpath('$target_path')))" 2>/dev/null || readlink "$target_path")"
                    if [[ "$link_target" == "$REPO_DIR"* ]]; then
                        rm "$target_path"
                    else
                        echo "  ⚠ $agent_name already exists (not this repo). Skipping."
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
    echo "No agents directory found at "$REPO_AGENTS_DIR", skipping agent linking."
fi

# --- Enable experimental.skills in settings.json ---
SETTINGS_FILE="$GEMINI_DIR/settings.json"

enable_experimental_skills() {
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo "Creating $SETTINGS_FILE with experimental.skills enabled..."
        printf '{\n  "experimental": {\n    "skills": true\n  }\n}\n' > "$SETTINGS_FILE"
        return
    fi

    # Check if already enabled
    if grep -q '"skills"' "$SETTINGS_FILE" 2>/dev/null; then
        echo "experimental.skills already present in $SETTINGS_FILE"
        return
    fi

    echo "Enabling experimental.skills in $SETTINGS_FILE..."
    if command -v jq >/dev/null 2>&1; then
        jq '.experimental = (.experimental // {}) + {"skills": true}' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" \
            && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    d = json.load(f)
d.setdefault('experimental', {})['skills'] = True
with open(sys.argv[1], 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
" "$SETTINGS_FILE"
    else
        echo "  ⚠ Neither jq nor python3 available. Please manually add to $SETTINGS_FILE:"
        echo '    "experimental": { "skills": true }'
    fi
}

enable_experimental_skills

# --- Context injection into GEMINI.md ---
CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"

read -r -d '' CONTEXT_BLOCK << 'EOM' || true
<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.gemini/skills` and agent definitions in `~/.gemini/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- Use the `activate_skill` tool to load a skill. Use `/skills list` to see available skills.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Gemini"** (You).
- **"Task" tool** → Use sub-agents. Agent definitions are in `~/.gemini/agents/`.
- **"Skill" tool** → Use `activate_skill` tool with the skill name.
- **"TodoWrite"** → Write/update a task list (e.g., `task.md` or `plan.md`).
- File operations → `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Directory listing → `list_dir`
- Code structure → `view_file_outline`, `view_code_item`
- Search → `search_file_content`, `glob`
- Shell → `run_command`
- Web fetch → `read_url_content`
- Web search → `google_web_search`
<!-- SUPERPOWERS-CONTEXT-END -->
EOM

# Create GEMINI.md if missing
if [ ! -f "$GEMINI_MD" ]; then
    echo "Creating $GEMINI_MD..."
    touch "$GEMINI_MD"
fi

# Idempotent: remove existing block if present
if grep -q "$CONTEXT_HEADER" "$GEMINI_MD"; then
    echo "Updating Superpowers context in $GEMINI_MD..."
    sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$GEMINI_MD"
    rm -f "${GEMINI_MD}.bak"
else
    echo "Injecting Superpowers context into $GEMINI_MD..."
fi

# Trim trailing blank/whitespace-only lines (prevents accumulation on repeated runs)
if awk '{lines[NR]=$0} END{e=NR; while(e>0 && lines[e] ~ /^[[:space:]]*$/) e--; for(i=1;i<=e;i++) print lines[i]}' "$GEMINI_MD" > "${GEMINI_MD}.tmp" 2>/dev/null; then
    mv "${GEMINI_MD}.tmp" "$GEMINI_MD"
else
    echo "Warning: Could not trim blank lines from $GEMINI_MD" >&2
fi

# Append context block (add newline separator only if file already has content)
if [ -s "$GEMINI_MD" ]; then
    printf '\n%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
else
    printf '%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
fi

echo ""
echo "✅ Installation complete!"
echo "Restart Gemini CLI to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
