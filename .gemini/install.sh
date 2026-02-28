#!/bin/bash
set -euo pipefail

# ==============================================================================
# Superpowers Hybrid Installer for Gemini CLI
# ==============================================================================
# Features:
# 1. Hub pattern symlinks for skills and agents (default)
# 2. Antigravity support (--antigravity flag)
# 3. Native extension detection and suggestion (--native flag)
# 4. Deterministic hook registration enabled by default (--no-hooks to disable)
# 5. Cross-platform compatibility with GEMINI_HOME support
# ==============================================================================

readonly VERSION="5.0.0"
readonly SCRIPT_NAME="install.sh"
readonly REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Configuration
MODE="standard"           # standard, antigravity, native
ENABLE_HOOKS=true         # Default: enable deterministic routing hooks
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
Superpowers Hybrid Installer for Gemini CLI v${VERSION}

A unified installer supporting multiple installation methods with deterministic
skill routing hooks enabled by default.

Usage: $SCRIPT_NAME [OPTIONS]

Options:
  --antigravity    Install for Antigravity (~/.gemini/antigravity/skills/)
  --native         Show native extension installation instructions
  --no-hooks       Skip hook registration (use YOLO mode instead)
  --help           Show this help message

Environment Variables:
  GEMINI_HOME      Override Gemini directory (default: ~/.gemini)

Installation Methods:
  1. Standard (default): Hub pattern symlinks with deterministic hooks
  2. Antigravity: Install to Antigravity's skill directory
  3. Native Extension: Gemini CLI v0.28.0+ extension system

Auto-Activation Strategies:
  • Hooks (default): Deterministic routing via superpowers-router/superpowers-guard
  • YOLO Mode: Use --yolo flag or Ctrl+Y for Gemini CLI auto-approval
  • Explicit Invocation: "use the brainstorming skill"

Examples:
  $SCRIPT_NAME                    # Standard with hooks
  $SCRIPT_NAME --antigravity      # Antigravity with hooks
  $SCRIPT_NAME --native           # Native extension instructions
  $SCRIPT_NAME --no-hooks         # Skip hooks (use YOLO/explicit invocation)

For more details: $REPO_DIR/.gemini/INSTALL.md
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
            --no-hooks)
                ENABLE_HOOKS=false
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
    # Check skills directory exists
    if [ ! -d "$REPO_SKILLS_DIR" ]; then
        die "Skills directory not found at $REPO_SKILLS_DIR"
    fi

    # Check Gemini CLI version if available
    if command -v gemini >/dev/null 2>&1; then
        GEMINI_VERSION=$(gemini --version 2>/dev/null || echo "unknown")
        log_info "Gemini CLI version: $GEMINI_VERSION"
        
        # Version check for native extensions and YOLO mode
        if [[ "$GEMINI_VERSION" =~ ^v?([0-9]+)\.([0-9]+) ]]; then
            major="${BASH_REMATCH[1]}"
            minor="${BASH_REMATCH[2]}"
            
            if [ "$major" -eq 0 ] && [ "$minor" -lt 28 ]; then
                log_warning "Gemini CLI v0.28.0+ recommended for native extensions. You have $GEMINI_VERSION"
            fi
            
            if [ "$major" -eq 0 ] && [ "$minor" -ge 31 ]; then
                log_info "YOLO mode available (--yolo flag or Ctrl+Y)"
            fi
        fi
    else
        log_warning "Gemini CLI not found in PATH. Ensure it's installed before using skills."
    fi
    
    # Check for Node.js if hooks enabled
    if [ "$ENABLE_HOOKS" = true ] && ! command -v node >/dev/null 2>&1; then
        log_warning "Node.js not found. Hooks require Node.js to run."
        log_warning "Install Node.js or use --no-hooks flag."
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
    
    # Remove existing symlink if it points to our repo
    if [ -L "$target" ]; then
        local link_target
        if command -v realpath >/dev/null 2>&1; then
            link_target="$(realpath "$target")"
        elif command -v python3 >/dev/null 2>&1; then
            link_target="$(python3 -c "import os; print(os.path.realpath('$target'))")"
        else
            link_target="$(readlink -f "$target" 2>/dev/null || readlink "$target")"
        fi
        
        if [[ "$link_target" == "$REPO_DIR"* ]]; then
            rm "$target"
            log_info "  Updating existing symlink: $name"
        else
            log_warning "  $name points elsewhere ($link_target). Skipping."
            return 1
        fi
    elif [ -e "$target" ]; then
        log_warning "  $target exists and is not a symlink. Skipping."
        return 1
    fi
    
    # Create relative symlink if possible
    if ln -sr "$source" "$target" 2>/dev/null; then
        : # GNU ln with -r support
    elif command -v python3 >/dev/null 2>&1; then
        local rel_path
        rel_path="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], os.path.dirname(sys.argv[2])))" "$source" "$target")"
        ln -s "$rel_path" "$target"
    else
        log_warning "  Using absolute path (less portable)"
        ln -s "$source" "$target"
    fi
    
    echo "  ✓ $name"
    return 0
}

link_skills() {
    log_info "Linking skills to $SKILLS_DIR"
    
    local count=0
    for skill_path in "$REPO_SKILLS_DIR"/*/; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            skill_path="${skill_path%/}"
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
        log_info "No agents directory found, skipping"
        return
    fi
    
    log_info "Linking agents to $AGENTS_DIR"
    
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
# Hook Registration (Enabled by Default)
# ------------------------------------------------------------------------------

register_hooks() {
    if [ "$ENABLE_HOOKS" != true ]; then
        log_info "Skipping hook registration (--no-hooks flag used)"
        return 0
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        log_warning "Node.js not found. Cannot register hooks."
        log_warning "Install Node.js or use YOLO mode/ explicit skill invocation."
        return 1
    fi
    
    local ROUTER_PATH="$REPO_DIR/agents/superpowers-router.js"
    local GUARD_PATH="$REPO_DIR/agents/superpowers-guard.js"
    
    if [ ! -f "$ROUTER_PATH" ]; then
        log_warning "Router script not found at $ROUTER_PATH"
        return 1
    fi
    
    log_info "Registering Superpowers hooks in $SETTINGS_FILE"
    
    # Create settings.json if missing
    if [ ! -f "$SETTINGS_FILE" ]; then
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

# BeforeTool: agent-behavior guard
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
        log_warning "Add hooks manually to $SETTINGS_FILE"
        return 1
    fi
}

# ------------------------------------------------------------------------------
# Context Injection
# ------------------------------------------------------------------------------

inject_context() {
    local CONTEXT_SOURCE="$REPO_DIR/.gemini/GEMINI.md"
    local CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
    local CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"
    
    if [ ! -f "$CONTEXT_SOURCE" ]; then
        log_error "Context source not found at $CONTEXT_SOURCE"
        return 1
    fi
    
    # Extract context block
    local CONTEXT_BLOCK
    CONTEXT_BLOCK=$(awk "/$CONTEXT_HEADER/{flag=1} flag; /$CONTEXT_FOOTER/{flag=0}" "$CONTEXT_SOURCE")
    
    # Create GEMINI.md if missing
    if [ ! -f "$GEMINI_MD" ]; then
        touch "$GEMINI_MD"
    fi
    
    # Remove existing block if present
    if grep -q "$CONTEXT_HEADER" "$GEMINI_MD"; then
        log_info "Updating Superpowers context"
        sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$GEMINI_MD"
        rm -f "${GEMINI_MD}.bak"
    else
        log_info "Injecting Superpowers context"
    fi
    
    # Clean up trailing whitespace
    sed -i.bak '/^[[:space:]]*$/d' "$GEMINI_MD" 2>/dev/null && rm -f "${GEMINI_MD}.bak" || true
    
    # Append context block
    if [ -s "$GEMINI_MD" ]; then
        printf '\n%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
    else
        printf '%s\n' "$CONTEXT_BLOCK" >> "$GEMINI_MD"
    fi
    
    log_success "Injected context into $GEMINI_MD"
}

# ------------------------------------------------------------------------------
# Native Extension Instructions
# ------------------------------------------------------------------------------

show_native_instructions() {
    cat << EOF

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}
${GREEN}Native Extension Installation${NC}
═══════════════════════════════════════════════════════════════════════════════

For Gemini CLI v0.28.0+, install as a native extension:

  ${YELLOW}gemini extension install $REPO_DIR/.gemini${NC}

Benefits:
  • Clean integration with Gemini's extension system
  • Automatic updates via ${YELLOW}gemini extension update superpowers${NC}
  • Better future compatibility
  • Includes deterministic routing hooks

After installation, restart Gemini CLI.

To switch back to hub pattern:
  ${YELLOW}gemini extension uninstall superpowers${NC}

EOF
}

# ------------------------------------------------------------------------------
# Post-Installation Summary
# ------------------------------------------------------------------------------

show_summary() {
    local hooks_status="Enabled"
    if [ "$ENABLE_HOOKS" != true ]; then
        hooks_status="Disabled (--no-hooks)"
    fi
    
    cat << EOF

${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}
${GREEN}✅ Installation Complete${NC}
═══════════════════════════════════════════════════════════════════════════════

Installation Summary:
• Mode: ${MODE}
• Hooks: ${hooks_status}
• Skills: ${SKILLS_DIR}
• Agents: ${AGENTS_DIR}

Next Steps:
1. ${YELLOW}Restart Gemini CLI${NC}
2. Ask: ${YELLOW}"Do you have superpowers?"${NC}
3. List skills: ${YELLOW}/skills list${NC}

Auto-Activation Methods:
EOF

    if [ "$ENABLE_HOOKS" = true ]; then
        cat << EOF
• ${GREEN}Deterministic Hooks${NC}: superpowers-router analyzes prompts
• ${YELLOW}YOLO Mode${NC}: Use ${YELLOW}--yolo${NC} flag or Ctrl+Y
• ${YELLOW}Explicit Invocation${NC}: "use the brainstorming skill"
EOF
    else
        cat << EOF
• ${YELLOW}YOLO Mode${NC}: Use ${YELLOW}--yolo${NC} flag or Ctrl+Y (recommended)
• ${YELLOW}Explicit Invocation${NC}: "use the brainstorming skill"
• ${YELLOW}Manual Skill Checks${NC}: Check /skills list before starting work
EOF
    fi

    cat << EOF

To Update:
  ${YELLOW}cd $REPO_DIR && git pull && .gemini/install.sh${NC}

For troubleshooting: ${REPO_DIR}/.gemini/INSTALL.md
EOF

    if [ "$MODE" = "antigravity" ]; then
        cat << EOF

${YELLOW}Antigravity Notes:${NC}
• Skills installed to $SKILLS_DIR
• Antigravity auto-discovers skills
• Restart Antigravity if running
EOF
    fi
}

# ------------------------------------------------------------------------------
# Main Installation Flow
# ------------------------------------------------------------------------------

main() {
    log_info "Superpowers Hybrid Installer v${VERSION}"
    
    parse_arguments "$@"
    
    if [ "$MODE" = "native" ]; then
        show_native_instructions
        exit 0
    fi
    
    validate_prerequisites
    ensure_directories
    
    log_info "Starting installation in mode: $MODE"
    log_info "Gemini directory: $GEMINI_DIR"
    log_info "Hooks enabled: $ENABLE_HOOKS"
    
    # Core installation
    link_skills
    link_agents
    register_hooks
    inject_context
    
    # Summary
    show_summary
}

# ------------------------------------------------------------------------------
# Script Entry Point
# ------------------------------------------------------------------------------

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
    main "$@"
fi