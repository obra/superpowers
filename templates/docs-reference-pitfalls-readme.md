# Pitfalls

> 已知风险 / 故障模式 / 排查指南。每条 note ≤ 50 行。

## 何时用本类

- 真实发生过的故障 + root cause + 修复
- 容易踩的坑 + 规避方法
- 排查某类问题的步骤清单

不属于本类：未发生的纯假设风险（→ spec §12 风险表）；最佳实践（→ guidelines/）

## Frontmatter schema

```yaml
---
id: K-pitfalls-NNN
type: pitfall
title: <Human-readable>
maturity: draft | verified | proven
ref_count: 0
last_referenced:
tags: [<tag1>, <tag2>]
created: YYYY-MM-DD
source: <spec change_id 或 "manual">
---
```
