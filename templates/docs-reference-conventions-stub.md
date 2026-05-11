---
name: Conventions · {PROJECT_NAME}
description: 项目级团队约定 —— 代码规范、命名、目录规则、git 工作流
anchors: []
last_verified: null
verified_by: null
decay_horizon: 180d
---

# Conventions · {PROJECT_NAME}

> **层级**：L1 持久基线
> **作用**：项目级团队约定。Team baseline 共享部分见 `{SUPERPOWERS}/templates/AGENTS-TEAM.md`，本文件只写项目特化。

---

## 1. 代码风格

<!--
- Linter / Formatter 配置位置（引用 .eslintrc / rustfmt.toml / .prettierrc）
- 行宽 / 缩进 / 命名约定
- 不在此处复述配置内容；引用文件 + 注释原因
-->

## 2. 目录与文件命名

<!--
- 顶层目录用途（packages/, apps/, services/...）
- 文件命名约定（kebab-case / camelCase / PascalCase 各适用范围）
- 测试文件位置约定
-->

## 3. 模块边界规则

<!--
- 哪些目录允许相互依赖、哪些禁止
- 内部 API vs 外部 API 的标识方式（如：`internal/` 子目录、export 列表）
-->

## 4. 测试约定

<!--
- 单元 / 集成 / E2E 的目录划分
- 测试命名约定
- mock 策略（spec §2.7 提到：避免 mock 与 prod 分歧）
-->

## 5. Git 工作流

<!--
- 分支命名约定（feature/ / fix/ / chore/）
- Commit message 规范（继承 conventional commits 或自定义）
- 合并策略（squash / merge / rebase）
-->

## 6. 错误处理与日志

<!--
- 异常分类与传播规则
- 日志级别使用约定
- 不要为不会发生的场景写防御代码（与 Harness AGENTS-TEAM § 反模式 一致）
-->

## 7. Anti-patterns

<!--
明确禁止的写法，每条注明原因（引用过去事故或决策）。
-->
