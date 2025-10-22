# Problem-Solving Skills - Attribution

These skills were derived from agent patterns in the [Amplifier](https://github.com/microsoft/amplifier) project.

**Source Repository:**
- Name: Amplifier
- URL: https://github.com/microsoft/amplifier
- Commit: 2adb63f858e7d760e188197c8e8d4c1ef721e2a6
- Date: 2025-10-10

## Skills Derived from Amplifier Agents

**From insight-synthesizer agent:**
- simplification-cascades - Finding insights that eliminate multiple components
- collision-zone-thinking - Forcing unrelated concepts together for breakthroughs
- meta-pattern-recognition - Spotting patterns across 3+ domains
- inversion-exercise - Flipping assumptions to reveal alternatives
- scale-game - Testing at extremes to expose fundamental truths

**From ambiguity-guardian agent:**
- (architecture) preserving-productive-tensions - Preserving multiple valid approaches

**From knowledge-archaeologist agent:**
- (research) tracing-knowledge-lineages - Understanding how ideas evolved

**Dispatch pattern:**
- when-stuck - Maps stuck-symptoms to appropriate technique

## What Was Adapted

The amplifier agents are specialized long-lived agents with structured JSON output. These skills extract the core problem-solving techniques and adapt them as:

- Scannable quick-reference guides (~60 lines each)
- Symptom-based discovery via when_to_use
- Immediate application without special tooling
- Composable through dispatch pattern

## Core Insight

Agent capabilities are domain-agnostic patterns. Whether packaged as "amplifier agent" or "superpowers skill", the underlying technique is the same. We extracted the techniques and made them portable.
