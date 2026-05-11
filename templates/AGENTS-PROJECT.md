# AGENTS.md · {PROJECT_NAME}

@import {SUPERPOWERS}/templates/AGENTS-TEAM.md
@import {BLUEPRINT}/AGENTS.md

> 本文件继承团队 baseline 与跨产品层。仅在此处写**项目特化覆盖**与**项目级指针**。
>
> 不要复制 baseline 内容；冲突指令依靠 closest-wins 自动覆盖。

---

## 1. 项目身份

- **Project**: {PROJECT_NAME}
- **Repository**: <!-- TODO: git URL -->
- **Owners**: <!-- TODO: PM / Designer / Tech lead -->

---

## 2. Technical stack overrides

<!-- 仅列出与 team baseline / blueprint 不同的部分；同则不写 -->

- Runtime: <!-- e.g. Node 22 / Bun 1.x / Rust 1.80 -->
- Framework: <!-- e.g. Next.js / SwiftUI / React Native -->
- 设计系统: <!-- e.g. Radix Themes / 自研 -->
- 包管理: <!-- e.g. yarn workspaces / pnpm / cargo workspace -->

---

## 3. 角色绑定指针

项目级覆盖：`.harness/role-bindings.yaml`

- 项目用户列表与 strictness 在该文件 `users:` 维护
- function → skill 的默认映射继承自 `{SUPERPOWERS}/templates/role-bindings.yaml`
- 在项目侧仅覆盖**与默认不同**的映射

---

## 4. 三层文档约定指针

| 层 | 位置 | 入口 README |
|----|------|-----------|
| L1 持久能力 | `docs/reference/` | `docs/reference/README.md` |
| L1 设计系统 | `docs/design/system/` | `docs/design/README.md` |
| L2 单次变更 spec | `docs/superpowers/specs/<date-slug>.md` | — |
| L2 单次变更视觉产物 | `docs/design/changes/<date-slug>/` | `docs/design/README.md` |
| L3 实施计划 | `docs/superpowers/plans/<date-slug>.md` | — |

---

## 5. Pipeline 配置指针

- Tier 判定规则与各 tier 阶段：`.harness/pipeline.md`
- Quality Gate 定义：`.harness/gates.json`
- Freshness anchors 索引（自动生成，勿手动编辑）：`.harness/anchors/index.yaml`

---

## 6. 项目特化红线 <!-- 可选；继承 team baseline @final 不可被覆盖 -->

<!--
在此追加项目级红线。例：
- 不允许在 prod 环境直接跑 schema migration
- 不允许 import 已 deprecated 的 internal/legacy/* 包
-->

---

## 7. 项目特化必须做到 <!-- @extend -->

<!--
此列表追加到 team baseline 的 "必须做到" 列表（如有），不替换。
- {项目特化规则}
-->

---

## 8. 项目专属 Skills / Agents

<!--
列出本项目独占的 skill / agent，及其 trigger 条件。
- skill-name: 触发条件
-->
