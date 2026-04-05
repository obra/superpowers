---
description: Meta-Evolution Engine
---

# /ace-evolve - Meta-Evolution Engine

Run the evolution cycle across all 4 knowledge levels. Argument: `$ARGUMENTS`

## The Upward Flow

```
L1 Traces → L2 Insights → L3 CLAUDE.md → L4 Memory
```

Each level refines the one below it. This command orchestrates that flow.

## Determine Action

Parse `$ARGUMENTS`:
- `run` → Full evolution cycle across all levels
- `report` → Health report with coverage gaps and reliability scores
- `project <type>` → Generate/update product-level CLAUDE.md for a specific device/domain
- No arguments → Run the full cycle

## Action: run

Execute the complete evolution cycle:

### Step 1: L1→L2 - Extract Patterns from Traces

```bash
python -c "
import asyncio
from src.core.evolution.trace import TraceStore
from src.core.evolution.patterns import extract_all_patterns

async def extract():
    store = TraceStore()
    # Get traces from last 7 days
    from datetime import datetime, timezone, timedelta
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    traces = store.query(since=since, limit=1000)
    print(f'Analyzing {len(traces)} traces from last 7 days...')

    candidates = extract_all_patterns(traces)
    print(f'Found {len(candidates)} pattern candidates:')
    for c in candidates:
        print(f'  [{c.knowledge_type}] {c.name} (confidence: {c.confidence:.2f})')
    return candidates
asyncio.run(extract())
"
```

For each candidate with confidence > 0.5, create a knowledge entry:
```python
from src.core.knowledge.manager import KnowledgeManager
km = KnowledgeManager(FileStorage())
await km.create_knowledge_versioned(candidate.to_knowledge_dict())
```

### Step 2: L2 Internal - Score, Decay, GC

```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def decay():
    km = KnowledgeManager(FileStorage())
    result = await km.decay_all()
    print(f'Decayed: {result[\"decayed\"]} entries')
    print(f'Below threshold: {result[\"demoted\"]}')
    print(f'GC candidates: {result[\"gc_candidates\"]}')
asyncio.run(decay())
"
```

### Step 3: L2→L3 - Propose CLAUDE.md Updates

Find high-fitness entries that should be promoted:
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def promotable():
    km = KnowledgeManager(FileStorage())
    result = await km.list_knowledge(page_size=1000)
    promotable = [
        i for i in result['items']
        if i.get('enabled', True)
        and (i.get('fitness', 0) or 0) > 0.9
        and i.get('user_feedback') == 'approved'
    ]
    if promotable:
        print(f'{len(promotable)} entries ready for CLAUDE.md promotion:')
        for p in promotable:
            print(f'  {p[\"id\"]}: {p.get(\"name\", \"\")}')
    else:
        print('No entries ready for L3 promotion yet')
asyncio.run(promotable())
"
```

Present promotion candidates to the user for review. After approval, append to CLAUDE.md.

### Step 4: L3→L4 - Identify Cross-Project Universals

Check if any CLAUDE.md entries are universal enough for Memory:
- Patterns that apply to multiple device types
- General principles about simulator behavior
- Architecture patterns that transcend specific instrument domains

If found, save to Claude Code memory using the Write tool targeting the memory directory.

### Step 5: Summary

Report the evolution cycle results:
- New patterns extracted
- Knowledge entries decayed/demoted
- Promotion candidates
- Health metrics

## Action: report

Generate a comprehensive health report:

```bash
python -c "
import asyncio
from src.core.evolution.trace import TraceStore
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
from src.core.evolution.scoring import compute_node_fitness

async def report():
    store = TraceStore()
    km = KnowledgeManager(FileStorage())

    print('=== ACE Evolution Health Report ===')
    print()

    # Trace stats
    total = store.count()
    print(f'Traces: {total} total')

    # Node fitness ranking
    result = await km.list_knowledge(page_size=1000)
    items = result['items']
    active = [i for i in items if i.get('enabled', True)]

    print(f'Knowledge: {len(active)} active entries')
    print()

    # Group by type
    by_type = {}
    for i in active:
        t = i.get('type', 'unknown')
        by_type.setdefault(t, []).append(i)

    for t, entries in sorted(by_type.items()):
        avg_fitness = sum(e.get('fitness', 0) or 0 for e in entries) / len(entries) if entries else 0
        print(f'  {t}: {len(entries)} entries (avg fitness: {avg_fitness:.2f})')

    # Coverage gaps
    print()
    print('Coverage gaps:')
    neg = [i for i in active if i.get('polarity') == 'negative']
    if not neg:
        print('  - No negative knowledge (failure patterns) recorded yet')
    low_fit = [i for i in active if (i.get('fitness', 0) or 0) < 0.3]
    if low_fit:
        print(f'  - {len(low_fit)} entries with dangerously low fitness (< 0.3)')

asyncio.run(report())
"
```

## Action: project

Generate or update a product-level CLAUDE.md for a specific instrument type.

This creates a domain-specific CLAUDE.md at `~/.ace/projects/<type>/CLAUDE.md` with:
- Accumulated knowledge specific to that instrument
- Optimal parameter ranges from trace analysis
- Common failure modes and their mitigations
- Proven workflow templates

The user specifies a project type (any domain tag used in traces, e.g. `stm`, `fibsem`, `tem`, `lidar`, `robotics`), and this command:
1. Filters knowledge by device tags
2. Filters traces by device/simulator tags
3. Runs pattern extractors on device-specific traces
4. Generates a comprehensive CLAUDE.md for that instrument domain
