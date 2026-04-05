---
description: Simulator Lifecycle Management
---

# /ace-simulator - Simulator Lifecycle Management

Manage simulator instances — list, inspect state, inject faults, scaffold new. Argument: `$ARGUMENTS`

Note: For **running** simulator operations, use `/ace-simulate`. This skill manages the simulators themselves.

## Determine Action

Parse `$ARGUMENTS`:
- `list` → List available simulators with connection status
- `state <simulator_id>` → Show current simulator state
- `fault <simulator_id> <fault_type> [severity]` → Inject a fault for testing
- `reset <simulator_id>` → Reset simulator to default state
- `create <device_type>` → Scaffold a new simulator implementation
- No arguments → List simulators

## Action: list

### 1. List Available Simulators
```bash
python -c "
import json
from src.core.simulator.registry import SimulatorRegistry

reg = SimulatorRegistry()
sims = reg.list_simulators()
if not sims:
    print('No simulators registered.')
    print('Create one with: /ace-simulator create <device_type>')
else:
    print(f'Available simulators ({len(sims)}):')
    for s in sims:
        print(f'  {s[\"id\"]:25s} {s.get(\"device_type\", \"?\")} — {s.get(\"description\", \"\")}')
"
```

## Action: state

### 1. Get Simulator State
```bash
python -c "
import json
from src.core.simulator.registry import SimulatorRegistry

reg = SimulatorRegistry()
sim = reg.get_simulator('<simulator_id>')
if not sim:
    print('Simulator not found. Available:', [s['id'] for s in reg.list_simulators()])
else:
    state = sim.get_state()
    print(f'Simulator: {sim.device_id}')
    print(f'State:')
    print(json.dumps(state, indent=2, default=str))
"
```

### 2. Show State Summary
Display the simulator state tree with key parameters highlighted.

## Action: fault

### 1. Inject Fault
```bash
python -c "
import asyncio, json
from src.core.simulator.registry import SimulatorRegistry

async def inject():
    reg = SimulatorRegistry()
    sim = reg.get_simulator('<simulator_id>')
    if not sim:
        print('Simulator not found.')
        return

    result = await sim.inject_fault('<fault_type>', severity=<severity or 0.5>)
    print(f'Fault injected: {result}')
    print(f'Current faults: {sim.active_faults}')

asyncio.run(inject())
"
```

Available fault types vary by simulator. Common types:
- `drift` — Gradual position drift
- `noise` — Random noise injection
- `beam_instability` — Beam parameter fluctuation
- `vacuum_loss` — Gradual vacuum degradation
- `contamination` — Surface contamination buildup

### 2. Report Fault Status
Show active faults and their impact on operations.

## Action: reset

### 1. Reset Simulator
```bash
python -c "
from src.core.simulator.registry import SimulatorRegistry

reg = SimulatorRegistry()
sim = reg.get_simulator('<simulator_id>')
if sim:
    sim.reset()
    print(f'Simulator {sim.device_id} reset to default state.')
else:
    print('Simulator not found.')
"
```

## Action: create

### 1. Scaffold New Simulator

Generate a new simulator implementation:
```
src/core/simulator/<device_type>.py
```

### 2. Generate Template

Create a simulator class inheriting from `SimulatorDevice`:

```python
from .base import SimulatorDevice, DeviceState, OperationResult

class <DeviceType>Simulator(SimulatorDevice):
    """Simulator for <device_type> devices."""

    device_type = "<device_type>"

    def __init__(self):
        super().__init__()
        self._state = DeviceState({
            # Define initial state parameters
        })

    async def execute_operation(self, operation: str, params: dict) -> OperationResult:
        # Implement operations
        ...

    @property
    def available_operations(self) -> list[str]:
        return []

    @property
    def available_faults(self) -> list[str]:
        return ["drift", "noise"]
```

### 3. Register in SimulatorRegistry

Add the new simulator to the registry so it's discoverable.

### 4. Trace the Creation
After successful creation, suggest running `/ace-simulate list` to verify.
