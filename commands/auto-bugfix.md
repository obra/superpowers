---
description: Start the ACE auto-bugfix watcher that polls a Feishu Bitable and generates code patches with human review
---

# /ace:auto-bugfix

Start the ACE auto-bugfix agent.

## Usage

```
/ace:auto-bugfix
```

This command invokes the `ace-auto-bugfix` skill.

## What it does

1. Polls the configured Feishu Bitable view for records with `自动修复` checked and `修复状态` = `待修复`.
2. Generates a code patch using Claude against the ACE repo in a git worktree.
3. Runs ACE tests.
4. On success: sets `修复状态` = `待审核`, fills change summary and changed files, sends a Feishu message to the bug reporter.
5. On failure: sets `修复状态` = `修复失败` and records the reason.
6. Watches `审核结果` and updates status to `已确认` or `已拒绝`.

## Configuration

Copy `ace-superpowers/skills/ace-auto-bugfix/bugfix.example.yaml` to `~/.ace/bugfix.yaml` and fill in real tokens/IDs.

## CLI

```bash
python -m ace_superpowers.skills.ace_auto_bugfix.agent --config ~/.ace/bugfix.yaml
```

## Invocation

```
Skill("ace-auto-bugfix")
```
