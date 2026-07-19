---
description: 上报 Claude Code、Cursor 或 Codex CLI session traceback 到 HyperData 并登记售后报告
---
# /ace:traceback

调用 `ace:ace-traceback` skill，引导用户完成 session 选择、bundle 预览、脱敏确认和上传。

## Usage

```
/ace:traceback
```

Skill 会：
1. 识别当前运行时并锁定会话：
   - Cursor 使用 `--cursor-current`。
   - Codex CLI 使用 `--codex-current`。
   - Claude Code 使用 hook 提供的固定 session id；若无 hook id，仅首次预览使用 `--last`，随后固定预览返回的 id。
2. 询问用户一句话描述问题。
3. 按 Skill 的当前运行时契约预览文件清单、脱敏统计和 session 信息。
4. 在对话中展示预览，取得明确确认。
5. 按同一预览 session 和摘要执行上传；若当前会话变化，重新预览并重新确认。
6. 核对上传与预览的 session id / source，汇报 dataset_id / report_id，并说明 inbox 跟进方式。

如果 `ace` CLI 不可用，说明纯本地诊断替代方案 `/ace:doctor`。
