---
description: Create, run, and optimize workflows
---

# /ace-workflow - Workflow Lifecycle with Learning

Manage ACE workflows with composition protocol and knowledge context. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS`:
- `create <description>` → Create a new workflow using composition protocol
- `run <workflow_id> [params_json]` → Execute with pre-check and post-trace
- `optimize <workflow_id>` → Analyze traces and propose optimizations
- `validate <workflow_id>` → Type-check all edges
- `show <workflow_id>` → Visualize workflow structure
- `list` → List available workflows
- No arguments → Show available actions

## Action: create

### 1. Search Knowledge for Templates
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
async def search():
    km = KnowledgeManager(FileStorage())
    results = await km.search_knowledge('workflow_template', knowledge_type='workflow_template', limit=5)
    for r in results:
        print(f'  Template: {r.get(\"name\", \"\")}')
        seq = r.get('content', {}).get('sequence', [])
        if seq:
            print(f'    Sequence: {\" → \".join(seq)}')
asyncio.run(search())
"
```

### 2. Search Node Registry
List available nodes that can be composed:
```bash
python -c "
from src.core.storage.file_storage import FileStorage
import asyncio
async def nodes():
    fs = FileStorage()
    nodes = await fs.list('nodes', page=1, page_size=100)
    for n in nodes:
        print(f'  {n[\"id\"]:30s} {n.get(\"type\", \"?\"):10s}')
asyncio.run(nodes())
"
```

### 3. Use Composition Builder
Build the workflow using the type-checked composition protocol:
```python
from src.core.evolution.compose import ComposableNode, CompositionBuilder

# Create composable nodes from definitions
scan = ComposableNode.from_definition(scan_def)
detect = ComposableNode.from_definition(detect_def)

# Compose with type checking
builder = CompositionBuilder(strict=True)
builder.add(scan).then(detect, data_mapping={"image_path": "image_path"})
workflow = builder.build("my_workflow", "My Workflow", "Description")
```

### 4. Validate Types
Run type checking on all edges before saving.

### 5. Save Workflow
Store the workflow definition and emit a creation trace.

## Action: run

### 1. Pre-execution: Surface Warnings
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
async def warn():
    km = KnowledgeManager(FileStorage())
    # Check warnings for each node in the workflow
    warnings = await km.get_warnings_for_execution('<workflow_id>', {})
    if warnings:
        print('WARNINGS before execution:')
        for w in warnings:
            print(f'  ⚠ {w.get(\"name\", \"\")}: {w.get(\"description\", \"\")}')
    else:
        print('No known issues for this workflow')
asyncio.run(warn())
"
```

### 2. Execute with Output Directory and Simulator
```bash
python -c "
import asyncio
import json
import uuid
import shutil
from pathlib import Path
from src.core.workflow.engine import WorkflowEngine
from src.core.workflow.parser import WorkflowParser
from src.core.evolution.trace import TraceStore
from src.core.storage.file_storage import FileStorage
from src.core.simulator.registry import SimulatorRegistry

async def run():
    workflow_id = '<workflow_id>'

    # Create run directory
    run_id = uuid.uuid4().hex[:12]
    run_dir = Path.home() / '.ace' / 'store' / 'run' / 'workflow' / workflow_id / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    output_dir = run_dir / 'output'
    output_dir.mkdir(exist_ok=True)

    print(f'Run directory: {run_dir}')

    # Load workflow
    fs = FileStorage()
    wf_data = await fs.get('workflows', workflow_id)
    definition = WorkflowParser.parse_dict(wf_data)

    # Setup trace store
    trace_store = TraceStore()

    # Setup simulator registry (CRITICAL for device operations)
    sim_registry = SimulatorRegistry()

    # Create engine with simulator registry
    engine = WorkflowEngine(
        trace_store=trace_store,
        simulator_registry=sim_registry
    )

    # Execute with output directory in params
    params = <params> or {}
    params['output_dir'] = str(output_dir)

    result = await engine.execute(definition, params=params)

    # Save result summary
    summary = {
        'run_id': run_id,
        'workflow_id': workflow_id,
        'status': result.status,
        'node_results': [
            {
                'node_id': nr.node_id,
                'status': nr.status,
                'duration': nr.duration_seconds,
                'output': nr.output if hasattr(nr, 'output') else {}
            }
            for nr in result.node_results
        ]
    }

    with open(run_dir / 'result.json', 'w') as f:
        json.dump(summary, f, indent=2, default=str)

    # Collect output files
    output_files = list(output_dir.glob('*'))

    print(f'\\nStatus: {result.status}')
    print(f'Run ID: {run_id}')
    print(f'Output directory: {output_dir}')
    print(f'Output files: {len(output_files)}')
    for f in output_files:
        print(f'  - {f.name} ({f.stat().st_size} bytes)')

    if result.error:
        print(f'Error: {result.error}')

    return result

asyncio.run(run())
"
```

### 3. Post-execution: Traces are emitted automatically by the engine.

Output structure:
```
~/.ace/store/run/workflow/<workflow_id>/<run_id>/
├── output/           # All output files (images, STL, etc.)
│   ├── electron_xxx.png
│   ├── ion_xxx.png
│   └── sample_volume.stl
└── result.json       # Execution summary
```

## Action: optimize

### 1. Pull Execution Traces
```bash
python -c "
from src.core.evolution.trace import TraceStore
from src.core.evolution.scoring import compute_workflow_fitness
store = TraceStore()
stats = store.stats('<workflow_id>')
print(f'Runs: {stats[\"total_runs\"]}, Success: {stats[\"success_rate\"]:.1%}, Avg: {stats[\"avg_duration\"]:.1f}s')
# Get per-node stats from child traces
wf_traces = store.query(entity_id='<workflow_id>', entity_type='workflow', limit=5)
for wft in wf_traces:
    children = store.query(parent_trace_id=wft.trace_id)
    for c in children:
        print(f'  {c.entity_id}: {c.status} ({c.duration_seconds:.2f}s)')
"
```

### 2. Identify Bottlenecks
- Nodes with highest average duration → bottleneck candidates
- Nodes with highest failure rate → reliability issues
- Check for parameter optimization opportunities

### 3. Propose Optimizations
- Reorder independent nodes for parallelization
- Adjust parameters based on success patterns
- Suggest node replacements with better fitness scores

## Action: validate

Run type checking on all workflow edges:
```python
from src.core.evolution.type_checker import validate_workflow_types
results = validate_workflow_types(nodes, edges, node_definitions)
for r in results:
    status = "✓" if r["compatible"] else "✗"
    print(f'{status} {r["source"]} → {r["target"]}')
    for w in r.get("warnings", []):
        print(f'    ⚠ {w}')
```
