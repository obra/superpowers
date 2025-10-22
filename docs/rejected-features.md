# Rejected Features Log

This document tracks features evaluated but not integrated during repository consolidation.

Each rejection includes reasoning to prevent future reconsideration without new context.

---

## superpowers-skills

### remembering-conversations
- **Source**: superpowers-skills/skills/collaboration/remembering-conversations/
- **Type**: Skill with custom tooling
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Redundant with existing local-semantic-memory MCP server. User is developing V2 of memory server that will incorporate this functionality as a plugin. Custom tooling adds maintenance burden without providing capability advantage over the existing MCP server implementation.

### gardening-skills-wiki
- **Source**: superpowers-skills/skills/meta/gardening-skills-wiki/
- **Type**: Skill with bash tooling
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Architecture mismatch. Designed for INDEX.md-based wiki structure, but superpowers uses Claude Code first-party skills system without INDEX files. Bash scripts expect structure that doesn't exist. Would require complete rewrite for minimal benefit.

