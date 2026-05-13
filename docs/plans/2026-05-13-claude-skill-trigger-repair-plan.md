# Claude Skill Trigger Repair Plan

> **Execution note:** After this plan is approved, use `horspowers:executing-plans` or `horspowers:subagent-driven-development` to implement it task-by-task in the current host.

**日期**: 2026-05-13

## 目标

修复 Claude Code 侧仍然有问题的 skill-trigger case，优先提升 `wrong` / `miss` 的可修复项，同时把 host/state 污染的执行型技能隔离出来，避免重复试错。

## 架构方案

采用分层修复而不是一次性大改。先修共享 description 和 Claude startup routing，再单独隔离执行型技能的 host/state 问题，最后做 Codex 回归防回退验证。这样可以保证每一层的改动都能被单独测量和回滚。

## 技术栈

Markdown, YAML, Ruby, Claude CLI, Codex CLI, existing `tests/skill-trigger` harness

---

## 当前结论

基于 Round 1 baseline 和 reduced corpus，Claude 侧的问题已经可以分成三类：

- `writing-plans`、`systematic-debugging`、`requesting-code-review`、`document-management`
  - 主要是路由边界还不够稳
  - 共享 description 强化已经有正向效果，但还需要更明确的边界和 startup 引导
- `test-driven-development`
  - 已经能命中，但 reduced corpus 里仍然不稳定
  - 需要继续调共享 description 和 startup 边界
- `executing-plans`、`subagent-driven-development`
  - 主要是 host/state 污染，不应继续放在共享实验里反复跑
  - 需要独立 fixture 和 regression lane
  - clean fixture 早期结果表明，即使去掉主仓库计划状态，这两类 prompt 仍会出现空 stdout，因此还叠加了 host/runtime anomaly

补充观测：

- 现有 `run_queue_batch.rb` 不会显式把 `tests/skill-trigger/claude/startup-v1.md` 注入 Claude CLI，所以它更适合测共享 `SKILL.md` 层，不适合单独评估 startup profile
- 显式 startup 注入后，`tdd_weak_002` 能在正式 harness 中恢复为明确 skill-style 开场；`systematic_debugging_confusion_002` 只在 ad hoc runner 中恢复，正式 harness 串行重跑仍 timeout
- `tdd_confusion_002` 只在 ad hoc runner 中出现短 TDD 风格响应，正式 harness 串行重跑仍 timeout
- `code_review_weak_002` 仍可能无 stdout/stderr 挂起，当前优先视为 host/runtime anomaly
- 在修正后的正式 harness 中，`code_review_weak_002` 已复现为 `startup_profile_loaded: true` 但依旧 `exit_code 143` + 空 stdout/stderr，因此可确认为 runtime anomaly
- `document_management_confusion_002` 在正式 harness 与 ad hoc runner 中都稳定空超时，可视为当前已确认的 runtime anomaly
- 评测 harness 已修正为真实注入 `startup_profile`；后续所有 startup 层结论必须以修正后的 runner 为准

## 修复原则

- 一次只改一层
- 每次改动后只跑对应层的最小验证集
- 任何无法稳定复现的 case，先标记为隔离项，不在共享实验里继续消耗时间
- Codex 必须作为回归控制组保留

---

### Task 1: Stabilize the shared description layer

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/document-management/SKILL.md`
- Review: `skills/brainstorming/SKILL.md`

**Goal:**

把共享 description 调到更强的 routing signal，同时补齐边界句，避免技能互相吞并。

**Step 1: Tighten trigger language**

For each target skill:

- start the description with `You MUST use this when...`
- include 2-3 concrete trigger phrasings
- include 1 explicit negative boundary

**Step 2: Keep the skill body unchanged**

Do not touch:

- execution body
- examples
- implementation flow

Only update frontmatter description unless a boundary sentence absolutely needs body context.

**Step 3: Validate boundary distinctions**

Required distinctions:

- `brainstorming` vs `writing-plans`
- `writing-plans` vs `executing-plans`
- `systematic-debugging` vs `test-driven-development`
- `requesting-code-review` vs generic implementation help
- `document-management` vs generic repository exploration

**Step 4: Verify markdown syntax**

Run:

```bash
for f in \
  skills/writing-plans/SKILL.md \
  skills/systematic-debugging/SKILL.md \
  skills/test-driven-development/SKILL.md \
  skills/requesting-code-review/SKILL.md \
  skills/document-management/SKILL.md
do
  test -f "$f" || exit 1
done
echo "files-ok"
```

Expected: `files-ok`

**Step 5: Commit**

```bash
git add skills/writing-plans/SKILL.md skills/systematic-debugging/SKILL.md skills/test-driven-development/SKILL.md skills/requesting-code-review/SKILL.md skills/document-management/SKILL.md
git commit -m "fix: strengthen shared claude routing descriptions"
```

### Task 2: Add Claude-only startup routing guidance

**Files:**
- Modify: `tests/skill-trigger/claude/startup-v1.md`
- Review: `docs/plans/2026-05-12-design-claude-skill-trigger-optimization.md`

**Goal:**

让 Claude 在 shared description 之外，明确把 workflow skills 当成 routing decisions，而不是泛化行为。

**Step 1: Add a short mandatory-routing paragraph**

Required additions:

- workflow skills are routing decisions, not optional style suggestions
- Claude should invoke the narrowest matching workflow
- Claude should not flatten workflow requests into generic assistance

**Step 2: Tighten the adjacent boundaries**

Specifically sharpen:

- `brainstorming` vs `writing-plans`
- `writing-plans` vs `executing-plans`
- `executing-plans` vs `subagent-driven-development`
- `systematic-debugging` vs `test-driven-development`

**Step 3: Keep the guidance short**

Do not add corpus-specific examples.
Do not add implementation examples.

**Step 4: Validate markdown**

Run:

```bash
sed -n '1,220p' tests/skill-trigger/claude/startup-v1.md
```

Expected: no malformed markdown and no corpus leakage.

**Step 5: Commit**

```bash
git add tests/skill-trigger/claude/startup-v1.md
git commit -m "fix: tighten claude startup routing guidance"
```

### Task 3: Run a focused Claude verification corpus

**Files:**
- Review: `tests/skill-trigger/corpus.yaml`
- Review: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`

**Goal:**

验证 Task 1 + Task 2 是否减少 Claude 的 `wrong` / `miss`，并确认 `TDD` 是否仍然是唯一不稳定的共享技能。

**Step 1: Select a reduced verification set**

Use only:

- `writing-plans` weak/confusion
- `systematic-debugging` weak/confusion
- `test-driven-development` weak/confusion
- `requesting-code-review` weak/confusion
- `document-management` weak/confusion

Exclude:

- `executing-plans`
- `subagent-driven-development`

**Step 2: Run Claude-only batches**

Run:

```bash
SKILL_TRIGGER_HOSTS=claude \
SKILL_TRIGGER_BATCH_SIZE=2 \
SKILL_TRIGGER_BATCH_LOOPS=5 \
SKILL_TRIGGER_TIMEOUT=120 \
ruby tests/skill-trigger/run_queue_batch.rb
```

**Step 3: Classify results**

Record for each case:

- `exact`
- `acceptable`
- `wrong`
- `miss`
- `timed_out` / empty stdout

**Step 4: Decide next layer**

If shared description + startup changes improve routing on the four non-TDD skills but `TDD` remains unstable, then:

- keep `TDD` for a separate wording/startup pass
- do not expand scope into execution skills yet

**Step 5: Commit**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: record claude verification corpus after routing fixes"
```

### Task 4: Split execution-oriented skills into a separate regression lane

**Files:**
- Create: `tests/skill-trigger/fixtures/execution-lane/README.md`
- Create: `tests/skill-trigger/fixtures/execution-lane/docs/plans/`
- Create: `tests/skill-trigger/fixtures/execution-lane/.horspowers-config.yaml`
- Create: `tests/skill-trigger/corpus-execution-lane.yaml`
- Create: `tests/skill-trigger/scripts/run_execution_lane.sh`
- Modify: `tests/skill-trigger/run_queue_batch.rb` if needed

**Goal:**

把 `executing-plans` 和 `subagent-driven-development` 从共享实验中剥离，避免 repo state 污染继续干扰结论。

**Status (2026-05-13, early signal):**

- fixture 和专用 corpus 已创建
- clean fixture 下的早期 Claude 运行仍出现 execution-oriented samples empty stdout
- 结论更新为：execution lane 不是立即修复问题，而是用来证明问题不只来自主仓库 state

**Step 1: Build a clean fixture**

The fixture must contain:

- one unfinished plan
- one pending execution step
- no completed implementation history
- minimal docs state only if required

**Step 2: Create a dedicated corpus**

Use:

- 2 explicit `executing-plans`
- 2 natural-language `executing-plans`
- 2 explicit `subagent-driven-development`
- 2 natural-language `subagent-driven-development`
- 2 control prompts from stable skills

**Step 3: Add a dedicated runner**

`run_execution_lane.sh` should:

- cd into the fixture
- point the queue runner at `corpus-execution-lane.yaml`
- run Claude-only first
- store artifacts separately from the main baseline

**Step 4: Verify the lane**

Run:

```bash
bash tests/skill-trigger/scripts/run_execution_lane.sh
```

Expected:

- non-empty artifact directory
- summary JSON written
- control prompts still respond

**Step 5: Commit**

```bash
git add tests/skill-trigger/fixtures/execution-lane tests/skill-trigger/corpus-execution-lane.yaml tests/skill-trigger/scripts/run_execution_lane.sh tests/skill-trigger/run_queue_batch.rb
git commit -m "fix: add isolated execution lane for claude regression"
```

### Task 5: Verify Codex stays stable

**Files:**
- Review: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`
- Review: `tests/skill-trigger/corpus.yaml`

**Goal:**

确认 shared description 和 Claude startup 的调整没有把 Codex 从 exact 拉低到 acceptable / miss。

**Step 1: Select Codex control prompts**

Minimum control set:

- one strong and one weak prompt for `writing-plans`
- one strong and one weak prompt for `systematic-debugging`
- one strong and one weak prompt for `test-driven-development`
- one prompt each for `requesting-code-review` and `document-management`

**Step 2: Run Codex-only verification**

Run:

```bash
SKILL_TRIGGER_HOSTS=codex \
SKILL_TRIGGER_BATCH_SIZE=2 \
SKILL_TRIGGER_BATCH_LOOPS=4 \
SKILL_TRIGGER_TIMEOUT=120 \
ruby tests/skill-trigger/run_queue_batch.rb
```

**Step 3: Compare side effects**

Look for:

- reduced trigger rate
- generic answers
- adjacent-skill drift

If Codex regresses, revert only the over-aggressive description edits.

**Step 4: Commit**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: verify codex after claude routing fixes"
```

## 验收标准

- Claude 的可修复 `wrong` / `miss` case 有明确归类和修复动作
- `TDD` 被单独识别为仍需追加修复的技能，不与其它 routing case 混在一起
- `executing-plans` / `subagent-driven-development` 被隔离到独立 regression lane
- Codex control set 不出现明显回退
