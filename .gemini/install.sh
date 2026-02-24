#!/bin/bash
set -e

# ==============================================================================
# Superpowers Installer for Antigravity / Gemini CLI
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

# Helper: safely compute symlink target
safe_realpath() {
    local path="$1"
    realpath -m "$path" 2>/dev/null || python3 -c 'import os,sys; print(os.path.abspath(os.path.realpath(sys.argv[1])))' "$path" 2>/dev/null || readlink "$path"
}

# Helper: link items (skills or agents)
link_items_into() {
    local src_dir="$1" target_dir="$2" item_type="$3"
    [ -d "$src_dir" ] || return 0
    mkdir -p "$target_dir"
    echo "Linking $item_type from $src_dir to $target_dir..."

    for item_path in "$src_dir"/*; do
        if [ "$item_type" = "skills" ]; then
            [ -d "$item_path" ] || continue
        else
            [ -f "$item_path" ] || continue
        fi
        local item_name target_path link_target rel_path
        item_name=$(basename "$item_path")
        item_path="${item_path%/}"
        target_path="$target_dir/$item_name"

        if [ -e "$target_path" ] || [ -L "$target_path" ]; then
            if [ -L "$target_path" ]; then
                link_target="$(safe_realpath "$target_path")"
                if [[ "$link_target" == "$REPO_DIR"* ]]; then
                    rm "$target_path"
                else
                    echo "  ⚠ $item_name points to $link_target (not this repo). Skipping."
                    continue
                fi
            else
                echo "  ⚠ $target_path exists and is not a symlink. Skipping."
                continue
            fi
        fi

        if ln -sr "$item_path" "$target_path" 2>/dev/null; then
            : # GNU ln with -r support
        elif command -v python3 >/dev/null 2>&1; then
            rel_path="$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$item_path" "$target_dir")"
            ln -s "$rel_path" "$target_path"
        else
            echo "  ⚠ Warning: Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
            ln -s "$item_path" "$target_path"
        fi
        echo "  ✓ $item_name"
    done
}

# --- Link skills (hub pattern) ---
link_items_into "$REPO_SKILLS_DIR" "$SKILLS_DIR" "skills"

# --- Link agents (hub pattern) ---
AGENTS_DIR="$GEMINI_DIR/agents"
REPO_AGENTS_DIR="$REPO_DIR/agents"
if [ -d "$REPO_AGENTS_DIR" ]; then
    link_items_into "$REPO_AGENTS_DIR" "$AGENTS_DIR" "agents"
else
    echo "No agents directory found at $REPO_AGENTS_DIR, skipping agent linking."
fi

# --- Also link skills into Antigravity-specific path ---
ANTIGRAVITY_SKILLS_DIR="$HOME/.gemini/antigravity/skills"
if [ -d "$HOME/.gemini/antigravity" ]; then
    link_items_into "$REPO_SKILLS_DIR" "$ANTIGRAVITY_SKILLS_DIR" "skills"
else
    echo "Antigravity not detected at ~/.gemini/antigravity — skipping Antigravity-specific skill path."
fi

# --- Context injection into GEMINI.md ---
CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"

read -r -d '' CONTEXT_BLOCK << 'EOM' || true
<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.gemini/skills` and agent definitions in `~/.gemini/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills in `~/.gemini/skills` before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- To use a skill, read its `SKILL.md` file using `view_file` on `~/.gemini/skills/<skill-name>/SKILL.md`.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Antigravity"** (You).
- **"Task" tool** → Use `browser_subagent` for browser tasks, or break work into structured steps with `task_boundary`.
- **"Skill" tool** → Use `view_file` on `~/.gemini/skills/<skill-name>/SKILL.md`.
- **"TodoWrite"** → Write/update a task list (e.g., `task.md` or `plan.md`).
- File operations → `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Directory listing → `list_dir`
- Code structure → `view_file_outline`, `view_code_item`
- Search → `grep_search`, `find_by_name`
- Shell → `run_command`
- Web fetch → `read_url_content`
- Web search → `search_web`
- Image generation → `generate_image`
- User communication (during tasks) → `notify_user`
- MCP tools → available via `mcp_*` tool prefix
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
echo "Restart Antigravity (or Gemini CLI) to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
