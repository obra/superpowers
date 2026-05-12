---
name: editing-structured-data
description: Use when reading, querying, or editing JSON, YAML, TOML, or XML files from the shell — never invoke node/python/ruby one-liners for this; use yq (and jq for JSON-only) so a narrow allowlist can grant permission without exposing arbitrary code execution.
---

# Editing Structured Data Files

## Overview

When modifying JSON, YAML, TOML, or XML from the shell, use `yq` (or `jq` for JSON-only). **Never use `node`, `python`, `ruby`, `perl`, or any general-purpose interpreter** for this task.

**Why:** `yq *` and `jq *` can be safely allowlisted in `settings.json` — their input language is a data-query DSL, not arbitrary code. `node *` / `python *` execute arbitrary programs and cannot be safely allowlisted.

## The Rule

| Task | Use | Do NOT use |
|------|-----|------------|
| Edit/query JSON | `jq` or `yq -p json -o json` | `node -e`, `python -c` |
| Edit/query YAML | `yq` | `node -e`, `python -c`, `ruby -e` |
| Edit/query TOML | `yq -p toml -o toml` | `node`, `python` |
| Edit/query XML | `yq -p xml -o xml` | `node`, `python` |

`yq` (mikefarah/yq, Go binary) handles JSON, YAML, TOML, XML, properties, CSV with `-p` (input) and `-o` (output) flags.

## Patterns

**Read a value:**
```bash
yq '.foo.bar' file.yaml
jq '.foo.bar' file.json
```

**Edit in place:**
```bash
yq -i '.foo.bar = "new"' file.yaml
jq '.foo.bar = "new"' file.json > tmp && mv tmp file.json   # jq has no -i
```

**Add to array:**
```bash
yq -i '.list += ["item"]' file.yaml
```

**Delete key:**
```bash
yq -i 'del(.foo.bar)' file.yaml
```

**Convert formats:**
```bash
yq -p yaml -o json file.yaml > file.json
yq -p json -o yaml file.json > file.yaml
```

**Merge files:**
```bash
yq -i '. *= load("other.yaml")' file.yaml
```

## Red Flags — STOP

If about to run any of these for structured-data editing, stop and rewrite with `yq`/`jq`:

- `node -e "...JSON.parse..."`
- `node -e "...require('fs')...writeFile..."`
- `python -c "import json..."`
- `python -c "import yaml..."`
- `ruby -e "require 'json'..."`
- `perl -e` for JSON/YAML
- Inline heredoc scripts that parse/emit JSON/YAML

**All of these mean: rewrite as `yq` or `jq`.**

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just a one-liner" | One-liner with `node *` defeats the allowlist. Use yq. |
| "The transform is too complex for jq" | yq/jq DSLs handle nested updates, conditionals, joins. Try first. |
| "yq isn't installed" | Install it (`brew install yq`). Don't fall back to node. |
| "I need to call an API too" | Split: yq for the file edit, separate tool for the API. |
| "It's just reading, not editing" | Read with `yq`/`jq` too. Keep the allowlist tight. |

## When yq/jq Genuinely Won't Work

Rare. Examples: needing schema validation, calling external APIs mid-transform, format yq doesn't support.

In those cases: write a real script file (`.py`, `.js`), commit it, and run it as `python ./script.py` — not as an inline `-e` / `-c` interpreter invocation. The allowlist can permit the specific script path without permitting arbitrary code.

## Install

```bash
brew install yq    # macOS
# or: https://github.com/mikefarah/yq/#install
```
