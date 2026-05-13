# Decisions

> 技术选型 / 架构决策 + 理由（含被否决方案）。每条 note ≤ 50 行。

## 何时用本类

- 选了某技术 / 库 / 模式而非另一个（如 "用 Postgres 不用 SQLite 做 ingestion"）
- 做了某个不可逆的架构选择
- 否决了某方案，需记录理由防止重新讨论

不属于本类：实施细节（写代码即可）；普遍 best practice（→ guidelines/）；故障模式（→ pitfalls/）

## Frontmatter schema

```yaml
---
id: K-decisions-NNN           # 全局唯一，3 位 zero-padded
type: decision
title: <Human-readable>
maturity: draft | verified | proven
ref_count: 0                  # CI 自动维护
last_referenced:              # CI 自动维护
tags: [<tag1>, <tag2>]
created: YYYY-MM-DD
source: <spec change_id 或 "manual">
---
```

## 用法

- spec-author Step 5 起草新 note 时拷贝本目录现有文件作模板
- 不直接编辑 `docs/reference/catalog.md`（catalog 由 `scripts/rebuild-catalog.sh` + CI 自动重建）
