# 技能触发评估与 A/B 迭代框架实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-05-11

## 目标

为 Horspowers 建立 Claude Code / Codex 共用的技能触发评估基础设施，包括语料库、评分规则、run 模板和使用说明。

## 架构方案

本轮只新增评估文档与测试资产，不改宿主 hook，不自动运行双宿主评估。先把 `tests/skill-trigger/` 目录、`corpus.yaml`、`rubric.md`、`README.md`、startup profile 示例和 baseline run 模板搭起来，确保后续可以在此基础上迭代 wording 与宿主 startup prompt。

## 技术栈

Markdown 文档、YAML 测试语料、YAML 结果模板、仓库内测试资产组织

---

### Task 1: 建立 skill-trigger 测试目录骨架

**Files:**
- Create: `tests/skill-trigger/README.md`
- Create: `tests/skill-trigger/rubric.md`
- Create: `tests/skill-trigger/claude/startup-v1.md`
- Create: `tests/skill-trigger/codex/startup-v1.md`
- Create: `tests/skill-trigger/runs/baseline-template.yaml`

**Step 1: 先创建目录与空文件结构**

创建：

```text
tests/skill-trigger/
tests/skill-trigger/claude/
tests/skill-trigger/codex/
tests/skill-trigger/runs/
```

并为上述目标文件创建最小骨架内容。

**Step 2: 编写 README 初稿**

`tests/skill-trigger/README.md` 至少说明：

- 这个目录解决什么问题
- 为什么要区分共享层 / Claude startup / Codex startup
- 第一轮只做人可读评估，不做全自动执行
- corpus / rubric / runs 分别是什么

**Step 3: 编写 rubric 初稿**

`tests/skill-trigger/rubric.md` 至少定义：

- `exact / acceptable / miss / wrong`
- `confidence`
- 失败原因标签
- 人工标注建议

**Step 4: 编写 startup profile 示例**

在：

- `tests/skill-trigger/claude/startup-v1.md`
- `tests/skill-trigger/codex/startup-v1.md`

写明本轮 baseline 假定的宿主注入策略，仅做说明，不直接修改运行时。

**Step 5: 提交本任务**

```bash
git add tests/skill-trigger/README.md \
        tests/skill-trigger/rubric.md \
        tests/skill-trigger/claude/startup-v1.md \
        tests/skill-trigger/codex/startup-v1.md \
        tests/skill-trigger/runs/baseline-template.yaml
git commit -m "test: add skill trigger evaluation scaffold"
```

### Task 2: 编写第一版触发语料库

**Files:**
- Create: `tests/skill-trigger/corpus.yaml`
- Reference: `docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md`

**Step 1: 为 8 个核心 skills 列出覆盖范围**

先在 `corpus.yaml` 里按 skill 分组，覆盖：

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

**Step 2: 每个 skill 至少写 6 条样本**

每条样本字段至少包括：

- `id`
- `user_message`
- `expected_skill`
- `secondary_ok_skills`
- `should_trigger`
- `notes`

保证包含：

- 强触发
- 弱触发
- 混淆样本

**Step 3: 明确高混淆 pair**

在样本中重点加入：

- `brainstorming` vs `writing-plans`
- `executing-plans` vs `subagent-driven-development`
- `systematic-debugging` vs `test-driven-development`
- `requesting-code-review` vs 普通 review 表达

**Step 4: 做文本级自检**

人工检查：

- 样本是否既有中文口语，也有偏抽象表达
- 是否存在重复表达但没有新增价值
- 是否存在期望 skill 定义不清的样本

如有模糊样本，补充 `secondary_ok_skills` 或重写 `notes`。

**Step 5: 提交本任务**

```bash
git add tests/skill-trigger/corpus.yaml
git commit -m "test: add baseline skill trigger corpus"
```

### Task 3: 编写 baseline run 模板与记录规范

**Files:**
- Modify: `tests/skill-trigger/runs/baseline-template.yaml`
- Modify: `tests/skill-trigger/README.md`
- Modify: `tests/skill-trigger/rubric.md`

**Step 1: 在 baseline 模板中加入 run 元信息**

至少包括：

- `run_id`
- `date`
- `skills_commit`
- `claude_startup_profile`
- `codex_startup_profile`
- `model_claude`
- `model_codex`

**Step 2: 定义每条结果记录结构**

每条记录建议包含：

- `sample_id`
- `host`
- `triggered_skill`
- `result`
- `confidence`
- `failure_reason`
- `notes`

**Step 3: 在 README 中补充执行流程**

明确第一轮推荐流程：

1. 选定 corpus
2. 固定宿主 startup profile
3. 分别在 Claude / Codex 跑同一批样本
4. 用 rubric 手工标注
5. 汇总 exact / acceptable / miss / wrong

**Step 4: 在 rubric 中补充"什么时候改哪一层"**

加入指导规则，例如：

- 两边都 miss -> 优先看共享 description
- 只有 Claude miss -> 优先看 Claude startup
- 只有 Codex miss -> 优先看 Codex startup
- 两边都错到同一 skill -> 优先看 description 过宽

**Step 5: 提交本任务**

```bash
git add tests/skill-trigger/runs/baseline-template.yaml \
        tests/skill-trigger/README.md \
        tests/skill-trigger/rubric.md
git commit -m "docs: define skill trigger baseline run format"
```

### Task 4: 为后续 A/B 迭代补充操作说明

**Files:**
- Modify: `tests/skill-trigger/README.md`
- Create: `tests/skill-trigger/runs/README.md`

**Step 1: 在 README 中加入分层 A/B 策略**

明确写清：

- 第 1 轮 baseline 不改任何 prompt
- 第 2 轮只改共享 description
- 第 3 轮只改 Claude startup
- 第 4 轮只改 Codex startup
- 不要一轮同时改多层

**Step 2: 为 runs 目录增加使用说明**

`tests/skill-trigger/runs/README.md` 至少说明：

- 一个 run 文件对应一次实验
- 命名方式建议
- 如何保存 baseline / desc-tune / host-tune

**Step 3: 检查文档一致性**

人工检查：

- design 与 plan 的术语一致
- `README.md`、`rubric.md`、`baseline-template.yaml` 中的字段名一致
- 没有出现互相冲突的评分标准

**Step 4: 进行最终自检**

确认以下问题都能从文档中找到答案：

- 测什么
- 怎么记录
- 怎么评分
- 怎么判断该改哪一层

**Step 5: 提交本任务**

```bash
git add tests/skill-trigger/README.md \
        tests/skill-trigger/runs/README.md
git commit -m "docs: add skill trigger ab iteration guidance"
```

### Task 5: 做第 1 轮收尾检查

**Files:**
- Review: `docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md`
- Review: `tests/skill-trigger/*`
- Review: `tests/skill-trigger/runs/*`

**Step 1: 核对设计与实施产物是否一致**

确认 design 中承诺的这些内容都已落地：

- corpus
- rubric
- startup profiles
- baseline run template
- 执行说明

**Step 2: 检查 corpus 是否覆盖 8 个核心 skills**

人工核对每个 skill 至少有 6 条样本，且包含混淆样本。

**Step 3: 检查模板是否可直接复制使用**

确认 baseline 模板没有占位字段冲突，README 中的引用路径全部存在。

**Step 4: 整理第 1 轮后续建议**

在最终说明中给出下一步推荐：

1. 先跑 baseline
2. 再选 1 组高混淆 pair 做 description 微调
3. 最后再看宿主 startup 调整

**Step 5: 提交本任务**

```bash
git add docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md \
        docs/plans/2026-05-11-skill-trigger-evaluation-framework-implementation.md \
        tests/skill-trigger
git commit -m "docs: plan skill trigger evaluation framework rollout"
```
