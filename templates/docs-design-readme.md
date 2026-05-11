# `docs/design/` —— 设计资产

> **层级**：混合（L1 system + L2 changes）
> **作用**：设计系统基线 + 单次变更视觉产物。

---

## 目录结构

```
docs/design/
├── README.md          # 本文件
├── system/            # L1 · 设计系统（design tokens / components / 规范）
│   ├── tokens/
│   ├── components/
│   └── guidelines/
└── changes/           # L2 · 单次变更视觉产物
    └── <YYYY-MM-DD-slug>/
        ├── mockup.png
        ├── interaction-notes.md
        └── ...
```

---

## L1 · `design/system/`

**持久度**：永久；不删除，演进式更新。

包含：

- **Tokens**：色板、字号、间距、阴影、动效曲线
- **Components**：可复用 UI 元件的视觉规范
- **Guidelines**：可访问性、暗色模式、栅格、响应式断点

设计系统的修改走 Normal / Large pipeline（spec ratification → 实施 → 评审 → 合入）。

---

## L2 · `design/changes/<change>/`

**持久度**：保留为 audit；视设计资产价值决定是否长期保留。

包含单次变更的视觉产物：

- `mockup.png` / `mockup.fig` 链接
- `interaction-notes.md`：交互细节、动画时序、边界态描述
- 若有 demo 分支：`design/<feature>` git ref

**命名约定**：与 `docs/plan/<change>/` 保持同名（如 `2026-05-08-feature-x/`）。

---

## 与 spec 的关系

L2 spec（`docs/plan/<change>/spec.md`）的 §2 设计视角节会引用本目录的视觉产物：

```markdown
## §2 设计视角
### 视觉产物
- mockup: docs/design/changes/2026-05-08-feature-x/mockup.png
- demo branch: design/feature-x
```

---

## 进一步阅读

- Spec §2.4（L2 三视角 spec schema）
- Spec §6.4（ui-evaluator Playwright 集成）
