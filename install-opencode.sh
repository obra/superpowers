#!/usr/bin/env bash
set -euo pipefail

# Superpowers OpenCode Installer
# Syncs agents, commands, and skills to OpenCode config directory

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Calculate checksum for a file
calculate_checksum() {
    local file="$1"
    if [[ -f "$file" ]]; then
        if command -v sha256sum &> /dev/null; then
            sha256sum "$file" | awk '{print $1}'
        else
            shasum -a 256 "$file" | awk '{print $1}'
        fi
    else
        echo ""
    fi
}

# Get script directory (where superpowers is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default target directory (using test directory for safe development)
DEFAULT_TARGET="$HOME/.config/opencode"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Superpowers OpenCode Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will sync superpowers content to your OpenCode config:"
echo "  • agents/  → agent/"
echo "  • commands/ → command/"
echo "  • skills/  → skills/"
echo ""

# Prompt for target directory
read -p "Install to ${DEFAULT_TARGET}? [Y/n] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Enter target directory: " TARGET_DIR
    TARGET_DIR="${TARGET_DIR/#\~/$HOME}" # Expand tilde
else
    TARGET_DIR="$DEFAULT_TARGET"
fi

# Verify target directory
if [[ ! -d "$TARGET_DIR" ]]; then
    echo -e "${YELLOW}Warning: Directory does not exist: ${TARGET_DIR}${NC}"
    read -p "Create it? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    else
        mkdir -p "$TARGET_DIR"
        echo -e "${GREEN}✓ Created ${TARGET_DIR}${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Target directory: ${TARGET_DIR}${NC}"
echo ""

# Phase 1: Collection
echo -e "${BLUE}Phase 1: Scanning files...${NC}"
echo ""

# Create temp file to store file metadata
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Process each directory mapping
scan_directory() {
    local source_name="$1"
    local target_name="$2"
    local source_dir="$SCRIPT_DIR/$source_name"
    local target_subdir="$TARGET_DIR/$target_name"
    
    if [[ ! -d "$source_dir" ]]; then
        echo -e "${YELLOW}⚠ Skipping ${source_name}/ (not found)${NC}"
        return
    fi
    
    echo "Scanning ${source_name}/ ..."
    
    # Find all files recursively
    while IFS= read -r -d '' source_file; do
        # Get relative path from source directory
        local rel_path="${source_file#$source_dir/}"
        local target_file="$target_subdir/$rel_path"
        
        # Determine action needed
        local action
        if [[ ! -f "$target_file" ]]; then
            action="new"
        else
            # File exists - check if changed
            local source_checksum=$(calculate_checksum "$source_file")
            local target_checksum=$(calculate_checksum "$target_file")
            
            if [[ "$source_checksum" == "$target_checksum" ]]; then
                action="skip"
            else
                action="prompt"
            fi
        fi
        
        # Store: action|source_file|target_file
        echo "${action}|${source_file}|${target_file}" >> "$TEMP_FILE"
    done < <(find "$source_dir" -type f -print0)
}

# Scan each source directory
scan_directory "agents" "agent"
scan_directory "commands" "command"
scan_directory "skills" "skills"

echo ""
echo -e "${GREEN}✓ Scan complete${NC}"
echo ""

# Phase 2: Collect user decisions for changed files
echo -e "${BLUE}Phase 2: Resolving conflicts...${NC}"
echo ""

CONFLICT_COUNT=0
# Create a temp file for updated actions
TEMP_ACTIONS=$(mktemp)
trap "rm -f $TEMP_FILE $TEMP_ACTIONS" EXIT

while IFS='|' read -r action source_file target_file; do
    if [[ "$action" == "prompt" ]]; then
        CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
        
        # Get relative path for display
        rel_path="${target_file#$TARGET_DIR/}"
        
        echo -e "${YELLOW}File changed: ${rel_path}${NC}"
        echo "  Source: ${source_file}"
        echo "  Target: ${target_file}"
        
        while true; do
            read -p "[O]verwrite or [S]kip? " -n 1 -r
            echo ""
            
            case $REPLY in
                [Oo])
                    action="overwrite"
                    echo -e "${GREEN}  → Will overwrite${NC}"
                    break
                    ;;
                [Ss])
                    action="skip"
                    echo -e "${BLUE}  → Will skip${NC}"
                    break
                    ;;
                *)
                    echo "  Invalid choice. Please enter O or S."
                    ;;
            esac
        done
        echo ""
    fi
    
    # Write updated action to temp file
    echo "${action}|${source_file}|${target_file}" >> "$TEMP_ACTIONS"
done < "$TEMP_FILE"

# Replace temp file with updated actions
mv "$TEMP_ACTIONS" "$TEMP_FILE"

if [[ $CONFLICT_COUNT -eq 0 ]]; then
    echo -e "${GREEN}✓ No conflicts found${NC}"
else
    echo -e "${GREEN}✓ Resolved ${CONFLICT_COUNT} conflict(s)${NC}"
fi
echo ""

# Phase 3: Display summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Summary of planned changes:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count actions
NEW_COUNT=0
OVERWRITE_COUNT=0
SKIP_COUNT=0

# Create temp files for each category
TEMP_NEW=$(mktemp)
TEMP_OVERWRITE=$(mktemp)
TEMP_SKIP=$(mktemp)
trap "rm -f $TEMP_FILE $TEMP_NEW $TEMP_OVERWRITE $TEMP_SKIP" EXIT

while IFS='|' read -r action source_file target_file; do
    # Get relative path for display
    rel_path="${target_file#$TARGET_DIR/}"
    
    case "$action" in
        new)
            NEW_COUNT=$((NEW_COUNT + 1))
            echo "$rel_path" >> "$TEMP_NEW"
            ;;
        overwrite)
            OVERWRITE_COUNT=$((OVERWRITE_COUNT + 1))
            echo "$rel_path" >> "$TEMP_OVERWRITE"
            ;;
        skip)
            SKIP_COUNT=$((SKIP_COUNT + 1))
            echo "$rel_path" >> "$TEMP_SKIP"
            ;;
    esac
done < "$TEMP_FILE"

# Display new files
if [[ $NEW_COUNT -gt 0 ]]; then
    echo -e "${GREEN}Will copy (${NEW_COUNT} new files):${NC}"
    sort "$TEMP_NEW" | while read -r rel_path; do
        echo "  ✓ $rel_path"
    done
    echo ""
fi

# Display overwrites
if [[ $OVERWRITE_COUNT -gt 0 ]]; then
    echo -e "${YELLOW}Will overwrite (${OVERWRITE_COUNT} files):${NC}"
    sort "$TEMP_OVERWRITE" | while read -r rel_path; do
        echo "  ⚠ $rel_path"
    done
    echo ""
fi

# Display skips
if [[ $SKIP_COUNT -gt 0 ]]; then
    echo -e "${BLUE}Will skip (${SKIP_COUNT} files - keeping your version):${NC}"
    sort "$TEMP_SKIP" | while read -r rel_path; do
        echo "  → $rel_path"
    done
    echo ""
fi

# Check for opencode.json
if [[ -f "$TARGET_DIR/opencode.json" ]] || [[ -f "$TARGET_DIR/opencode.jsonc" ]]; then
    config_file="$TARGET_DIR/opencode.json"
    [[ -f "$TARGET_DIR/opencode.jsonc" ]] && config_file="$TARGET_DIR/opencode.jsonc"
    
    if ! grep -q "opencode-skills" "$config_file" 2>/dev/null; then
        echo -e "${YELLOW}Note: Add \"opencode-skills\" to your plugin array in opencode.json${NC}"
        echo ""
    fi
else
    echo -e "${YELLOW}Note: Run /init in OpenCode to create opencode.json${NC}"
    echo ""
fi

# Final confirmation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Proceed with installation? [Y/n] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${RED}Installation cancelled.${NC}"
    exit 0
fi

# Phase 4: Execute
echo ""
echo -e "${BLUE}Phase 4: Installing...${NC}"
echo ""

COPIED_COUNT=0
OVERWRITTEN_COUNT=0
ERROR_COUNT=0

while IFS='|' read -r action source_file target_file; do
    # Skip files marked as skip
    if [[ "$action" == "skip" ]]; then
        continue
    fi
    
    # Create target directory if needed
    target_dir="$(dirname "$target_file")"
    if [[ ! -d "$target_dir" ]]; then
        mkdir -p "$target_dir" || {
            echo -e "${RED}✗ Failed to create directory: ${target_dir}${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            continue
        }
    fi
    
    # Get relative path for display
    rel_path="${target_file#$TARGET_DIR/}"
    
    # Copy file
    if cp "$source_file" "$target_file"; then
        if [[ "$action" == "new" ]]; then
            echo -e "${GREEN}✓ Copied: ${rel_path}${NC}"
            COPIED_COUNT=$((COPIED_COUNT + 1))
        elif [[ "$action" == "overwrite" ]]; then
            echo -e "${YELLOW}✓ Overwrote: ${rel_path}${NC}"
            OVERWRITTEN_COUNT=$((OVERWRITTEN_COUNT + 1))
        fi
    else
        echo -e "${RED}✗ Failed to copy: ${rel_path}${NC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done < "$TEMP_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ERROR_COUNT -eq 0 ]]; then
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "Copied: ${COPIED_COUNT} files"
    echo "Overwrote: ${OVERWRITTEN_COUNT} files"
    echo "Skipped: ${SKIP_COUNT} files"
else
    echo -e "${RED}Installation completed with errors${NC}"
    echo ""
    echo "Copied: ${COPIED_COUNT} files"
    echo "Overwrote: ${OVERWRITTEN_COUNT} files"
    echo "Skipped: ${SKIP_COUNT} files"
    echo "Errors: ${ERROR_COUNT} files"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Display next steps
echo "Next steps:"
echo ""
echo "1. Ensure your opencode.json includes the plugin:"
echo "   {\"plugin\": [\"opencode-skills\"]}"
echo ""
echo "2. Restart OpenCode to load the skills"
echo ""
echo "3. (Optional) Use /init in OpenCode to create AGENTS.md"
echo "   with custom instructions about the skills system"
echo ""
