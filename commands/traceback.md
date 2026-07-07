---
description: 上报 Claude Code session traceback 到 HyperData 并登记售后报告
---
# /ace:traceback

调用 `ace:ace-traceback` skill，引导用户完成 session 选择、bundle 预览、脱敏确认和上传。

## Usage

```
/ace:traceback
```

Skill 会：
1. 取得当前 session id（hook 上下文优先，否则 `ace traceback --last`）。
2. 询问用户一句话描述问题。
3. 运行 `ace traceback --last --dry-run --json` 预览文件清单和脱敏统计。
4. 在对话中展示预览，取得明确确认。
5. 运行 `ace traceback --last --yes --json -m "<描述>"` 完成上传。
6. 汇报 dataset_id / report_id，并说明 inbox 跟进方式。

如果 `ace` CLI 不可用，说明纯本地诊断替代方案 `/ace:doctor`。
