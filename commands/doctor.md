---
description: 纯本地诊断当前 Claude Code session 的失败模式与下一步建议
---
# /ace:doctor

调用 `ace:ace-doctor` skill，对当前 session 做纯本地分析，零网络依赖。

## Usage

```
/ace:doctor
```

Skill 会：
1. 读取当前 transcript 尾部。
2. 读取 `~/.ace/store/traces/<today>.jsonl` 中本 session 相关 trace。
3. 读取 `~/.ace/.session_failures.json` 失败统计。
4. 读取活跃 insights 中与本 session 相关的负向知识。
5. 输出结构化诊断：失败点、重复模式、建议下一步。
6. 结尾提供 `/ace:traceback` 升级选项，用于上报售后。

在线问诊入口预留在此 skill；本期只做本地分析，不调用外部服务。
