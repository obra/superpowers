---
description: ACE Paradigm 3 - Develop ACE framework using superpowers
---
# ACE P3 - ACE Development

Improve ACE framework using official superpowers skills with evolution闭环.

## Usage

This command invokes the `ace-development` skill from ace-superpowers.

## ACE CLI Commands (Recommended)

### List Nodes
```bash
ace node list [--device <device_id>]
```

### Show Node Details
```bash
ace node show <node_id>
```

### Run Evolution Cycle
```bash
ace evolve run
```

### Show Evolution Health
```bash
ace evolve health
```

### List Insights
```bash
ace insight list [--type <type>] [--status <status>]
```

### View Insight Details
```bash
ace insight show <insight_id>
```

### Knowledge Search
```bash
ace knowledge search "<query>"
```

### Knowledge Ingest
```bash
ace knowledge ingest <file_path> [--type <type>]
```

### Run Tests
```bash
ace sandbox test [test_pattern]
```

## Workflow

1. Design (`superpowers:brainstorming`)
2. Plan (`superpowers:writing-plans`)
3. Execute (`superpowers:executing-plans`)
4. Evolution闭环 (`/ace-evolve`)
5. Complete (`superpowers:finishing-a-development-branch`)

## Output

- Specs: docs/superpowers/specs/
- Plans: docs/superpowers/plans/

## Invocation

```
Skill("ace-development")
```
