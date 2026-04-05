---
description: Review and Improve Artifacts
---

# /ace-review - Review and Improve Artifacts

Review nodes and workflows against accumulated knowledge and execution history. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS`:
- `node <node_id>` → Review a specific node
- `workflow <workflow_id>` → Review a specific workflow
- No arguments → Review recent changes

## Action: node

### 1. Read Node Definition
Read the node's `definition.json` and `node.py` from `~/.ace/store/nodes/` or `~/.ace/store/nodes/`.

### 2. Check Execution History
```bash
python -c "
from src.core.evolution.trace import TraceStore
from src.core.evolution.scoring import compute_node_fitness
store = TraceStore()
stats = store.stats('<node_id>')
if stats['total_runs'] > 0:
    score = compute_node_fitness(
        success_count=stats['success_count'],
        failure_count=stats['failure_count'],
        avg_duration=stats['avg_duration'],
        usage_count=stats['total_runs'],
    )
    print(f'Runs: {stats[\"total_runs\"]}, Success: {stats[\"success_rate\"]:.1%}')
    print(f'Duration: avg={stats[\"avg_duration\"]:.2f}s, min={stats[\"min_duration\"]:.2f}s, max={stats[\"max_duration\"]:.2f}s')
    print(f'Fitness: {score.total:.3f}')
else:
    print('No execution history found')
"
```

### 3. Check Knowledge for Known Issues
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage

async def check():
    km = KnowledgeManager(FileStorage())
    warnings = await km.get_warnings_for_execution('<node_id>', {})
    if warnings:
        print('Known issues:')
        for w in warnings:
            print(f'  ⚠ {w.get(\"name\", \"\")}: {w.get(\"description\", \"\")}')

    # Also check for parameter guidelines
    results = await km.search_knowledge('<node_id>', knowledge_type='parameter_guideline', limit=5)
    if results:
        print('Parameter guidelines:')
        for r in results:
            content = r.get('content', {})
            param = content.get('parameter', '?')
            rng = content.get('recommended_range', {})
            print(f'  {param}: [{rng.get(\"min\", \"?\")}, {rng.get(\"max\", \"?\")}]')
asyncio.run(check())
"
```

### 4. Review Code Quality
Read the node's `node.py` and check:
- Does it follow the prep/exec/post lifecycle pattern?
- Does it handle errors properly?
- Are input/output schemas consistent with the code?
- Are there hardcoded values that should be parameters?

### 5. Propose Improvements
Based on execution history, known issues, and code review, propose concrete improvements with evidence.

## Action: workflow

### 1. Read Workflow Definition
Load the workflow from storage.

### 2. Validate Structure
```bash
python -c "
from src.core.workflow.parser import WorkflowParser
import asyncio, json
from src.core.storage.file_storage import FileStorage

async def validate():
    fs = FileStorage()
    wf = await fs.get('workflows', '<workflow_id>')
    definition = WorkflowParser.parse_dict(wf)
    errors = WorkflowParser.validate_structure(definition)
    if errors:
        print('Structural errors:')
        for e in errors:
            print(f'  ✗ {e}')
    else:
        print('Structure: valid')
asyncio.run(validate())
"
```

### 3. Type-Check All Edges
```python
from src.core.evolution.type_checker import validate_workflow_types
results = validate_workflow_types(nodes, edges, node_definitions)
```

### 4. Check Node Fitness Scores
For each node in the workflow, check its fitness score. Flag nodes with:
- Fitness < 0.3 (unreliable)
- No execution history (untested)
- Known failure patterns

### 5. Check for Composition Issues
- Missing data mappings between connected nodes
- Type mismatches at edges
- Unreachable nodes
- Missing error handling for unreliable nodes

### 6. Propose Improvements
- Replace low-fitness nodes with better alternatives
- Add missing data mappings
- Suggest error handling or retry policies for unreliable nodes
- Propose parallelization of independent node chains
