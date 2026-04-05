---
description: 4-Level Insight Management
---

# /ace-insight - 4-Level Insight Management

Manage ACE insights across all 4 levels of the hierarchy. Argument: `$ARGUMENTS`

## 4-Level Hierarchy

```
L4: Memory/pitfalls.md    ← Cross-session, cross-project (permanent)
L3: CLAUDE.md             ← Project-level best practices (persistent)
L2: Insight               ← Pattern-detected, fitness-scored (evolving)
L1: Traces                ← Raw execution data (immutable)
```

## Determine Action

Parse `$ARGUMENTS`:
- `status` → Health report across all 4 levels
- `review` → Review pending L2 candidates with fitness scores
- `search <query>` → Search across L2+L3+L4
- `distill` → Identify overlaps/contradictions in L2
- `promote <insight_id>` → Promote from L2→L3 or L3→L4
- `sync` → Regenerate CLAUDE.md from high-fitness L2 insights
- No arguments → Show status

## Action: status

Get the status of all 4 levels:

```bash
#! /bin/bash
cd "$ACE_ROOT" && PYTHONPATH="$ACE_ROOT" python3 -c "
import asyncio, os
from src.core.evolution.trace import TraceStore
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def status():
    ts = TraceStore()
    total = ts.count()
    nodes = ts.count(entity_type='node')
    wfs = ts.count(entity_type='workflow')
    print(f'L1 Traces: {total} total ({nodes} node, {wfs} workflow)')

    km = KnowledgeManager(FileStorage())
    result = await km.list_knowledge(page_size=1000)
    items = result['items']
    active = [i for i in items if i.get('enabled', True)]
    negative = [i for i in active if i.get('polarity') == 'negative']
    high_fit = [i for i in active if (i.get('fitness', 0) or 0) > 0.7]
    print(f'L2 Insights: {len(active)} active ({len(negative)} negative, {len(high_fit)} high-fitness)')

    claude_md = os.path.join(os.getcwd(), 'CLAUDE.md')
    print('L3 CLAUDE.md: found' if os.path.exists(claude_md) else 'L3 CLAUDE.md: not found')

asyncio.run(status())
"
```

## Action: review

```bash
#! /bin/bash
cd "$ACE_ROOT" && PYTHONPATH="$ACE_ROOT" python3 -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def review():
    km = KnowledgeManager(FileStorage())
    result = await km.list_knowledge(page_size=100)
    items = result['items']
    items.sort(key=lambda i: i.get('fitness', 0) or 0)

    for item in items[:20]:
        fitness = item.get('fitness', '?')
        polarity = '+' if item.get('polarity', 'positive') == 'positive' else '-'
        feedback = item.get('user_feedback', 'unreviewed')
        traces = len(item.get('provenance', {}).get('source_trace_ids', []))
        print(f'  [{polarity}] {item[\"id\"]:20s} fitness={fitness:>6} traces={traces:>3} {feedback:>10} | {item.get(\"name\", \"\")[:50]}')

asyncio.run(review())
"
```

## Action: search

```bash
#! /bin/bash
cd "$ACE_ROOT" && PYTHONPATH="$ACE_ROOT" python3 -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def search():
    km = KnowledgeManager(FileStorage())
    results = await km.search_knowledge('$QUERY', limit=10)
    for r in results:
        fitness = r.get('fitness', '?')
        print(f'  [{fitness:>6}] {r.get(\"name\", \"\")[:60]}')
        print(f'          {r.get(\"description\", \"\")[:80]}')
asyncio.run(search())
"
```

Replace `$QUERY` with the user's search terms.

## Action: distill / promote / sync

For advanced insight lifecycle operations (`distill`, `promote`, `sync`), follow the same KnowledgeManager-based workflows used by ACE evolution:
- contradiction detection before promotion
- fitness/decay recalculation
- promote high-fitness insights into `CLAUDE.md`
