# Gemini CLI & Antigravity Integration: Consolidated Proposal

**Date**: February 28, 2026  
**Author**: Analysis by Crush AI Assistant  
**Current Branch**: `feature/gemini-cli-support`  
**Status**: Clean (no uncommitted changes)

## Executive Summary

After analyzing **14 open** and **11 closed** pull requests related to Gemini CLI and Antigravity integration, three distinct architectural patterns have emerged, each with strengths and weaknesses. This proposal recommends a **unified approach** that combines the best elements of each while addressing the fundamental limitations identified in Issue #128 (Gemini CLI's advisory context model).

### Key Findings

1. **Multiple Competing Approaches**: 25 PRs show community experimentation with different integration strategies
2. **Architectural Limitation**: Gemini CLI treats `GEMINI.md` as advisory context, making skill auto-activation unreliable (Issue #128)
3. **Recent Improvements**: Gemini CLI v0.30.0+ may have enhanced auto-activation heuristics and hook systems
4. **Shared Infrastructure**: Antigravity and Gemini CLI share the `~/.gemini/` directory structure
5. **Community Evolution**: PRs show progression from manual scripts to native extensions to automated CI pipelines

### Recommended Unified Approach

A **hybrid architecture** combining:
- **Hub Pattern** symlinks for skill discovery (from PR #499/#537)
- **Native Extension** structure with hooks (from PR #570)  
- **Automated Builder** for slash commands and CI (from PR #563)
- **Realistic Documentation** about auto-activation limitations and explicit invocation

---

## PR Analysis Summary

### Open PRs (Key Integration Approaches)

#### PR #570: Complete Native Extension Package
- **Approach**: Full `.gemini-cli/` directory as native Gemini CLI extension
- **Strengths**: Native extension experience, comprehensive hook system, MCP server
- **Weaknesses**: New directory structure (`.gemini-cli/` vs `.gemini/`), potential user confusion
- **Status**: Open, ready for review

#### PR #563: Automated Builder + CI Pipeline  
- **Approach**: Python builder generating slash commands + GitHub Actions CI
- **Strengths**: Automated updates, comprehensive testing, CI/CD pipeline
- **Weaknesses**: Adds Python build system complexity, over-engineering for some
- **Status**: Open, active development

#### PR #537: Manual Installer with Symlinks (Partially Merged)
- **Approach**: Bash installer with individual skill symlinks ("hub pattern")
- **Strengths**: Simple, familiar pattern, works with existing `.gemini/` structure
- **Weaknesses**: Manual updates, limited automation
- **Status**: Partially merged into current branch

#### PR #535: Native Antigravity Support
- **Approach**: Shared `.gemini/` infrastructure for both Gemini CLI and Antigravity
- **Strengths**: Unified approach for both tools, shared configuration
- **Weaknesses**: Auto-activation limitations apply to both
- **Status**: Open

#### PR #499: Hub Pattern for Gemini CLI/Antigravity
- **Approach**: Shell-based installer with symlinks and context injection
- **Strengths**: Lightweight, follows existing patterns, community-tested
- **Weaknesses**: No slash command support, Claude-specific language in skills
- **Status**: Open

#### PR #488: Antigravity IDE Integration (Documentation)
- **Approach**: Documentation-only with symlink architecture
- **Strengths**: Lightweight, security-focused, cross-platform
- **Weaknesses**: Documentation-only, no code changes
- **Status**: Open

#### PR #395: PRD for Native Skills Install/Update
- **Approach**: Product Requirements Document for agent-driven installation
- **Strengths**: Strategic vision, addresses long-term maintenance
- **Weaknesses**: Documentation-only, not implemented
- **Status**: Closed

#### PR #281: Antigravity Installation Instructions
- **Approach**: README updates for manual file-based integration
- **Strengths**: Simple, manual approach for Antigravity users
- **Weaknesses**: Unverified path assumptions, limited testing
- **Status**: Open

#### PR #192: Antigravity IDE Integration (Initial)
- **Approach**: Initial integration with CLI wrapper, later simplified to documentation
- **Strengths**: Evolved based on feedback, simplified approach
- **Weaknesses**: Closed in favor of PR #488
- **Status**: Closed

### Closed PRs (Evolutionary History)

#### PR #550: Google Antigravity Support
- **Approach**: Documentation for symlink integration
- **Outcome**: Closed due to Antigravity directory discovery issues
- **Lesson**: Antigravity's default directory searching behavior inconsistent

#### PR #497: Installation Script and Docs
- **Approach**: Automated shell script for Gemini CLI/Antigravity
- **Outcome**: Closed to rebase and update
- **Lesson**: Early implementation of hub pattern

#### PR #320: Gemini CLI Integration (Node.js CLI)
- **Approach**: Node.js utility with extension hooks and bootstrap
- **Outcome**: Closed but functionality verified
- **Lesson**: Comprehensive extension approach with security fixes

#### PR #264: Antigravity Install Guide
- **Approach**: Manual installation instructions
- **Outcome**: Closed due to unverifiable tool legitimacy
- **Lesson**: Need for official documentation and verification

#### PR #124: PRPM Support
- **Approach**: Package manager distribution
- **Outcome**: Closed - owner rejected skills-only distribution
- **Lesson**: Superpowers requires bootstrap mechanism, not just skills

### Current Branch State
- **`.gemini/` directory**: Contains installer and context files (PR #537 approach)
- **`gemini-extension.json`**: Root-level extension manifest
- **No `.gemini-cli/` directory**: Missing PR #570 native extension
- **No Python builder scripts**: Missing PR #563 automation
- **Recent commits**: Address PR #537 feedback, cross-branch consistency, auto-activation gap fixes

---

## Architectural Assessment

### Issue #128 Critical Findings (November 2025)
- **GEMINI.md as Advisory Context**: Gemini CLI treats context files as suggestions, not executable instructions
- **No Reliable Auto-Triggering**: Skills don't auto-activate reliably due to architectural differences
- **Community Workarounds**: Custom wrapper scripts (`earchibald/gemini-superpowers`, `tomioe` bash script)

### Recent Gemini CLI Improvements (v0.30.0+)
- **Enhanced Skill Matching**: Better heuristics for matching user requests
- **Improved Hook System**: More reliable BeforeAgent/BeforeTool hook execution  
- **Deterministic Routing**: Better support for deterministic skill routing via hooks
- **Community Extensions**: Mature ecosystem with proven workarounds

### Symlink Strategy Analysis
| Platform | Symlink Strategy | Directory Structure |
|----------|------------------|---------------------|
| **Gemini CLI** | Individual symlinks per skill ("hub pattern") | `~/.gemini/skills/<skill-name>` |
| **Antigravity** | Shared `.gemini/` directory | `~/.gemini/antigravity/skills/` |
| **Codex** | Single directory symlink | `~/.agents/skills/superpowers` |
| **OpenCode** | Two symlinks (plugin + skills) | `~/.opencode/plugins/` + `~/.opencode/skills/` |

**Hub Pattern**: Individual symlinks are **used for Gemini CLI** but **not exclusively recommended** by Obra Superpowers. Pros: individual skill updates, clear visibility. Cons: many symlinks, permission issues.

---

## Recommended Unified Architecture

### Core Principles
1. **Single Directory Structure**: Use `.gemini/` (not `.gemini-cli/`) for consistency with Antigravity
2. **Dual Installation Paths**: Support both manual symlinks and native extension installation
3. **Realistic Expectations**: Document auto-activation limitations, promote explicit skill invocation
4. **Automation Where Helpful**: Generate slash commands via CI, but keep core simple
5. **Cross-Platform Compatibility**: Support Windows, macOS, Linux equally

### Directory Structure
```
.gemini/
├── install.sh                    # Manual installer (hub pattern)
├── INSTALL.md                    # Installation instructions
├── GEMINI.md                     # Context file with terminology mapping
├── gemini-extension.json         # Extension manifest for native installation
├── hooks/
│   ├── session-start.js          # Session start hook for auto-activation attempts
│   └── hooks.json                # Hook definitions
├── mcp-server/                   # MCP server for tool compatibility (optional)
└── commands/                     # Generated slash commands (TOML files)
```

### Component Integration

#### 1. Manual Installer (Hub Pattern)
- Keep and enhance `.gemini/install.sh` from PR #537
- Add support for Antigravity paths (`~/.gemini/antigravity/skills/`)
- Improve error handling and cross-platform symlink creation
- Maintain context injection with idempotent markers

#### 2. Native Extension Support
- Adopt extension manifest from PR #570 and keep at repository root
- Include session-start hooks for deterministic skill routing
- Support `gemini extensions install https://github.com/obra/superpowers`
- Include MCP server for enhanced tool compatibility (optional)

#### 3. Automated Builder (CI Pipeline)
- Adapt PR #563's Python builder to generate:
  - Slash commands (TOML files) for deterministic invocation
  - Updated `GEMINI.md` with optimized skill descriptions
  - Extension artifacts for orphaned `gemini-cli` branch
- Run via GitHub Actions on pushes to `main`
- Generate distribution branch for clean extension installation

#### 4. Documentation Strategy
- Merge best documentation from PR #488, #281, #570
- Clearly explain:
  - Gemini CLI's advisory context model vs Claude Code's mandatory hooks
  - Explicit skill invocation recommendations
  - Auto-activation limitations and recent improvements
  - Migration path from current installations

### Skill Activation Strategy
1. **Primary**: Explicit invocation ("use the brainstorming skill")
2. **Secondary**: Deterministic hooks (BeforeAgent) for skill routing
3. **Tertiary**: Auto-activation attempts via enhanced skill descriptions
4. **Fallback**: Slash commands (`/brainstorm`, `/plan`) for reliable triggers

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. **Consolidate `.gemini/` directory**
   - Merge PR #570's native extension components into `.gemini/`
   - Update `gemini-extension.json` to point to `.gemini/` directory
   - Add session-start hooks for deterministic routing

2. **Enhance Installer Script**
   - Integrate Antigravity support (shared `.gemini/` directory)
   - Improve cross-platform symlink creation
   - Add uninstall/cleanup functionality

3. **Update Documentation**
   - Merge documentation from all PRs
   - Add realistic expectations section
   - Include troubleshooting guide

### Phase 2: Automation (Week 2)
1. **Adapt Python Builder**
   - Modify PR #563's builder to generate `.gemini/commands/` TOML files
   - Create GitHub Actions workflow for automated updates
   - Set up orphaned `gemini-cli` branch for distribution

2. **Add MCP Server (Optional)**
   - Implement MCP server from PR #570 for enhanced tool compatibility
   - Make optional for users who need advanced tool mapping

### Phase 3: Testing & Validation (Week 3)
1. **Test Suite**
   - Leverage PR #563's 58-test Python suite
   - Add Gemini CLI-specific test cases
   - Test on Windows, macOS, Linux

2. **Community Validation**
   - Test with latest Gemini CLI v0.30.0+
   - Validate auto-activation improvements
   - Gather user feedback

### Phase 4: Migration & Release (Week 4)
1. **Migration Path**
   - Update existing `.gemini/install.sh` users
   - Provide migration script if needed
   - Update all open PRs with consolidation plan

2. **Release Strategy**
   - Version bump to 4.4.0
   - Update RELEASE-NOTES.md
   - Announce unified Gemini/Antigravity support

---

## Files to Create/Modify

### New Files
```
.gemini/hooks/session-start.js          # Session start hook
.gemini/hooks/hooks.json                # Hook definitions
.gemini/commands/                       # Generated slash commands
.gemini/mcp-server/                     # Optional MCP server
scripts/gemini-builder/                 # Adapted from PR #563
.github/workflows/gemini-ci.yml         # CI pipeline
```

### Modified Files
```
.gemini/install.sh                      # Enhanced with Antigravity support
.gemini/GEMINI.md                       # Updated with better skill descriptions
.gemini/INSTALL.md                      # Consolidated installation guide
.gemini/gemini-extension.json           # Updated manifest
docs/README.gemini.md                   # Unified documentation
README.md                               # Updated installation section
```

### Deleted/Deprecated Files
```
gemini-extension.json (root)            # Move to .gemini/gemini-extension.json
```

---

## Risk Mitigation

### Technical Risks
1. **Auto-activation Unreliability**
   - **Mitigation**: Document explicit invocation as primary method
   - **Fallback**: Provide slash commands for deterministic triggers

2. **Directory Structure Conflicts**
   - **Mitigation**: Use `.gemini/` (existing standard) not `.gemini-cli/`
   - **Testing**: Validate with both Gemini CLI and Antigravity

3. **Cross-Platform Symlink Issues**
   - **Mitigation**: Robust fallbacks (Python relative path calculation)
   - **Testing**: Validate on Windows (junctions), macOS, Linux

### Community Risks
1. **Multiple Competing PRs**
   - **Mitigation**: Engage PR authors in consolidation discussion
   - **Approach**: Credit contributors, merge best elements

2. **User Confusion**
   - **Mitigation**: Clear documentation, migration guides
   - **Support**: Troubleshooting guide with common issues

### Maintenance Risks
1. **Builder Complexity**
   - **Mitigation**: Make builder optional, keep core simple
   - **Documentation**: Clear separation between core and automation

---

## Success Metrics

1. **Installation Success Rate**: >95% successful installations across platforms
2. **Skill Discovery**: All skills appear in `/skills list` command
3. **Explicit Invocation**: 100% reliability when users explicitly invoke skills
4. **Auto-activation Improvement**: Measurable improvement with Gemini CLI v0.30.0+
5. **Community Adoption**: Positive feedback from Gemini CLI and Antigravity users

---

## Conclusion

The Gemini CLI and Antigravity integration presents unique challenges due to architectural differences from Claude Code. However, by consolidating the best elements from 25 community PRs, we can create a unified solution that:

1. **Respects Platform Differences**: Acknowledges Gemini CLI's advisory context model
2. **Provides Multiple Pathways**: Supports both manual installation and native extension
3. **Sets Realistic Expectations**: Clearly documents auto-activation limitations
4. **Leverages Community Work**: Incorporates proven approaches from multiple contributors
5. **Prepares for Future**: Adaptable to Gemini CLI's evolving skill activation improvements

**Recommended Immediate Action**: 
1. Merge PR #570's native extension components into `.gemini/` directory
2. Enhance existing `.gemini/install.sh` with Antigravity support
3. Update documentation with consolidated approach and realistic expectations
4. Engage PR authors (#563, #499, #488, #281) in consolidation discussion

This unified approach addresses the core Issue #128 limitations while providing a robust, maintainable integration for both Gemini CLI and Antigravity users.