# `.harness/` —— Harness Engineering 配置目录

本目录包含项目级 Harness 配置。AI 与 CI 在每次会话 / PR 时读取这些文件。

---

## 文件清单

| 文件 | 作用 | 谁维护 |
|------|------|-------|
| `pipeline.md` | Pipeline 三档定义与 tier 判定规则 | 项目 owner |
| `gates.json` | Quality Gate 配置（universal / normal_and_large 两组）| 项目 owner |
| `role-bindings.yaml` | 项目级角色绑定覆盖（users / function_skills / strictness）| 项目 owner |
| `anchors/index.yaml` | Freshness anchor 索引 | **CI 自动生成，勿手动编辑** |

---

## 与其他位置的关系

- **Team baseline**：`{SUPERPOWERS}/templates/role-bindings.yaml` —— 项目侧仅写差异
- **PR 守门人**：`.github/CODEOWNERS` —— 由 GitHub 在 PR 时 enforce，与 `.harness/` 解耦
- **三层 spec**：`docs/reference/`（L1） / `docs/design/`（L1 系统 + L2 资产） / `docs/superpowers/{specs,plans}/`（L2 + L3） —— Pipeline 通过 gates.json 中的 `spec_ratification` 与之联动

---

## 修改流程

1. `pipeline.md` / `gates.json` / `role-bindings.yaml` 任何修改都走 PR
2. 修改 tier 判定 / gate 阈值时，PR description 必须说明依据（spec 引用或失败案例引用）
3. `anchors/index.yaml` **禁止手动 PR** —— 仅接受 CI 提交的更新

---

## 进一步阅读

- Spec §5（Pipeline 与 Quality Gate）
- Spec §4（角色三维度）
- Spec §8（Freshness / Mitchell 循环）

完整 spec：`{BLUEPRINT}/docs/superpowers/specs/2026-05-08-blueprint-harness-redesign-design.md`
