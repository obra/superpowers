---
name: ace-auto-bugfix
description: Use when ACE bugs are tracked in a Feishu Bitable and a user wants to auto-generate code patches with human review via Feishu messages
---

# ACE Auto Bugfix from Feishu Bitable

## Overview

Listen to a Feishu Bitable bug tracker, auto-generate code patches for ACE using Claude, run tests, and request human review via Feishu messages before committing.

## When to Use

- User mentions auto-fixing ACE bugs from a Feishu Bitable
- Need to poll a Bitable view for records marked "auto-fix"
- Need to generate code patches for ACE and update Bitable status
- Need to send Feishu review messages to the bug reporter

## Prerequisites

- `lark-cli` installed and authenticated with user identity
- Scopes: `wiki:node:retrieve`, `docs:document.content:read`, base domain read/write, `im:message:send_as_user` or bot message scope
- ACE repo path known (default `/data/codes/ace`)
- Bitable base-token, table-id, and view-id known

## Quick Reference

| Field | Purpose |
|-------|---------|
| `自动修复` | Checkbox. Checked by user to trigger workflow |
| `修复状态` | Single select: 待修复 → 修复中 → 待审核 → 已确认/已拒绝/修复失败 |
| `代码变更摘要` | Text. AI-generated summary of the fix |
| `变更文件` | Text. Comma-separated changed file paths |
| `分支或PR链接` | Text. Branch/PR after patch |
| `审核结果` | Single select: 通过 / 拒绝 |
| `修复完成时间` | Datetime |
| `失败原因` | Text. Populated if fix fails |

## Workflow

1. **Poll** the Bitable view for records where `自动修复` is checked and `修复状态` = "待修复".
2. **Lock** the record by setting `修复状态` = "修复中".
3. **Build context** from `问题描述`, `复现路径`, `环境`, `类型`, `截图`.
4. **Generate patch** using Claude against the ACE repo (git worktree or temp branch).
5. **Run tests** relevant to the changed files.
6. **On success**: set `修复状态` = "待审核", fill `代码变更摘要`, `变更文件`, `修复完成时间`, send Feishu message to `上报人`.
7. **On failure**: set `修复状态` = "修复失败", fill `失败原因`.
8. **On review**: when `审核结果` = "通过", set `修复状态` = "已确认"; if "拒绝", set to "已拒绝".

## Required Scopes

```bash
lark-cli auth login --scope "wiki:node:retrieve,docs:document.content:read"
lark-cli auth login --domain base
lark-cli auth login --domain im
```

## CLI Usage

```bash
ace bugfix watch --config /path/to/bugfix.yaml
```

Or run the agent directly:

```bash
python -m ace_auto_bugfix.agent --config bugfix.yaml
```

## Implementation Notes

- Use a git worktree or temp branch to avoid polluting the main ACE checkout.
- Keep the prompt focused: problem description + reproduction path + relevant code snippets.
- Use `lark-cli base +record-list --view-id` for filtered polling.
- Send review messages with a link back to the Bitable record and clear "通过/拒绝" instructions.
- Never commit or push changes without human review.

## Canonical Statements

- "Polling Bitable for auto-fix requests..."
- "Generating patch for record {record_id}..."
- "Running tests on the generated patch..."
- "Sending review message to {reporter}..."
- "Updating Bitable status to {status}..."
