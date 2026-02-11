# Memory Workflow

Three memory systems serve different roles. Use the right one at the right time.

## The Three Systems

| System | Role | Storage | Scope |
|--------|------|---------|-------|
| **Auto-memory** (MEMORY.md) | Working memory | `~/.claude/projects/*/memory/` | Cross-session, always loaded |
| **Git-notes** (knowledge_base) | Project memory | `refs/notes/superpowers` per repo | Per-repo, accumulated decisions/patterns |
| **Episodic Memory** | Recall memory | Conversation archive | Cross-session, searchable transcripts |

## When to READ

| Trigger | System | Command |
|---------|--------|---------|
| Every session start | Auto-memory | Automatic (loaded into system prompt) |
| Starting brainstorming | Episodic Memory | `episodic-memory:search-conversations` for related past work |
| Before design decisions | Git-notes | `node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.decisions` |
| Before implementation | Git-notes | `node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.patterns` |
| "Did we discuss X?" | Episodic Memory | Semantic search through archive |
| Unfamiliar domain term | Git-notes | `node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.glossary` |

## When to WRITE

| Trigger | System | Command |
|---------|--------|---------|
| Architecture decision made | Git-notes | `memorize knowledge_base.decisions --value '{"id":"ADR-NNN", ...}'` |
| Pattern discovered | Git-notes | `memorize knowledge_base.patterns --value '{"title":"...", ...}'` |
| Domain term clarified | Git-notes | `memorize knowledge_base.glossary --value '{"term":"definition"}'` |
| Infrastructure change (IPs, creds) | Auto-memory | Edit MEMORY.md directly |
| Session ends | Auto-memory | `sync-memory.sh` hook (automatic) |
| Human-readable export needed | Git-notes | `node ${SUPERPOWERS_DIR}/commands/snapshot-memory.js` |

## Decision Record Format (ADR)

```json
{
  "id": "ADR-NNN",
  "title": "Short descriptive title",
  "status": "accepted|superseded|deprecated",
  "context": "What situation prompted this decision",
  "decision": "What we decided and why",
  "consequences": "What follows from this decision"
}
```

## Pattern Format

```json
{
  "title": "Pattern name",
  "description": "When and why to use this pattern",
  "code": "Example code or command",
  "language": "python|javascript|bash|etc"
}
```

## Glossary Format

Pass as object — keys are terms, values are definitions:

```json
{"TermName": "Definition of the term in project context"}
```

## What Goes Where

**Auto-memory (MEMORY.md)** — information needed EVERY session regardless of task:
- Network topology, server IPs, credentials
- Deployment commands and paths
- API endpoints and keys
- IIS sites, database connection strings

**Git-notes (knowledge_base)** — project-specific knowledge that accumulates:
- `decisions`: Why we chose approach X over Y (ADRs)
- `patterns`: Established code patterns with examples
- `glossary`: Domain terms and their meaning in this project

**Episodic Memory** — never written to manually:
- Passive archival of all conversations
- Used for "what did we discuss about X?" queries
- Provides evidence for decisions when context is lost

## Command Reference

All commands run from any repo directory. `${SUPERPOWERS_DIR}` = path to superpowers installation.

```bash
# Recall specific section
node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.decisions
node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.patterns
node ${SUPERPOWERS_DIR}/commands/recall.js knowledge_base.glossary

# Store a decision
node ${SUPERPOWERS_DIR}/commands/memorize.js knowledge_base.decisions --value '{"id":"ADR-001","title":"...","status":"accepted","context":"...","decision":"...","consequences":"..."}'

# Store a pattern
node ${SUPERPOWERS_DIR}/commands/memorize.js knowledge_base.patterns --value '{"title":"...","description":"...","code":"...","language":"bash"}'

# Store glossary terms
node ${SUPERPOWERS_DIR}/commands/memorize.js knowledge_base.glossary --value '{"Term":"Definition"}'

# Export human-readable snapshot
node ${SUPERPOWERS_DIR}/commands/snapshot-memory.js
# Writes to docs/memory/SNAPSHOT.md in current repo
```
