# Horspowers 技能触发评估与 A/B 迭代框架设计文档

**设计时间**: 2026-05-11
**状态**: 设计完成，待实施
**适用分支**: `codex/skill-compat-review`

---

## 1. 背景

当前 Horspowers 已经同时面向 Claude Code 与 Codex 维护一套共享 skills，但两类宿主在以下方面存在天然差异：

1. skill discovery 入口不同
2. session startup 注入方式不同
3. 工具名与能力映射不同
4. 模型对强 trigger 文案的服从方式不同

这会直接导致同一条用户表达在两个宿主上的触发结果不一致。仅靠主观体验调整 `SKILL.md` 的 `description`，容易出现：

- Claude Code 触发率提升，但 Codex 下降
- Codex 更积极地命中 process skill，Claude Code 更保守
- 某个 skill 的 wording 变宽后吞噬邻近 skill 的触发边界

因此需要先把“触发率优化”变成一个可观测、可回归、可分层实验的问题，再决定后续到底调整共享 `description`，还是调整宿主专属 startup prompt。

---

## 2. 本次设计目标

### 2.1 目标

1. 为 Claude Code 与 Codex 建立同构的 skill trigger 评估框架
2. 将触发问题拆分为共享层、宿主注入层、结果层三个层级
3. 提供一份可维护的触发语料库（corpus）
4. 提供统一的评分标准与失败原因分类
5. 让后续 description / startup prompt 调整可以做 A/B 对比而不是凭感觉迭代

### 2.2 非目标

1. 本轮不直接大规模修改所有 skill description
2. 本轮不直接重写 Claude Code hook 或 Codex bootstrap
3. 本轮不追求全自动执行所有宿主端评估
4. 本轮不解决所有 trigger 误差，只先建立评估与迭代基础设施

---

## 3. 核心问题定义

我们要回答的不是“哪个 description 更好”，而是以下四个问题：

1. 某条用户表达在 Claude Code 是否触发正确 skill
2. 同一条表达在 Codex 是否触发正确 skill
3. 是否触发到了可接受的备选 skill
4. 调整某一层后，整体结果是变好还是变坏

换句话说，本次设计的核心产物不是新的 wording，而是一套“先测量、再改动、再回归”的触发实验工作流。

---

## 4. 设计原则

### 4.1 分层隔离

触发行为拆成三层：

1. **共享层**
   - `skills/*/SKILL.md` 的 frontmatter description
2. **宿主注入层**
   - Claude Code 的 session-start / startup 注入
   - Codex 的 `using-horspowers` / bootstrap / startup guidance
3. **结果层**
   - 给定用户原话，最终触发了哪个 skill

评估与调优时，一次只改一层。

### 4.2 同语料双宿主

同一份语料必须在 Claude Code 与 Codex 两边都运行，才能判断是共享层问题还是宿主层问题。

### 4.3 优先观测，不先激进改写

第一轮的重点不是马上提高分数，而是建立 baseline，识别最容易混淆的 skill 边界与宿主偏差。

### 4.4 人可读优先

第一版评估结果允许“半自动执行 + 人工标注”，不要求先上完全自动化。只要结果稳定、格式统一，就已经足够指导下一轮迭代。

---

## 5. 评估范围

第一批只覆盖最影响工作流分流的核心 skills：

1. `brainstorming`
2. `writing-plans`
3. `executing-plans`
4. `subagent-driven-development`
5. `systematic-debugging`
6. `test-driven-development`
7. `requesting-code-review`
8. `document-management`

这些 skill 具有以下共同特点：

- 高自然语言触发频率
- 边界容易重叠
- 容易因 startup prompt 偏差而被错误吞噬

---

## 6. 触发语料库设计

在仓库内维护一份标准 corpus。每条样本至少包含：

- `id`
- `user_message`
- `expected_skill`
- `secondary_ok_skills`
- `should_trigger`
- `notes`

每个 skill 第一轮至少准备 6 条样本：

1. 强触发样本
2. 弱触发样本
3. 混淆样本

总量控制在 48 条左右，便于手工 review 与快速迭代。

### 6.1 样本来源

样本应同时覆盖：

- 中文真实口语表达
- 偏抽象/英文式需求表达
- 容易与邻近 skill 混淆的表达

### 6.2 高优先级混淆对

第一轮重点观察以下 skill pair：

1. `brainstorming` vs `writing-plans`
2. `executing-plans` vs `subagent-driven-development`
3. `systematic-debugging` vs `test-driven-development`
4. `requesting-code-review` vs 普通“看一眼代码”表达

---

## 7. 评分标准

每条样本运行后，标记为四档：

1. `exact`
   - 触发了期望 skill
2. `acceptable`
   - 没有命中期望 skill，但命中了预先允许的备选 skill
3. `miss`
   - 本应触发，但未触发任何相关 skill
4. `wrong`
   - 触发了明显错误的 skill

可选附加字段：

- `confidence`: `high / medium / low`
- `triggered_skill`
- `host`
- `notes`

---

## 8. 失败原因分类

为了指导后续改动，需要为失败样本追加原因标签。建议使用：

1. `desc_too_broad`
2. `desc_too_narrow`
3. `host_prompt_bias`
4. `tool_name_bias`
5. `overlapping_skills`
6. `process_skill_shadowing`
7. `language_mismatch`
8. `missing_trigger_phrase`

这一步的目标是判断“该改哪一层”，而不是仅仅记录“失败了”。

---

## 9. 宿主上下文版本化

每一次评估 run 必须记录：

- `run_id`
- `skills_commit`
- `claude_startup_profile`
- `codex_startup_profile`
- `model_claude`
- `model_codex`
- `date`

原因是：startup 注入层的一句变化，就可能显著改变触发结果。若不记录上下文版本，后续无法解释回归差异。

---

## 10. 目录与产物设计

建议在仓库中新增一套轻量级测试资产：

```text
tests/skill-trigger/
  corpus.yaml
  README.md
  rubric.md
  claude/
    startup-v1.md
  codex/
    startup-v1.md
  runs/
    baseline-template.yaml
```

其中：

- `corpus.yaml` 保存测试语料
- `README.md` 说明执行方式
- `rubric.md` 说明评分与失败标签
- `claude/` 与 `codex/` 保存宿主注入配置样例
- `runs/` 保存每次评估结果

---

## 11. A/B 迭代策略

本框架明确要求一次只调整一个层级。

### 第 1 轮：Baseline

- 不再改 skill wording
- 不再改 startup 注入
- 只记录当前版本在 Claude/Codex 的触发结果

### 第 2 轮：共享层实验

- 只改共享 `description`
- 不改宿主注入
- 对比 baseline

### 第 3 轮：Claude 宿主层实验

- 回到共享层稳定版本
- 只改 Claude startup profile

### 第 4 轮：Codex 宿主层实验

- 回到共享层稳定版本
- 只改 Codex startup profile

### 第 5 轮：必要时引入宿主专属 trigger notes

只对高价值、分歧大的 skill 做额外增强，不扩大到全量。

---

## 12. 成功标准

第一阶段不要求“所有样本都高分”，而是要求：

1. baseline 可稳定复现
2. Claude/Codex 可对同一语料做可比对测试
3. 每条失败样本都能归入明确原因类别
4. 高混淆 skill pair 的问题能被清晰暴露

达到这个标准后，后续再做 wording 或 startup prompt 调整才有意义。

---

## 13. 设计决策

### 决策 1：先做人可读的评估框架，不先追求全自动

原因：

- 当前的真正瓶颈是没有统一语料与统一判定口径
- 先把标准建立起来，比一开始就写复杂 runner 更重要

### 决策 2：第一轮只覆盖 8 个核心 skills

原因：

- 覆盖主要分流路径即可得到最大收益
- 避免一开始维护过宽 corpus

### 决策 3：评估结果落盘到仓库

原因：

- 方便 review
- 方便对比历史 run
- 方便后续做 PR / release 前回归

### 决策 4：允许 `acceptable` 作为可接受结果

原因：

- 某些表达天然位于两个 skill 的边界上
- 过度追求单一 exact 反而会导致 description 变得过窄

---

## 14. 后续实施范围

基于本设计，第一轮实施应完成：

1. 建立 `tests/skill-trigger/` 目录骨架
2. 编写第一版 `corpus.yaml`
3. 编写评分规则文档
4. 编写 baseline run 模板
5. 编写执行说明

本轮不要求：

1. 自动连接 Claude Code 与 Codex 两端执行
2. 大规模改写所有 `description`
3. 立刻跑出完整评估结果

---

## 15. 结论

当前最重要的不是立刻决定哪种 wording 最优，而是把“技能触发率优化”变成一个可持续、可复盘的工程流程。

通过本设计，Horspowers 将获得一套：

- 可维护的 skill trigger corpus
- 可比较的 Claude/Codex baseline
- 可定位失败原因的评分框架
- 可按层做 A/B 的迭代方法

这会显著降低后续优化 trigger 时的试错成本，并避免“某一边变好、另一边偷偷变坏”的不可见回归。
