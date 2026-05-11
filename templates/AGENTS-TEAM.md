# AGENTS.md · Team Baseline (Vattention)

> **作用**：跨产品共享的 Harness Engineering 基线。所有项目级 `AGENTS.md` 通过 `@import {SUPERPOWERS}/templates/AGENTS-TEAM.md` 继承本文件。
>
> **维护人**：Harness 工作组。修改前请走 PR 流程。

---

## 1. AGENTS.md 合并语义

加载顺序（later overrides earlier）：

1. `Superpowers/templates/AGENTS-TEAM.md`（本文件，组织级 baseline）
2. `blueprint/AGENTS.md`（跨产品层）
3. `<项目>/AGENTS.md`（项目特化）
4. `<项目>/<workdir>/AGENTS.md`（子目录特化，walk up 到项目根）

### 规则

- **默认 closest-wins**：冲突指令以最近的一份为准
- **`@import` 显式跨树引用**：parse 阶段把被 import 的文件内容直接插入到 import 行位置
- **列表合并**：标题行末加 `<!-- @extend -->` → 追加而非替换
- **章节锁定**：标题行末加 `<!-- @final -->` → 禁止下层覆盖

### 变量

- `{SUPERPOWERS}` = Superpowers 仓库根（`FACIO_SUPERPOWERS_PATH` 或默认 `~/Work/facio-superpowers`）
- `{BLUEPRINT}` = Blueprint 仓库根（`FACIO_BLUEPRINT_PATH` 或默认 `~/Work/facio-blueprint`）

由 AI 在解析 `@import` 路径时展开，不在文件中做字符串替换。

---

## 2. 红线（不可覆盖）<!-- @final -->

下列规则**禁止**项目级 / 子目录级 AGENTS.md 覆盖。

- 不允许直推 `main` / `master`
- 不允许 force push 任何共享分支
- 不允许跳过 hooks（`--no-verify`、`--no-gpg-sign` 等）
- 不允许在未取得 owner 明确授权时执行破坏性操作（`reset --hard`、`branch -D`、`rm -rf` 共享目录、删数据库表）
- 不允许向第三方系统（Slack、邮件、外部 webhook、共享文档）发送内容前不与人确认
- 不允许把秘密（`.env`、密钥、token）提交进仓库

---

## 3. PR 六条规则

> 来源：团队交付质量手册 v1。所有 PR（任意 tier）必须满足。

1. **Tier 判定先行**：PR 创建前依据 `.harness/pipeline.md` 自动判定 Micro / Normal / Large，开发者确认（可手动升级，不能降级）
2. **Test plan 必填**：PR description 必须含 "Test plan" 章节（Normal / Large 强制；Micro 可一行说明）
3. **CODEOWNERS approve**：相关代码区域的守门人必须 approve，由 Branch Protection enforce
4. **CI 全绿**：编译 + 测试 + AI Code Review 三项；AI Code Review 不阻 merge 但守门人参考
5. **Spec ratification（仅 Normal / Large）**：`docs/superpowers/specs/<date-slug>.md` 三 owner（PM / 设计 / 研发）全部 approve 后方可进实施
6. **AC 覆盖检查（仅 Normal / Large）**：spec 中的 AC 必须在 `docs/superpowers/plans/<date-slug>.md` 中均有对应 task，AI 在 PR 前自动校验

---

## 4. 角色三维度

三个**正交**维度，禁止做"端侧 senior"这种复合切片：

| 维度 | 内容 | 实现机制 | 存储位置 |
|------|------|---------|---------|
| 职能 | frontend-dev / non-frontend-dev / non-dev | Skill 切片 | `{SUPERPOWERS}/skills/role-*` |
| 经验 | low / medium / high strictness | 元参数 | `role-bindings.yaml` |
| 代码区域 | 前 / 后 / SDK | GitHub CODEOWNERS | `.github/CODEOWNERS` |

### 加载流程

1. AI 读取合并后的 `role-bindings.yaml`（baseline + 项目覆盖）
2. 通过 `lark-cli contact +get-user --as user` 获取 open_id
3. 匹配 `users:` 列表 → 得 function + strictness
4. 加载 `function_skills` 中对应 skills
5. 应用 `strictness_levels` 行为参数

**Fallback**：lark-cli 不可用 → 提示用户手动指定一次；open_id 不在表中 → 默认 `non-dev` + `high`，提示申请加入。

---

## 5. Spec 三层模型简介

| 层 | 含义 | 持久度 | 产出方 |
|----|------|--------|-------|
| **L1** | `docs/reference/capabilities/*.md`、`architecture.md`、`conventions.md` —— 系统当前 MUST 做什么 | 永久 | 人主导 + AI 起草 |
| **L2** | `docs/superpowers/specs/<date-slug>.md` —— 这次改什么、为什么 | 临时（归档） | AI 起草 + 人审 |
| **L3** | `docs/superpowers/plans/<date-slug>.md` —— 怎么一步步做 | 临时（可丢） | AI 全产 |

**不使用 delta artifact**：变更合入 main 后，AI 直接编辑对应 `reference/capabilities/*.md`（在 PR 中体现 diff），无中间产物。理由：减少同步开销，diff 即是 audit trail。详见 `{SUPERPOWERS}/docs/specs/2026-05-08-blueprint-harness-redesign-design.md` §2.6。

---

## 6. Pipeline 三档简介

| Tier | 条件 | 阶段 | 评审循环上限 |
|------|------|------|-----------|
| Micro | 单文件 ≤ 50 行 + 不动 core/architecture + 不动 capabilities | implement → review → verify | 1 |
| Normal | 跨文件 ≤ 300 行 + 不引入新 capability + 不变更跨产品契约 | spec → implement → review → test → verify | 1-2 |
| Large | 上述以外 | 10 阶段完整 Pipeline | 2-3 |

详见 `.harness/pipeline.md`（项目级）与 spec §5。

---

## 7. Generator / Evaluator 分离

| Tier | 形态 |
|------|------|
| Micro | 同 session 不同 prompt phases |
| Normal | 不同 session（subagent dispatch）|
| Large | 不同 agent definitions（`{SUPERPOWERS}/agents/`）|

**Anti-sycophancy 保证**仅 Normal / Large 完整提供（Evaluator 不知 Generator 历史）。

---

## 8. 反模式约束

- **不要写厚知识**：能在代码 / spec 里直接读到的，AGENTS.md / 知识库只放指针 + 解读
  - ❌ "我们 video-editor 用 Bun 1.x"
  - ✅ "运行时见 `package.json#engines.bun`，原因见 [decision-2026-03 Node→Bun]"
- **不要复制 spec 内容**：若信息已在 `docs/reference/` 或 `docs/superpowers/{specs,plans}/` 中，引用而非复述
- **不要把临时讨论写进 AGENTS.md**：临时决策走 L2 spec，永久能力走 L1 capability

---

## 9. 引用资源

- Spec 源：`{BLUEPRINT}/docs/superpowers/specs/2026-05-08-blueprint-harness-redesign-design.md`
- AGENTS.md 标准：<https://agents.md>
- 团队交付质量手册 v1（飞书）
- AI Coding 协作方式（飞书）
