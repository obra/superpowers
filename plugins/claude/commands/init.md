---
description: Initialize ACE project structure
---

# /ace-init - Initialize ACE Project

Initialize or verify the ACE project environment.

## Steps

### 1. Check Store Directory
Run `python -c "import os; p = os.path.expanduser('~/.ace/store'); print(f'Store exists: {os.path.isdir(p)}')"`.

If it doesn't exist, run:
```bash
python -c "
from src.cli.commands.init_cmd import _init_dirs
_init_dirs()
print('ACE store initialized at ~/.ace/store')
"
```

### 2. Check Trace Directory
Ensure `~/.ace/store/traces/` exists:
```bash
mkdir -p ~/.ace/store/traces
```

### 3. Detect Available Simulators
```bash
python -c "
from src.core.simulator.registry import SimulatorRegistry
reg = SimulatorRegistry()
print('Available simulators:')
for name in reg.list_simulators():
    print(f'  - {name}')
"
```

### 4. Detect Available Devices
```bash
python -c "
from src.core.devices.registry import DeviceRegistry
reg = DeviceRegistry()
for d in reg.list_devices():
    print(f'  - {d[\"id\"]}: {d.get(\"name\", d[\"id\"])}')
"
```

### 5. Check MCP Server Configuration
Verify `.claude/settings.local.json` has the ACE MCP server configured. If not, suggest adding:
```json
{
  "mcpServers": {
    "ace": {
      "command": "python",
      "args": ["-m", "src.core.mcp"],
      "cwd": "<project_root>"
    }
  }
}
```

### 6. Seed Knowledge Base
If the knowledge base is empty, seed it with domain knowledge from `docs/` and device SKILL.md files:
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def seed():
    km = KnowledgeManager(FileStorage())
    result = await km.list_knowledge(page_size=1)
    if result['total'] == 0:
        print('Knowledge base empty - seeding recommended')
        print('Run: ace knowledge import <knowledge_file>')
    else:
        print(f'Knowledge base has {result[\"total\"]} entries')
asyncio.run(seed())
"
```

### 7. Run Tests
Verify the installation:
```bash
python -m pytest tests/core/ -q --tb=short
```

### 8. Summary
Report what was set up and what's available. Include device count, simulator count, knowledge entry count, and test results.
