#!/bin/bash
set -euo pipefail

# ==============================================================================
# Superpowers Enhanced Installer for Gemini CLI
# ==============================================================================
# Features:
# 1. Hub pattern symlinks for skills and agents
# 2. Antigravity support (--antigravity flag)
# 3. Native extension detection and suggestion
# 4. Cross-platform symlink creation
# 5. Deterministic hook registration (beforeAgent/beforeTool)
# 6. Context injection into GEMINI.md
# ==============================================================================

readonly VERSION="4.3.1"
readonly SCRIPT_NAME="install.sh"
readonly REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default configuration
MODE="standard"  # standard, antigravity, native
GEMINI_DIR="${GEMINI_HOME:-$HOME/.gemini}"
SKILLS_DIR="$GEMINI_DIR/skills"
AGENTS_DIR="$GEMINI_DIR/agents"
SETTINGS_FILE="$GEMINI_DIR/settings.json"
GEMINI_MD="$GEMINI_DIR/GEMINI.md"
REPO_SKILLS_DIR="$REPO_DIR/skills"
REPO_AGENTS_DIR="$REPO_DIR/agents"

# Colors for output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

die() {
    log_error "$*"
    exit 1
}

print_help() {
    cat << EOF
Superpowers Installer for Gemini CLI v${VERSION}

Usage: $SCRIPT_NAME [OPTIONS]

Options:
  --antigravity    Install for Antigravity (skills go to ~/.gemini/antigravity/skills/)
  --native         Suggest native extension installation (gemini extension install)
  --help           Show this help message

Environment Variables:
  GEMINI_HOME      Override the Gemini directory (default: ~/.gemini)

Examples:
  $SCRIPT_NAME                    # Standard installation (hub pattern)
  $SCRIPT_NAME --antigravity      # Install for Antigravity users
  $SCRIPT_NAME --native           # Show native extension instructions

Without options, the installer will:
  1. Create symlinks for each skill in ~/.gemini/skills/
  2. Create symlinks for each agent in ~/.gemini/agents/
  3. Register deterministic routing hooks in ~/.gemini/settings.json
  4. Inject Superpowers context into ~/.gemini/GEMINI.md
  5. Provide verification steps

For more details, see: $REPO_DIR/.gemini/INSTALL.md
EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --antigravity)
                MODE="antigravity"
                GEMINI_DIR="${GEMINI_HOME:-$HOME/.gemini}/antigravity"
                SKILLS_DIR="$GEMINI_DIR/skills"
                AGENTS_DIR="$GEMINI_DIR/agents"
                SETTINGS_FILE="$GEMINI_DIR/settings.json"
                GEMINI_MD="$GEMINI_DIR/GEMINI.md"
                shift
                ;;
            --native)
                MODE="native"
                shift
                ;;
            --help|-h)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done
}

validate_prerequisites() {
    # Check if skills directory exists
    if [ ! -d "$REPO_SKILLS_DIR" ]; then
        die "Skills directory not found at $REPO_SKILLS_DIR"
    fi

    # Check for required commands
    if ! command -v git >/dev/null 2>&1; then
        log_warning "Git not found. Installation may fail if repository is not already cloned."
    fi

    # Check Gemini CLI version if available
    if command -v gemini >/dev/null 2>&1; then
        GEMINI_VERSION=$(gemini --version 2>/dev/null || echo "unknown")
        log_info "Gemini CLI version: $GEMINI_VERSION"
        # Version check for native extensions
        if [[ "$GEMINI_VERSION" =~ ^v?([0-9]+)\.([0-9]+) ]]; then
            major="${BASH_REMATCH[1]}"
            minor="${BASH_REMATCH[2]}"
            if [ "$major" -eq 0 ] && [ "$minor" -lt 28 ]; then
                log_warning "Gemini CLI v0.28.0+ recommended for native extension support. You have $GEMINI_VERSION"
            fi
        fi
    else
        log_warning "Gemini CLI not found in PATH. Ensure it's installed before using skills."
    fi
}

ensure_directories() {
    log_info "Creating directory structure in $GEMINI_DIR"
    mkdir -p "$GEMINI_DIR"
    mkdir -p "$SKILLS_DIR"
    mkdir -p "$AGENTS_DIR"
}

# ------------------------------------------------------------------------------
# Symlink Creation (Hub Pattern)
# ------------------------------------------------------------------------------

create_symlink() {
    local source="$1"
    local target="$2"
    local name="$3"
    
    # Check if target already exists
    if [ -e "$target" ] || [ -L "$target" ]; then
        if [ -L "$target" ]; then
            # Resolve symlink target
            local link_target
            link_target="$(realpath -m "$target" 2>/dev/null || python3 -c 'import os,sys; print(os.path.abspath(os.path.realpath(sys.argv[1])))' "$target" 2>/dev/null || readlink "$target")"
            if [[ "$link_target" == "$REPO_DIR"* ]]; then
                rm "$target"
                log_info "  Updating existing symlink: $name"
            else
                log_warning "  $name points to $link_target (not this repo). Skipping."
                return 1
            fi
        else
            log_warning "  $target exists and is not a symlink. Skipping."
            return 1
        fi
    fi
    
    # Create symlink with relative path for portability
    if ln -sr "$source" "$target" 2>/dev/null; then
        : # GNU ln with -r support
    elif command -v python3 >/dev/null 2>&1; then
        # Fallback: compute relative path with Python
        local rel_path
        rel_path="$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$source" "$(dirname "$target")")"
        ln -s "$rel_path" "$target"
    else
        log_warning "  Neither GNU ln -sr nor python3 available. Using absolute path (less portable)."
        ln -s "$source" "$target"
    fi
    
    echo "  ✓ $name"
    return 0
}

link_skills() {
    log_info "Linking skills from $REPO_SKILLS_DIR to $SKILLS_DIR"
    
    local count=0
    for skill_path in "$REPO_SKILLS_DIR"/*/; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            skill_path="${skill_path%/}"  # Strip trailing slash
            target_path="$SKILLS_DIR/$skill_name"
            
            if create_symlink "$skill_path" "$target_path" "$skill_name"; then
                count=$((count + 1))
            fi
        fi
    done
    
    log_success "Linked $count skills"
}

link_agents() {
    if [ ! -d "$REPO_AGENTS_DIR" ]; then
        log_info "No agents directory found at $REPO_AGENTS_DIR, skipping agent linking."
        return
    fi
    
    log_info "Linking agents from $REPO_AGENTS_DIR to $AGENTS_DIR"
    
    local count=0
    for agent_path in "$REPO_AGENTS_DIR"/*.md; do
        if [ -f "$agent_path" ]; then
            agent_name=$(basename "$agent_path")
            target_path="$AGENTS_DIR/$agent_name"
            
            if create_symlink "$agent_path" "$target_path" "$agent_name"; then
                count=$((count + 1))
            fi
        fi
    done
    
    log_success "Linked $count agents"
}

# ------------------------------------------------------------------------------
# Hook Registration
# ------------------------------------------------------------------------------

register_hooks() {
    # Check if Node.js is available (required for hooks)
    if ! command -v node >/dev/null 2>&1; then
        log_warning "Node.js not found. Hooks require Node.js to run."
        log_warning "Install Node.js (https://nodejs.org) for deterministic skill routing."
        return 1
    fi
    
    # Check if hook scripts exist
    local ROUTER_PATH="$REPO_DIR/agents/superpowers-router.js"
    local GUARD_PATH="$REPO_DIR/agents/superpowers-guard.js"
    
    if [ ! -f "$ROUTER_PATH" ]; then
        log_warning "Router script not found at $ROUTER_PATH"
        return 1
    fi
    
    log_info "Registering Superpowers hooks in $SETTINGS_FILE"
    
    # Ensure settings.json exists
    if [ ! -f "$SETTINGS_FILE" ]; then
        log_info "Creating basic $SETTINGS_FILE for hook registration..."
        printf '{\n  "hooks": {}\n}\n' > "$SETTINGS_FILE"
    fi
    
    if command -v python3 >/dev/null 2>&1; then
        python3 -c "
import json, sys
settings_path = sys.argv[1]
router_path = sys.argv[2]
guard_path = sys.argv[3]
try:
    with open(settings_path, 'r') as f:
        d = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    d = {}

hooks = d.setdefault('hooks', {})

# BeforeAgent: deterministic phrase router
beforeAgent = hooks.setdefault('beforeAgent', [])
beforeAgent = [h for h in beforeAgent if h.get('name') not in ('superpowers-router',)]
beforeAgent.append({
    'name': 'superpowers-router',
    'command': 'node',
    'args': [router_path],
    'matcher': '.*'
})
hooks['beforeAgent'] = beforeAgent

# BeforeTool: agent-behavior guard (commit/merge interception)
beforeTool = hooks.setdefault('beforeTool', [])
beforeTool = [h for h in beforeTool if h.get('name') not in ('superpowers-guard',)]
beforeTool.append({
    'name': 'superpowers-guard',
    'command': 'node',
    'args': [guard_path],
    'matcher': '.*'
})
hooks['beforeTool'] = beforeTool

with open(settings_path, 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
" "$SETTINGS_FILE" "$ROUTER_PATH" "$GUARD_PATH"
        log_success "Registered superpowers-router (BeforeAgent)"
        log_success "Registered superpowers-guard (BeforeTool)"
        return 0
    else
        log_warning "python3 not found. Could not auto-register hooks."
        log_warning "Please add hooks manually to $SETTINGS_FILE. See $REPO_DIR/docs/README.gemini.md."
        return 1
    fi
}

# ------------------------------------------------------------------------------
# Context Injection
# ------------------------------------------------------------------------------

inject_context() {
    local CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
    local CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"
    
    # Read context block from repo
    local CONTEXT_BLOCK_SOURCE="$REPO_DIR/.gemini/GEMINI.md"
    if [ ! -f "$CONTEXT_BLOCK_SOURCE" ]; then
        log_error "Could not find context block source at $CONTEXT_BLOCK_SOURCE"
        return 1
    fi
    
    local CONTEXT_BLOCK
    CONTEXT_BLOCK=$(awk "/$CONTEXT_HEADER/{flag=1} flag; /$CONTEXT_FOOTER/{flag=0}" "$CONTEXT_BLOCK_SOURCE")
    
    # Create GEMINI.md if missing
    if [ ! -f "$GEMINI_MD" ]; then
        log_info "Creating $GEMINI_MD..."
        touch "$GEMINI_MD"
    fi
    
    # Idempotent: remove existing block if present
    if grep -q "$CONTEXT_HEADER" "$GEMINI_MD"; then
        log_info "Updating Superpowers context in $GEMINI_MD..."
        sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$GEMINI_MD"
        rm -f "${GEMINI_MD}.bak"
    else
        log_info "Injecting Superpowers context into $GEMINI_MD..."
    fi
    
    # Trim trailing blank/whitespace-only lines (prevents accumulation on repeated runs)
    if awk '{lines[NR]=$0} END{e=NR; while(e>0 && lines[e] ~ /^[[:space:]]*$/) e--; for(i=1;i<=e;i++) print lines[i]}' "$GEMINI_MD" > "${GEMINI_MD}.tmp" 2>/dev/null; then
        mv "${GEMINI_MD}.tmp" "$GEMINI_MD"
    else
        log_warning "Could not trim blank lines from $GEMINI_MD"
    fi
    
    # Append context block (add newline separator only if file already has content)
    if [ -s "$GEMINI_MD" ]; then
        printf '\n%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
    else
        printf '%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
    fi
    
    log_success "Injected Superpowers context into $GEMINI_MD"
}

# ------------------------------------------------------------------------------
# Native Extension Instructions
# ------------------------------------------------------------------------------

show_native_instructions() {
    cat << EOF

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}
${GREEN}Native Extension Installation${NC}
═══════════════════════════════════════════════════════════════════════════════

For Gemini CLI v0.28.0+, you can install Superpowers as a native extension:

  ${YELLOW}gemini extension install $REPO_DIR/.gemini${NC}

Benefits of native extension installation:
  • Clean integration with Gemini's extension system
  • Automatic updates via ${YELLOW}gemini extension update superpowers${NC}
  • Better future compatibility
  • No symlink management required

After installation, restart Gemini CLI.

To switch back to hub pattern installation, first uninstall the extension:

  ${YELLOW}gemini extension uninstall superpowers${NC}

Then run this installer again without --native.

EOF
}

# ------------------------------------------------------------------------------
# Main Installation Flow
# ------------------------------------------------------------------------------

main() {
    log_info "Superpowers Installer v${VERSION}"
    log_info "Mode: ${MODE}"
    
    parse_arguments "$@"
    
    if [ "$MODE" = "native" ]; then
        show_native_instructions
        exit 0
    fi
    
    validate_prerequisites
    ensure_directories
    
    log_info "Starting installation in mode: $MODE"
    log_info "Gemini directory: $GEMINI_DIR"
    
    # Core installation steps
    link_skills
    link_agents
    register_hooks
    inject_context
    
    # Post-installation instructions
    cat << EOF

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}
${GREEN}✅ Installation Complete!${NC}
═══════════════════════════════════════════════════════════════════════════════

Next steps:
1. ${YELLOW}Restart Gemini CLI${NC} to activate Superpowers
2. Ask Gemini: ${YELLOW}"Do you have superpowers?"${NC}
3. List available skills: ${YELLOW}/skills list${NC}

Important notes:
• Gemini CLI treats skill context as ${YELLOW}advisory${NC}, not mandatory
• For reliable skill activation, ${YELLOW}explicitly mention skill names${NC}
• Example: "use the brainstorming skill" or "help me debug using systematic-debugging"

Installation mode: ${MODE}
Skills directory: ${SKILLS_DIR}
Agents directory: ${AGENTS_DIR}

To update Superpowers:
  ${YELLOW}cd $REPO_DIR && git pull && .gemini/install.sh${NC}

For troubleshooting, see: ${REPO_DIR}/.gemini/INSTALL.md

EOF
    
    if [ "$MODE" = "antigravity" ]; then
        cat << EOF
${YELLOW}Antigravity Installation Notes:${NC}
• Skills are installed to $GEMINI_DIR/skills/
• Antigravity will automatically discover these skills
• Restart Antigravity if running

EOF
    fi
}

# ------------------------------------------------------------------------------
# Script Entry Point
# ------------------------------------------------------------------------------

# Only run main if script is executed, not sourced
if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
    main "$@"
fi