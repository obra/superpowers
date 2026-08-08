---
name: efficient-multi-agent-research
description: Use when investigating, auditing, or reviewing more than 6 items across a codebase - function call sites, pattern usage, file reviews, or any research task with partitionable items that would pollute the main agent's context if read directly
---

# Efficient Multi-Agent Research

## Overview

When investigating N items (N > 6), reading everything into the main agent's context pollutes it and degrades decision-making. Instead, partition the work across parallel sub-agents that write findings to disk, then consolidate into a single report.

**Core principle:** The coordinator decides, sub-agents investigate. Keep investigation results out of the main context until consolidated.

**REQUIRED BACKGROUND:** You MUST understand superpowers:dispatching-parallel-agents before using this skill. That skill covers general parallel dispatch. This skill extends it with a specific research workflow: partition, investigate to disk, consolidate, then decide.

## When to Use

**Use when:**
- Investigating many call sites of a function (N > 6)
- Auditing usage of a pattern across a codebase
- Reviewing multiple files for a common issue
- Any research task with partitionable items

**Don't use when:**
- Simple searches (just use Grep/Glob)
- Tasks with < 6 items (single agent is fine)
- Deeply interdependent items that can't be partitioned cleanly

## Core Pattern

**Partition > Parallel Investigate > Consolidate > Decide**

1. **Create output directory:** `mkdir -p dev-docs/<topic>/` — if re-running, archive previous `findings_*.md` to a subdirectory (e.g., `run-01/`) before starting so the consolidation glob only picks up current results.

2. **Launch investigation agents** — all in one message, all `run_in_background=true`:
   ```text
   Agent(run_in_background=true,
     prompt="Investigate items A-D. Write to dev-docs/<topic>/findings_1.md
     using table schema: [columns]. Flag uncertainties.")

   Agent(run_in_background=true,
     prompt="Investigate items E-H. Write to dev-docs/<topic>/findings_2.md ...")
   ```
   Specify exact table columns and consistent formatting in every prompt.

3. **Wait** for all background agents to complete.

4. **Launch consolidation agent** — always request these four elements:
   ```text
   Agent(prompt="Read all dev-docs/<topic>/findings_*.md.
     Create consolidated_report.md with:
     1. Unified table merging all agent tables
     2. Cross-cutting patterns across findings
     3. Summary statistics (e.g., '12/17 need fixes')
     4. Prioritized recommendations")
   ```

5. **Review only `consolidated_report.md`** — never read individual findings files into the main context.

## Quick Reference

| Aspect | Guidance |
|--------|----------|
| Group size | 4-5 items per agent |
| Agent count | Typically 3-5 |
| Agent mode | Always `run_in_background=true` |
| Output | `dev-docs/<topic>/findings_N.md` per agent |
| Consolidation | Always a dedicated agent writing `consolidated_report.md` |

## Common Mistakes

**Skipping consolidation** - Reading 4 separate findings files into main context defeats the entire purpose. Always launch a consolidation agent.

**Groups too large** - More than 6 items per agent gives diminishing returns. Partition further.

**Using foreground agents** - Blocks the main agent and loses parallelism. Always use `run_in_background=true`.

**Reading intermediate files** - The main agent should only read the consolidated report, never individual findings files.

**Not specifying output format** - Agents produce inconsistent formats that are hard to consolidate. Specify table columns in every prompt.

**Not specifying output file paths** - Agents may write to the working directory or not at all. Always include the exact output path in every prompt.

## Example: Auditing 17 Call Sites

**Task:** Investigate 17 call sites of `resolveLocalAgentID()`

**Partition:** 4 agents (4-5 call sites each, grouped by source file)

**Table schema specified in every prompt:**

| Line | Command | How ID Is Used | Behavior for 0/1/multiple | Needs Fix? |
|------|---------|----------------|---------------------------|------------|

**Result:** Main context stayed clean. Consolidation agent identified cross-cutting pattern: "8/17 calls use identity for message filtering." Final report provided prioritized recommendations.

## Variations

| Variant | When | How |
|---------|------|-----|
| **Quick** | Items are independent, output is small | Lightweight consolidation: brief merged summary instead of full synthesis |
| **Deep** | Very large N (50+) | Multi-level: 8 agents > 2 meta-agents > 1 final report |
| **Iterative** | Need to refine criteria | Run first pass, update prompts based on patterns, re-run |
