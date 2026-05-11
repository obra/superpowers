---
name: Architecture · {PROJECT_NAME}
description: 项目架构基线 —— 技术栈、模块划分、运行时拓扑、外部依赖
anchors: []
last_verified: null
verified_by: null
decay_horizon: 180d
---

# Architecture · {PROJECT_NAME}

> **层级**：L1 持久基线
> **维护**：本文件**演进式更新**；不为单次变更而频繁重写。

<!--
本文件描述项目的**当前**架构状态。单次架构变更应在 docs/superpowers/specs/<date-slug>.md
中提出（含 §5 L1 Impact 节）；合入 main 时 AI 直接编辑本文件，PR diff 即是 audit trail。
-->

## 1. 概览

<!-- 一段话说明系统做什么、关键依赖、运行环境 -->

## 2. 技术栈

| 类别 | 技术 | 版本 | Anchor |
|------|------|------|--------|
| 运行时 | <!-- e.g. Bun --> | <!-- 1.x --> | `package.json#engines` |
| 框架 | | | |
| 数据存储 | | | |
| 部署 | | | |

## 3. 模块划分

<!--
列出顶层模块及其职责。引用 capability spec 而非复述。
- packages/<x>: 见 docs/reference/capabilities/<x>.md
-->

## 4. 运行时拓扑

<!--
- 进程模型
- 服务依赖图（可贴 mermaid）
- 数据流向
-->

## 5. 外部依赖与契约

<!--
- 第三方服务列表（引用 SLA 文档）
- 跨产品 API 契约引用：{BLUEPRINT}/reference/contracts/
-->

## 6. 关键架构决策（ADR 索引）

<!--
- [ADR-001: ...](../adr/001-xxx.md)
- 重大架构决策走 ADR；小决策直接更新本文件
-->

## 7. 演进策略

<!--
- 何时升级运行时、框架（如：跟随上游 LTS、半年一评）
- 重大重构提案模板：先走 Normal / Large pipeline 起草 spec
-->
