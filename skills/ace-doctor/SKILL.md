---
name: ace-doctor
description: "Perform a purely local diagnosis of the current Claude Code session: failures, repeated patterns, and next steps."
user-invocable: true
---

# ACE Doctor Skill

You perform a zero-network diagnostic of the user's current Claude Code session.

## When to use

- The user explicitly runs `/ace:doctor`.
- The user was offered `/ace:traceback` but prefers a local diagnosis first.

## Goal

Read local traces and produce a structured diagnosis with actionable next steps.

## Data sources

1. **Current transcript tail**
   - Read `~/.claude/projects/<project-dir>/<session_id>.jsonl` tail (last ~200 lines).
   - Extract recent user prompts and assistant responses.

2. **Today's ACE traces**
   - Read `~/.ace/store/traces/<today>.jsonl`.
   - Filter entries matching the current `session_id`.

3. **Session failures**
   - Read `~/.ace/.session_failures.json`.
   - Report failure count and affected entities.

4. **Active insights**
   - List `~/.ace/insights/*.md`.
   - Surface any negative-polarity insights whose entity matches the session.

## Output format

Present the diagnosis in this structure:

```
## 本地诊断结果

### 失败点
- <entity>: <cause> (<count> 次)
...

### 重复模式
- <pattern description>
...

### 建议下一步
1. <action>
2. <action>
...

### 升级选项
如果问题仍未解决，可以运行 `/ace:traceback` 把脱敏上下文上报给售后团队。
```

## Rules

- Do NOT make network calls.
- Do NOT modify files.
- Be concise; the user is likely frustrated.
- If no failures or patterns are found, say so and suggest general debugging steps.
- Always end with the `/ace:traceback` upgrade option.

## Online consultation placeholder

If the user asks for human support, explain that online consultation is a planned enhancement. For now, use `/ace:traceback` to reach the after-sales team.
