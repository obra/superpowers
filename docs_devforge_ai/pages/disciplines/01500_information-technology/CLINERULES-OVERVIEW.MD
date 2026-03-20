# ClineRules Configuration Overview

```markdown
## Core Components

### Cline Memory Bank Structure
```
📂 memory-bank/
├── projectbrief.md       - Core requirements & goals  
├── productContext.md     - Problem space & UX  
├── activeContext.md      - Current work state  
├── systemPatterns.md     - Architecture & patterns  
├── techContext.md        - Tech stack details  
└── progress.md           - Implementation status

### Key Workflows
1. **Plan Mode:**  
   - Read all Memory Bank files
   - Verify context completeness
   - Develop execution strategy

2. **Act Mode:**  
   - Continuous documentation updates
   - Pattern discovery tracking
   - Change implementation logging

## SQL Organization Rules
```json
{
  "naming_conventions": {
    "migrations": "migration-{timestamp}-{description}.sql",
    "test_data": "test-{table_name}-data.sql"
  },
  "validation": {
    "script_requirements": [
      "RLS policy documentation",
      "Index definitions",
      "Referential integrity checks"
    ]
  }
}
```

## Documentation Requirements
- Update Memory Bank after significant changes
- Maintain 130+ documentation files covering:
  - System architecture
  - Component implementations
  - Security models
  - Page-specific configurations
