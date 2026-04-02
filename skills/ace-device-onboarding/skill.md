---
description: "ACE Paradigm 2: Onboard devices with evolution闭环 (inspired by superpowers philosophy)"
---

# ACE Paradigm 2 - Device & Simulator Onboarding

Transform device manuals and SDKs into ACE-orchestratable assets.
Inspired by superpowers philosophy: clarify → design (2-3 options) → verify → evolve.

## When to Use

- User brings new instrument/device manuals
- User provides SDK/API with examples
- Need to create Device + Simulator definitions
- No existing abstraction for target device

## Workflow (Superpowers-Inspired + Evolution)

### Phase 1: Clarify (Superpowers Philosophy)

Ask one question at a time to understand:
1. What device/instrument?
2. What manuals/documentation available?
3. What SDK/API available?
4. What's the goal? (Full automation, HITL, or future capability?)
5. Any safety constraints or dangerous operations?

### Phase 2: Design

**Design the onboarding approach** (propose 2-3 options):

- **Option A**: Full simulator + automation
- **Option B**: HITL (Human-in-the-loop) with traces
- **Option C**: Hybrid (some operations simulated, some HITL)

Get user approval before proceeding.

### Phase 3: Knowledge Ingestion

1. **Manuals → Knowledge Base**
   - Use /ace-knowledge ingest for PDFs/docs
   - PageIndex for searchable chapters
   - Extract terminology, constraints, safety rules

2. **Knowledge validation**
   - Query ingested knowledge to verify extraction quality
   - Confirm key concepts captured

### Phase 4: Device + Simulator Implementation

1. **SDK Analysis**
   - Parse SDK surface
   - Map public APIs to operations
   - Identify state machine requirements

2. **Device Definition**
   - Create ~/.ace/store/devices/<device-id>/device.json
   - Define capabilities, parameters, constraints

3. **Simulator Implementation** (if applicable)
   - Implement Simulator class extending BaseSimulator
   - Map APIs to deterministic operations
   - Add fault injection support
   - Create state machine

4. **SKILL.md Creation**
   - Document capabilities
   - List dangerous operations
   - Map simulator operations to manual procedures
   - Document HITL points (if no simulator)

5. **Verification**
   - Test device definition validates
   - Test simulator runs (if implemented)
   - Check type safety

### Phase 5: Distill Operations

1. **Derive atomic operations**
   - From manual steps and SDK surface
   - Each operation should be deterministic
   - Clear input/output ports

2. **Create initial nodes**
   - One node per atomic operation
   - Validate with type checker
   - Test in simulator

3. **Register everything**
   - Device to ~/.ace/store/devices/
   - Nodes to ~/.ace/store/nodes/
   - Update registry.jsonl

### Phase 6: Evolution闭环

1. **Trace accumulation** (L1)
   - Onboarding process itself is traced
   - SDK mapping decisions → traces
   - Manual alignment decisions → traces

2. **Pattern extraction** (L2)
   - Run /ace-evolve on device onboarding traces
   - Extract patterns:
     - "Common SDK mapping patterns"
     - "Manual → code translation patterns"
     - "Safety constraint patterns"

3. **Knowledge solidification**
   - Create insights for reusable patterns
   - Update fitness based on subsequent usage
   - Promote to CLAUDE.md if universal

## Key Principles (Superpowers + ACE)

**From Superpowers:**
- Clarify before building (one question at a time)
- Design alternatives (propose 2-3 approaches)
- Verify at each milestone (manual ingest OK? simulator runs?)
- No speculative work (only build what user confirms)

**From ACE:**
- Accumulate: Onboarding process → traces
- Composable: Device + Simulator + Nodes work together
- Evolve: Device onboarding patterns feed future onboardings

## Deliverables

| Artifact | Location | Purpose |
|----------|----------|---------|
| Device definition | ~/.ace/store/devices/<id>/device.json | Capability contract |
| Simulator | src/core/simulator/<device>.py or ~/.ace/store/ | Testing & validation |
| SKILL.md | ~/.ace/store/devices/<id>/SKILL.md | Operation catalog |
| Knowledge entries | ~/.ace/knowledge/ | Searchable manual content |
| Initial nodes | ~/.ace/store/nodes/atomic/<device>_*/ | Reusable operations |
| Traces | ~/.ace/traces/ | Onboarding process record |
| Insights | ~/.ace/insights/device-<id>*.md | Patterns for future |

## Interaction Flow Example

**User**: "I need to onboard a new TEM instrument."

**Agent**: "I'll help you onboard the TEM. Let me start by clarifying a few things...

1. What specific TEM model are you working with?"

**User**: "It's a JEOL JEM-ARM200F."

**Agent**: "Got it. What manuals or documentation do you have available? (PDFs, API docs, etc.)"

**User**: "I have the user manual PDF and a Python SDK from JEOL."

**Agent**: "Great. What's your goal - full automation, human-in-the-loop, or building future capability?"

**User**: "We want to automate sample screening workflows."

**Agent**: "Any safety constraints or dangerous operations I should know about?"

**User**: "High voltage operations and beam alignment need careful handling."

**Agent**: "Understood. Based on this, I propose 3 onboarding approaches:

**Option A**: Full simulator + automation
- Build complete simulator from SDK
- Full workflow automation
- Best for: Well-understood, safe operations

**Option B**: HITL with traces
- Human executes, ACE learns
- Accumulate traces for future automation
- Best for: Complex, safety-critical operations

**Option C**: Hybrid
- Simulator for safe operations
- HITL for high-voltage/beam alignment
- Best for: Mixed safety requirements

Which approach fits your needs?"

**User**: "Option C - hybrid approach."

**Agent**: "Perfect. Starting with Option C - Hybrid approach.

**Phase 3: Knowledge Ingestion**

Let me ingest the TEM manual into the knowledge base..."

[Continues through phases...]

## Canonical Statements

- "Before onboarding, let me clarify the device and goals..."
- "Proposing 3 onboarding approaches (inspired by superpowers)..."
- "Ingesting manuals into knowledge base..."
- "Mapping SDK to Device + Simulator with verification at each step..."
- "Onboarding traces captured. Running evolution to extract patterns..."
- "Device onboarded. Patterns will improve future onboardings."
