---
description: Simulation with Insight Extraction
---

# /ace-simulate - Simulation with Insight Extraction

Run simulator operations with automatic trace recording and insight extraction. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS`:
- `run <simulator_id> <operation> [params_json]` → Run a single operation
- `benchmark <workflow_id> [n_runs]` → Run workflow N times with stats
- `list` → List available simulators and operations
- No arguments → List simulators

## Action: run

### 1. Run the Operation
```bash
python -c "
import asyncio, json
from src.core.simulator.registry import SimulatorRegistry
from src.core.evolution.trace import TraceStore, create_trace
import time

async def run():
    reg = SimulatorRegistry()
    sim = reg.get_simulator('<simulator_id>')
    if not sim:
        print('Available simulators:', reg.list_simulators())
        return

    params = <params_json or {}>
    state_before = sim.get_state()

    start = time.monotonic()
    result = sim.execute_operation('<operation>', params)
    duration = time.monotonic() - start

    state_after = sim.get_state()

    print(f'Status: {\"success\" if result.get(\"success\") else \"failed\"}')
    print(f'Duration: {duration:.3f}s')
    print(f'Output: {json.dumps(result.get(\"output\", {}), indent=2, default=str)[:500]}')

    # Emit trace
    store = TraceStore()
    trace = create_trace(
        entity_type='node',
        entity_id='<operation>',
        inputs=params,
        outputs=result.get('output', {}),
        status='success' if result.get('success') else 'failed',
        duration_seconds=duration,
        error=result.get('error'),
        environment={'simulator': '<simulator_id>', 'state_before': state_before},
        tags=['simulator', 'device:<simulator_id>', 'op:<operation>'],
    )
    store.append(trace)
    print(f'Trace recorded: {trace.trace_id}')

asyncio.run(run())
"
```

### 2. Check for Novel Parameters
After execution, check if this parameter combination is novel (not seen in previous traces). If novel and successful, tag for pattern extraction.

## Action: benchmark

### 1. Run N Iterations
Execute the workflow N times (default 5) with the same or varying parameters:
```bash
python -c "
import asyncio
from src.core.workflow.engine import WorkflowEngine
from src.core.workflow.parser import WorkflowParser
from src.core.evolution.trace import TraceStore
from src.core.storage.file_storage import FileStorage

async def benchmark():
    fs = FileStorage()
    wf_data = await fs.get('workflows', '<workflow_id>')
    definition = WorkflowParser.parse_dict(wf_data)

    store = TraceStore()
    engine = WorkflowEngine(trace_store=store)

    results = []
    for i in range(<n_runs>):
        result = await engine.execute(definition)
        results.append(result)
        status = '✓' if result.status == 'success' else '✗'
        duration = 0
        if result.started_at and result.finished_at:
            from datetime import datetime
            s = datetime.fromisoformat(result.started_at)
            e = datetime.fromisoformat(result.finished_at)
            duration = (e - s).total_seconds()
        print(f'  Run {i+1}: {status} ({duration:.2f}s)')

    successes = sum(1 for r in results if r.status == 'success')
    print(f'\\nResults: {successes}/{len(results)} success ({successes/len(results)*100:.0f}%)')

asyncio.run(benchmark())
"
```

### 2. Generate Optimization Report
After benchmarking, run pattern extractors on the generated traces to identify parameter optimizations and reliability issues.

## Action: list

```bash
python -c "
from src.core.simulator.registry import SimulatorRegistry
reg = SimulatorRegistry()
for name in reg.list_simulators():
    sim = reg.get_simulator(name)
    ops = sim.list_operations() if hasattr(sim, 'list_operations') else []
    print(f'{name}:')
    for op in ops:
        print(f'  - {op}')
"
```
