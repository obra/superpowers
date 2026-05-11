# Harness Pipeline · {PROJECT_NAME}

> Pipeline 三档（Micro / Normal / Large）与 tier 判定规则。AI 在创建 PR 前依据本文件自动判定 tier。
>
> 来源：spec §5.2 — `{BLUEPRINT}/docs/superpowers/specs/2026-05-08-blueprint-harness-redesign-design.md`

---

## Tier 判定规则（YAML）

```yaml
micro:
  conditions:
    - diff_lines: { max: 50 }
    - file_count: { max: 1 }
    - touches_directories:
        excluded:
          - core/
          - architecture/
          - packages/*/src/core/
    - touches_files:
        excluded:
          - docs/reference/capabilities/**
          - docs/reference/architecture.md
  stages: [implement, review, verify]
  review_iterations_max: 1

normal:
  conditions:
    - diff_lines: { max: 300 }
    - introduces_capability: false
    - changes_cross_product_contract: false
  stages: [spec, implement, review, test, verify]
  review_iterations_max: 2

large:
  conditions:
    default: true   # fallback
  stages: [understand, plan, spec, implement, review, test, verify, deploy_prep, smoke, deploy]
  review_iterations_max: 3
```

---

## Tier 升级规则

- 在 Pipeline 任意阶段，若 diff / 文件数 / 触及目录超出原 tier 上限，AI 立即提议升级到下一档
- 已完成阶段保留，不重跑
- 新 tier 多出的阶段从当前位置开始执行
- `review_iterations_max` counter 重置，按新 tier 上限重新计

**例**：原判 Micro（实现 → 评审 → 验证），实施时 diff 突增到 200 行 → AI 提议升 Normal，已完成的"实现"保留，从"评审"进入，但要先补 spec 阶段（创建 `spec.md`）。

---

## Iteration counter 语义

`review_iterations_max` 计数器只在以下事件递增：

| 事件 | 是否递增 |
|------|---------|
| Evaluator agent 提出 MUST FIX | ✅ |
| 守门人显式 reject 并要求修改 | ✅ |
| AI Code Review 给出"建议"但无 MUST FIX | ❌ |
| CI 编译 / 测试失败 | ❌（视为同一轮内的修复） |
| 守门人 approve 后又改 PR | ✅（重启评审）|

设计意图：counter 衡量**语义层面的 review 轮数**，不是技术失败次数。

---

## 项目特化覆盖

<!--
若本项目对 tier 判定有特殊条件（例：移动端要 binary 大小限制；后端要 migration 检测），
在此覆盖 conditions 字段。其他字段继承上方默认。
-->
