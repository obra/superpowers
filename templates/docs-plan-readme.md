# `docs/plan/` —— 单次变更容器（L2 + L3）

> **层级**：L2（spec / delta）+ L3（tasks）
> **持久度**：临时（保留为 audit；6 个月后可归档）
> **产出方**：AI 起草 + 人审

---

## 目录结构

```
docs/plan/
├── README.md
└── <YYYY-MM-DD-slug>/         # 每个变更一个目录
    ├── spec.md                # L2 · 三视角集成 spec（PM/Designer/Engineer）
    ├── tasks.md               # L3 · 实施计划（writing-plans skill 产）
    └── delta.md               # L2 · 对 reference/capabilities/*.md 的 ADDED/MODIFIED/REMOVED
```

---

## 文件说明

### `spec.md` —— L2 三视角 spec

固定 schema：

- **§1 产品视角**（PM owner）：产品逻辑、用户旅程、AC
- **§2 设计视角**（设计师 owner）：风格 / 设计 token、关键交互、视觉产物链接
- **§3 研发视角**（研发 owner）：技术架构、模块拆解、test plan 骨架、风险点
- **§4 Cross-viewpoint Open Issues**：跨视角悬而未决的问题
- **§5 Pipeline Tier Justification**：为何归 Micro / Normal / Large

三 owner 全部 approve → 状态 `Ratified` → 可进实施。

### `tasks.md` —— L3 实施计划

由 Superpowers `writing-plans` skill 产出，bite-sized TDD steps，每步 checkbox。实施完成可删除（无信息保留价值）。

### `delta.md` —— L2 delta（合入 main 时由 AI 自动产）

ADDED / MODIFIED / REMOVED 段，按 OpenSpec 风格描述对 `reference/capabilities/*.md` 的影响。合入后 AI 合并到对应 capability spec。

---

## 生命周期

1. PM 提需求 → AI 创建 `docs/plan/<YYYY-MM-DD-slug>/`
2. AI 起草 `spec.md`（三视角）→ 三 owner 评审 → Ratified
3. AI 用 `writing-plans` 产 `tasks.md` → 守门人 review
4. AI 依 tasks 实施（checkbox 推进）
5. CI 全绿 + AI Review + 守门人 approve → 合入 main
6. AI 自动产 `delta.md` → 合并到 `reference/capabilities/`
7. 本目录保留为 audit（status: Archived）

---

## 与设计资产的关系

视觉产物在 `docs/design/changes/<change>/`，与本目录同名。`spec.md §2 设计视角` 引用之。

---

## 进一步阅读

- Spec §2.4（L2 三视角 spec schema）
- Spec §2.5（L3 tasks schema）
- Spec §2.6（L2 delta schema 与冲突处理）
- Spec §2.7（生命周期）
