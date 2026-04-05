---
description: Create, test, and evolve nodes
---

# /ace-node - Node Lifecycle with Learning

Manage ACE nodes with accumulated knowledge context. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS` to determine the action:
- `create <description>` → Create a new node
- `test <node_id>` → Test a node with generated test cases
- `evolve <node_id>` → Analyze traces and propose improvements
- `list` → List available nodes
- `info <node_id>` → Show node details and fitness
- No arguments → Show available actions

## Action: create

### 1. Search for Duplicates
Before creating, search existing nodes to prevent duplication:
```bash
python -c "
from src.core.storage.file_storage import FileStorage
import asyncio
async def search():
    fs = FileStorage()
    nodes = await fs.list('nodes', page=1, page_size=100)
    for n in nodes:
        print(f'  {n[\"id\"]}: {n.get(\"description\", \"\")[:60]}')
asyncio.run(search())
"
```

### 2. Gather Knowledge Context
Search knowledge base for relevant domain knowledge and parameter guidelines:
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
async def search():
    km = KnowledgeManager(FileStorage())
    # Search for relevant negative knowledge (known pitfalls)
    warnings = await km.get_warnings_for_execution('<entity_description>', {})
    for w in warnings:
        print(f'  WARNING: {w.get(\"name\", \"\")}')
asyncio.run(search())
"
```

### 3. Create the Node
Use `NodeBuilderSkill` or guide the user through manual creation:
- Generate `definition.json` with proper input_schema and output_schema
- Generate `node.py` implementing the prep/exec/post lifecycle
- Validate with sandbox execution
- Store in `~/.ace/store/nodes/auto/<node_id>/`

### 4. Emit Creation Trace
After successful creation, the system will automatically trace the creation event.

## Action: test

### 1. Load Node Definition
Read the node's `definition.json` to understand its input_schema.

### 2. Search Traces for Previous Inputs
```bash
python -c "
from src.core.evolution.trace import TraceStore
store = TraceStore()
traces = store.query(entity_id='<node_id>', status='success', limit=10)
print(f'Found {len(traces)} previous successful executions')
for t in traces[:3]:
    print(f'  inputs: {t.inputs}')
"
```

### 3. Generate Test Cases
Generate test cases from three sources:
- **Historical**: Use successful inputs from trace history
- **Edge cases**: Generate from schema constraints (min/max values, required fields)
- **Adversarial**: Missing required fields, out-of-range values, wrong types

### 4. Run Tests in Sandbox
Execute each test case via sandbox and report results.

## Action: evolve

### 1. Pull All Traces
```bash
python -c "
from src.core.evolution.trace import TraceStore
from src.core.evolution.scoring import compute_node_fitness
store = TraceStore()
stats = store.stats('<node_id>')
print(f'Total runs: {stats[\"total_runs\"]}')
print(f'Success rate: {stats[\"success_rate\"]:.1%}')
print(f'Avg duration: {stats[\"avg_duration\"]:.2f}s')
score = compute_node_fitness(
    success_count=stats['success_count'],
    failure_count=stats['failure_count'],
    avg_duration=stats['avg_duration'],
    usage_count=stats['total_runs'],
)
print(f'Fitness: {score.total:.3f}')
"
```

### 2. Identify Improvements
- Check for failure patterns related to this node
- Check for parameter guidelines
- Check for duration anomalies
- Compare with similar nodes

### 3. Propose Mutations
Present concrete improvement proposals with evidence from traces.

## Action: list

```bash
python -c "
from src.core.storage.file_storage import FileStorage
import asyncio
async def list_nodes():
    fs = FileStorage()
    nodes = await fs.list('nodes', page=1, page_size=100)
    for n in nodes:
        print(f'{n[\"id\"]:30s} {n.get(\"type\", \"?\"):10s} {n.get(\"description\", \"\")[:50]}')
asyncio.run(list_nodes())
"
```

Also show fitness scores if traces are available.
