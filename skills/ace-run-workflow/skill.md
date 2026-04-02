---
description: "ACE Paradigm 1: Build and run workflows/nodes with evolution闭环 (inspired by superpowers philosophy)"
---

# ACE Paradigm 1 - Run Workflow

Build, compose, and execute workflows/nodes using existing device abstractions.
Inspired by superpowers philosophy: design → verify → evolve.

## When to Use

- User wants to **build** workflows or nodes
- User wants to **run** workflows on existing devices
- User wants to **compose** nodes into pipelines
- Device definitions already exist in ~/.ace/store/devices/

## Workflow (Superpowers-Inspired)

### Phase 1: Clarify Intent

Understand what user wants:
- Build new workflow/node?
- Run existing workflow?
- Modify existing workflow/node?

### Phase 2: Discovery & Confirmation (for Run)

If user wants to **run a workflow**:

1. **Search existing workflows**
   - Query ~/.ace/store/workflows/
   - List matching workflows by intent

2. **Confirm with user**
   - Show workflow name + description
   - Show input/output schema
   - Ask: "Is this the workflow you want to run?"

3. **If NO match** → Switch to Build mode
   - "No matching workflow found. Let's build one."
   - Go to Phase 3: Build

### Phase 3: Build (Workflow or Node)

If building a **workflow**:

1. **Design** (inspired by superpowers:brainstorming)
   - Explore existing nodes
   - Clarify requirements (one question at a time)
   - Propose 2-3 workflow topologies
   - Get user approval

2. **Check node availability**
   - List required node types
   - Check if each exists in ~/.ace/store/nodes/

3. **If missing nodes** → Trigger Node Build
   - "Workflow needs nodes that don't exist yet. Let's build them first."
   - Go to Phase 4: Build Node

4. **Compose & Validate**
   - Use composition protocol (type_checker)
   - Validate port compatibility
   - Register to ~/.ace/store/workflows/

If building a **node**:

1. **Design** (inspired by superpowers:brainstorming)
   - Check device capabilities
   - Define input/output ports (JSON Schema)
   - Define prep/exec/post structure
   - Get user approval

2. **Implement**
   - Write node code
   - Create definition.json
   - Write tests

3. **Validate**
   - Test in simulator if available
   - Verify type safety
   - Register to ~/.ace/store/nodes/

### Phase 4: Execute

1. **Run workflow/node**
   - Execute with tracing enabled
   - Capture all tool calls as traces

2. **Monitor & Handle failures**
   - If failure → capture PCFL reflection
   - Suggest fixes based on insights
   - Retry or abort

### Phase 5: Evolution闭环 (ACE)

1. **Trace accumulation** (L1)
   - All executions → ~/.ace/traces/

2. **Pattern extraction** (L2)
   - Run /ace-evolve
   - Extract success/failure patterns
   - Parameter guidelines
   - Workflow templates

3. **Insight solidification**
   - Create/update ~/.ace/insights/<entity>.md
   - Update fitness scores
   - Decay old insights

## Key Principles (Superpowers + ACE)

**From Superpowers:**
- Clarify before building (one question at a time)
- Confirm before executing (is this what you want?)
- Verify at each step (type checking, validation)
- Iterate on failure (don't just fail, fix)

**From ACE:**
- Accumulate: Every execution → traces
- Composable: Nodes connect via typed ports
- Evolve: Insights have fitness, fit survives

## Interaction Flow Examples

### Example 1: Run Workflow (Match Found)

```
User: /ace run workflow for image acquisition

→ Found 2 workflows:
  1. fibsem_acquire_dual_beam - Dual beam image acquisition
  2. tem_high_throughput - TEM high throughput imaging

→ Is #1 what you need? (Y/n/details)

User: Y

→ Running fibsem_acquire_dual_beam...
→ Execution complete. Traces captured.
→ Running evolution to extract patterns...
```

### Example 2: Run Workflow (No Match → Build)

```
User: /ace run workflow for my custom experiment

→ No matching workflow found.
→ Let's build one. What device are you using?

[Build workflow flow...]
```

### Example 3: Build Workflow (Missing Nodes)

```
User: /ace build workflow for STM scanning

→ Design: STM raster scan with grid resolution
→ Required nodes:
  ✓ stm_connect (exists)
  ✓ stm_set_bias (exists)
  ✗ stm_custom_scan (missing)

→ Node stm_custom_scan doesn't exist. Build it now? (Y/n)

[Build node flow...]

→ Node built. Continuing workflow composition...
```

## Canonical Statements

- "Let me search for matching workflows..."
- "Is this the workflow you want to run?"
- "Missing nodes detected. Let's build them first."
- "Designing workflow (inspired by superpowers philosophy)..."
- "Execution complete. Running evolution闭环..."
