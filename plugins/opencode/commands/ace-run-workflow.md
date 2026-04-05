---
description: ACE Paradigm 1 - Build and run workflows/nodes
---
# ACE P1 - Run Workflow

Build, compose, and execute workflows using existing device abstractions.

## Usage

This command invokes the `ace-run-workflow` skill from ace-superpowers.

## ACE CLI Commands (Recommended)

### List Devices
```bash
ace device list
```

### List Workflows
```bash
ace workflow list
```

### Run a Workflow
```bash
ace workflow run <workflow_id> [--input params.json]
```

### Build a Workflow from Description
```bash
ace workflow build "<description>" [--device <device_type>]
```

### Check Workflow Readiness
```bash
ace workflow check-readiness <workflow_id>
```

### Validate Workflow
```bash
ace workflow validate <workflow_id>
```

## Workflow

1. Clarify intent (build new? run existing? modify?)
2. For "run": search → confirm with user → execute
3. For "build": design → check nodes → compose → validate
4. Execute with traces
5. Evolution闭环

## Invocation

```
Skill("ace-run-workflow")
```
