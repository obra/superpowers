# Guidelines

> recommend / avoid pattern。每条 note ≤ 50 行。

## 何时用本类

- 在本 codebase 里某做法值得重复 / 应当避免（如 "async error handling 优先 try-catch + 类型化错误"）
- 不绑定具体技术选型（选 Postgres 是 decision；用 Postgres 时 schema 命名约定是 guideline）

不属于本类：单次决策（→ decisions/）；故障 / 排查（→ pitfalls/）

## Frontmatter schema

```yaml
---
id: K-guidelines-NNN
type: guideline
title: <Human-readable>
maturity: draft | verified | proven
ref_count: 0
last_referenced:
tags: [<tag1>, <tag2>]
created: YYYY-MM-DD
source: <spec change_id 或 "manual">
---
```
