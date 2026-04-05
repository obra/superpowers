---
description: Device Lifecycle Management
---

# /ace-device - Device Lifecycle Management

Manage device definitions — list, inspect, create, validate. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS`:
- `list` → List all registered devices
- `info <device_id>` → Show device details, parameters, simulator link
- `create <name> <type>` → Scaffold a new device definition
- `validate <device_id>` → Validate device definition against schema
- No arguments → List devices

## Action: list

### 1. List Registered Devices
```bash
python -c "
import json
from src.core.devices.registry import DeviceRegistry

reg = DeviceRegistry()
devices = reg.list_devices()
if not devices:
    print('No devices registered.')
    print('Create one with: /ace-device create <name> <type>')
else:
    print(f'Registered devices ({len(devices)}):')
    for d in devices:
        sim = '(simulator)' if d.get('has_simulator') else ''
        print(f'  {d[\"id\"]:20s} {d.get(\"type\", \"?\"):12s} {d.get(\"vendor\", \"\")} {sim}')
"
```

### 2. Show Summary
Display the device list. If no devices exist, suggest `/ace-device create`.

## Action: info

### 1. Load Device Details
```bash
python -c "
import json
from src.core.devices.registry import DeviceRegistry

reg = DeviceRegistry()
device = reg.get_device('<device_id>')
if not device:
    print('Device not found. Available:', [d['id'] for d in reg.list_devices()])
else:
    print(json.dumps(device.to_dict(), indent=2))
    if device.skill_content:
        print('\n--- SKILL.md ---')
        print(device.skill_content[:1000])
"
```

### 2. Show Device Context
Display:
- Device metadata (name, type, vendor, model)
- Capabilities and parameters
- Linked simulator (if any)
- SKILL.md content (domain knowledge)

## Action: create

### 1. Scaffold Device Definition

Create directory structure:
```
~/.ace/store/devices/<name>/
  device.json    ← Metadata, capabilities, parameters
  SKILL.md       ← Domain knowledge for this device
```

### 2. Generate device.json

Based on `<name>` and `<type>`, generate:
```json
{
  "id": "<name>",
  "type": "<type>",
  "vendor": "",
  "model": "",
  "description": "Description of <name>",
  "capabilities": [],
  "parameters": {},
  "simulator_id": null
}
```

### 3. Generate SKILL.md

Create a template SKILL.md with sections:
- Device overview
- Key operations
- Known constraints
- Parameter guidelines

### 4. Trace the Creation
After successful creation, the system will automatically trace the creation event.

## Action: validate

### 1. Validate Device Definition
```bash
python -c "
import json
from pathlib import Path

device_path = Path('~/.ace/store/devices/<device_id>/device.json')
if not device_path.exists():
    print(f'Device definition not found at {device_path}')
else:
    with open(device_path) as f:
        device = json.load(f)

    errors = []
    required = ['id', 'type', 'description']
    for field in required:
        if not device.get(field):
            errors.append(f'Missing required field: {field}')

    if errors:
        print('Validation FAILED:')
        for e in errors:
            print(f'  - {e}')
    else:
        print(f'Device \"{device[\"id\"]}\" is valid.')
        print(f'  Type: {device[\"type\"]}')
        print(f'  Capabilities: {len(device.get(\"capabilities\", []))}')
        print(f'  Parameters: {len(device.get(\"parameters\", {}))}')
"
```

### 2. Report Results
Show validation results. Suggest fixes for any errors found.
