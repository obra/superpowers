# `docs/reference/` —— L1 持久能力基线

> **层级**：L1（spec 三层模型）—— 系统当前 **MUST** 做什么。
> **持久度**：永久；演进式更新。
> **产出方**：人主导 + AI 起草。

---

## 目录结构

```
docs/reference/
├── README.md                  # 本文件
├── architecture.md            # 架构基线（技术栈、模块划分、运行时拓扑）
├── conventions.md             # 项目级团队约定（代码规范、命名、目录规则）
└── capabilities/              # 系统能力 specs（按 capability 组织）
    ├── <capability-1>.md
    └── ...
```

---

## Capability spec 规范

每个 `capabilities/*.md` 遵循 OpenSpec 风格 schema：

```markdown
# {Capability Name}

> **Owner**: <role / person>
> **Anchors**: <code paths or symbols>
> **Last verified**: YYYY-MM-DD

## Purpose
{一段话说明这个 capability 解决什么 / 为谁服务}

## Requirements
- The system MUST {requirement 1}
- The system SHOULD {requirement 2}
- The system MAY {requirement 3}

## Scenarios
### {Scenario name}
- **Given** {precondition}
- **When** {action}
- **Then** {expected outcome}

## Non-goals
- {explicit exclusions}

## Related
- {pointers to ADRs / 相关 capability / 上下游依赖}
```

**RFC 2119 关键词**（MUST / SHOULD / MAY）必须使用 —— AI 据此生成测试用例。

---

## Frontmatter（带 anchors）

带 freshness anchors 的 capability spec 顶部加 YAML frontmatter：

```yaml
---
name: <capability name>
description: <1-2 句>
anchors:
  - path: packages/foo/src/bar.ts
    selector: '$.exports["doX"]'   # 可选：JSONPath / line-range / regex
last_verified: 2026-04-15
verified_by: <name>
decay_horizon: 90d
---
```

CI 在 PR 触及 anchor `path` 且 `last_verified` 距今 > 30 天时标记 drift（见 spec §8.2）。

---

## 演进规则

- **新增 capability**：单独 PR，走 Normal / Large pipeline
- **修改既有 capability**：AI 直接编辑对应 `capabilities/*.md` 文件，PR diff 即是 audit trail。L2 spec（`docs/superpowers/specs/<date-slug>.md`）的 §5 L1 Impact 节描述受影响的 capability 与变更理由
- **删除 capability**：显式删除文件，L2 spec 的 §5 L1 Impact 节说明替代路径

**不使用 delta artifact**：v1.3.0 设计阶段考虑过 OpenSpec 风格的 `delta.md` 中间产物，最终弃用 —— 减少同步开销，PR diff 自然承担 audit 责任。详见 spec §2.6。

---

## 进一步阅读

- Spec §2.3（L1 capability spec schema）
- Spec §2.6（为何弃用 delta artifact）
- Spec §8（Freshness anchors）

完整 spec：`{BLUEPRINT}/docs/superpowers/specs/2026-05-08-blueprint-harness-redesign-design.md`
