# Claude Skill Trigger Optimization Implementation Plan

> **Execution note:** After this plan is approved, use `horspowers:executing-plans` or `horspowers:subagent-driven-development` to implement it task-by-task in the current host.

**日期**: 2026-05-12

## 目标

在不回退 Codex 触发效果的前提下，提升 Claude Code 对核心 workflow skills 的触发准确率，并把 `executing-plans` / `subagent-driven-development` 从当前混杂基线中拆分成独立回归通道。

## 架构方案

先冻结当前 Claude Round 1 结果，把高噪声执行型技能从共享实验中隔离。然后分两轮做最小改动实验：第一轮只加强共享 skill 描述，第二轮在必要时再增强 Claude 专属 startup profile。最后为执行型技能建立干净 fixture 和单独回归脚本，避免真实仓库状态污染结论。

## 技术栈

Ruby, YAML, Markdown, Claude CLI, Codex CLI, existing `tests/skill-trigger` harness

---

## 当前状态（2026-05-13）

- Task 1 已完成：Claude Round 1 baseline 已回填为 48 / 48
- Task 2 已完成：5 个共享 workflow skills 的 description 已强化
- Task 3 已完成一轮 reduced corpus 验证：10 条样本中 9 条已稳定落盘，1 条 `document-management` confusion 样本在单条补跑中仍表现为 host stall
- 当前 Claude Round 1 结果：
  - `exact`: 21
  - `acceptable`: 3
  - `wrong`: 3
  - `miss`: 21
- `executing-plans` 与 `subagent-driven-development` 已确认进入 anomaly lane
- 后续重点是共享描述实验与执行型技能独立 regression lane，而不是继续重跑已分类 case

---

### Task 1: Freeze current baseline and normalize evidence

**Files:**
- Modify: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`
- Review: `docs/plans/2026-05-12-claude-skill-trigger-analysis.md`
- Review: `tests/skill-trigger/runs/artifacts/2026-05-11-queue-batches/`
- Review: `/tmp/claude-final-sweep/`

**Step 1: Recount the current Claude baseline**

Run:

```bash
ruby -e '
require "psych"
path = "tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml"
data = Psych.safe_load_file(path, permitted_classes: [Date], aliases: true)
counts = Hash.new(0)
remaining = []
data["results"].each do |row|
  claude = row["claude"] || {}
  note = claude["notes"].to_s
  if note.include?("Fill with observed")
    remaining << row["prompt_id"]
  else
    counts[claude["outcome"]] += 1
  end
end
puts counts.sort.to_h
puts "remaining=#{remaining.size}"
puts remaining
'
```

Expected: exact current counts plus explicit remaining placeholder ids.

**Step 2: Fill any low-cost remaining cases from existing artifacts**

Only fill cases when an existing artifact has enough evidence to classify:

- non-empty stdout
- clear primary workflow
- no need to rerun CLI

Good candidates:

- `systematic_debugging_confusion_002`
- `code_review_*`
- `document_management_confusion_002`

**Step 3: Mark anomaly groups explicitly in notes**

For all remaining `executing_plans_*` and `subagent_dev_*` placeholders, keep the placeholder if evidence is still inconclusive, but add or preserve notes that clearly state:

- timed out / empty stdout
- treated as deferred anomaly group
- excluded from shared wording experiment

**Step 4: Run a syntax check on the baseline YAML**

Run:

```bash
ruby -e 'require "psych"; Psych.safe_load_file("tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml", permitted_classes: [Date], aliases: true); puts "yaml-ok"'
```

Expected: `yaml-ok`

**Step 5: Commit**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml docs/plans/2026-05-12-claude-skill-trigger-analysis.md
git commit -m "docs: freeze claude round 1 baseline"
```

**Status (2026-05-13): Completed**

- 已利用 queue artifacts、诊断输出和 targeted reruns 完成全部 48 条 Claude baseline 分类
- `executing_plans_*` 与 `subagent_dev_*` 以 repeated timeout / state-collision anomaly 收口
- `tdd_weak_002` 与 `tdd_confusion_002` 已依据现有 stdout 回填为 TDD exact

### Task 2: Strengthen shared skill descriptions for routing

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/document-management/SKILL.md`
- Review: `skills/brainstorming/SKILL.md`
- Review: `skills/executing-plans/SKILL.md`
- Review: `skills/subagent-driven-development/SKILL.md`

**Step 1: Write the failing expectation as a checklist in the doc header comments**

Before editing wording, record the target behavior in a local checklist:

- description begins with `You MUST use this when...`
- contains 2-3 concrete trigger examples
- contains 1 explicit non-trigger boundary
- distinguishes adjacent workflow skill

This is a documentation-level failing spec, not a code test.

**Step 2: Edit one skill at a time with minimal wording-only changes**

Required pattern for each target skill:

- replace soft `Use when...` description with imperative wording
- add one positive trigger sentence
- add one negative boundary sentence

Do not change:

- execution body
- examples
- implementation workflow

unless wording is required for consistency.

**Step 3: Keep `brainstorming` as the control reference**

Use `skills/brainstorming/SKILL.md` only as a style reference for trigger strength. Do not modify it in this phase.

**Step 4: Review each edited skill for boundary conflicts**

Manual review checklist:

- `writing-plans` does not absorb brainstorming
- `systematic-debugging` does not absorb TDD
- `requesting-code-review` stays review-only, not implementation
- `document-management` does not absorb generic repository search

**Step 5: Validate markdown files**

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

**Step 6: Commit**

```bash
git add skills/writing-plans/SKILL.md skills/systematic-debugging/SKILL.md skills/test-driven-development/SKILL.md skills/requesting-code-review/SKILL.md skills/document-management/SKILL.md
git commit -m "docs: strengthen shared skill trigger wording"
```

**Status (2026-05-13): Completed**

- 已修改：
  - `skills/writing-plans/SKILL.md`
  - `skills/systematic-debugging/SKILL.md`
  - `skills/test-driven-development/SKILL.md`
  - `skills/requesting-code-review/SKILL.md`
  - `skills/document-management/SKILL.md`
- 仅调整 frontmatter description，不改技能主体流程

### Task 3 progress note (2026-05-13)

- Reduced corpus 已完成 9 条稳定落盘，剩余 1 条 `document-management_confusion_002` 的单条补跑仍卡住
- 现有可读结果显示：
  - `writing-plans` / `systematic-debugging` / `requesting-code-review` / `document-management` 的 weak 样本表现出明确的 skill-style 开场
  - `test-driven-development` 仍然不稳定，2 条样本均为 timeout
- 结论：shared description strengthening 对前四个技能有正向作用，但对 TDD 和 confusion prompt 仍不足

### Task 3 progress note (startup-strengthening rerun)

- 在 `tests/skill-trigger/claude/startup-v1.md` 添加 mandatory-routing 段落后，`writing_plans_confusion_001` 从 timeout 改善为可读规划响应
- `systematic_debugging_confusion_002`、`tdd_weak_002`、`tdd_confusion_002`、`document_management_confusion_002` 仍然 timeout / empty stdout
- `requesting-code-review` 在 batch 与 single-case rerun 之间仍然表现不稳定
- 当前判断：
  - `writing-plans` 的 startup 修复有效
  - `systematic-debugging` confusion、`TDD`、`document-management` confusion 还没有被当前层修复
  - 下一步应转入 execution-lane 隔离，并把 `TDD` 作为独立共享技能问题继续处理

### Task 3 progress note (startup-injected single verification)

- 新增 `tests/skill-trigger/scripts/run_claude_startup_single.rb`，用于把 `tests/skill-trigger/claude/startup-v1.md` 显式注入 Claude CLI，再跑单条 case
- 直接 startup 注入后：
  - `systematic_debugging_confusion_002` 在 ad hoc single runner 中从 timeout 变为 `exit_code 0`，并出现明确的 `systematic-debugging` 开场
  - `tdd_weak_002` 从 timeout 变为 `exit_code 0`，并出现明确的 `test-driven-development` 开场
  - `tdd_confusion_002` 也能在 ad hoc single runner 中返回简短的 TDD 风格响应
- `code_review_weak_002` 在两种 startup 注入方式下都可能挂起且不写 stdout/stderr，当前更像 Claude CLI host/runtime anomaly，而不是纯路由失配
- 在修正后的正式 queue runner 中，`code_review_weak_002` 仍然是 `startup_profile_loaded: true`、`timeout=true`、`exit_code 143`、`stdout_bytes=0`、`stderr_bytes=0`
- 更新判断：
  - startup 层对 `TDD` 的修复是有效的，但原队列脚本没有真实注入 startup profile，放大了 timeout 观测
  - `systematic_debugging_confusion_002` 在正式 queue runner 下仍然 timeout，说明 ad hoc runner 与正式 harness 之间还存在未解释差异
  - `tdd_confusion_002` 也存在同类 runner 差异：ad hoc runner 可出短响应，但正式 runner 串行仍 timeout
  - `requesting-code-review` 的至少一个 weak 样本已经可以升级为 confirmed runtime anomaly

### Task 3 progress note (harness correction)

- 已修复 `tests/skill-trigger/run_queue_batch.rb`、`tests/skill-trigger/run_full_baseline.rb` 与 `tests/skill-trigger/scripts/run_execution_lane.sh`
- 修复内容：
  - Claude 调用现在会真实加载 `startup_profile` 并通过 `--append-system-prompt` 注入
  - Codex 调用现在会把 startup profile 拼接到初始 prompt，保证 host 侧 guidance 真正参与评测
  - batch runner 新增 `SKILL_TRIGGER_RERUN_COMPLETED=true`，便于在不改 baseline YAML 的前提下重跑已分类 case
- 当前判断：
  - 之前所有 startup-only 结论都需要视为 provisional evidence
  - 后续应基于修正后的 harness 重新跑最小 corpus，再更新 baseline YAML 的最终分类
  - 对 Claude 进行人工并行压测会放大 runtime 噪声；正式结论应优先采用串行单例复跑

### Task 3 progress note (route-only recovery closeout)

- 在以下层同时收紧之后，Claude route-only lane 已达到可用状态：
  - 共享 workflow skill 的 first-response rules
  - `tests/skill-trigger/claude/startup-v1.md` 中更硬的 route-only/evaluation 约束
  - `executing-plans` / `subagent-driven-development` 的 execution-lane 边界强化
  - official runner 中的过滤式 skills 目录注入
- 官方 queue runner route-only 回归已覆盖此前主要的 Claude `wrong` / `miss` 样本，并在单 case 或小批次重跑下恢复为可读的技能首响
- `subagent_dev_strong_002` 是最后一个被收口的 execution-lane confusion 样本；它需要把“子任务自查后继续下一个”明确写入 subagent 路由边界
- 建议结论更新为：
  - Claude 的 route-only 技能触发已经可用
  - 后续是否继续优化，应更多依赖人工真实体验，而不是继续在这批 route-only case 上做机械重跑

### Task 3: Run the shared-description Claude experiment

**Files:**
- Modify: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`
- Review: `tests/skill-trigger/corpus.yaml`
- Review: `tests/skill-trigger/run_queue_batch.rb`
- Review: `tests/skill-trigger/claude/startup-v1.md`

**Step 1: Select a reduced corpus**

Use only weak + confusion prompts for the five target skills:

- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

Exclude:

- `executing-plans`
- `subagent-driven-development`

Use the frozen Round 1 baseline as the source of truth for completed ids. Do not
rerun any case already classified in `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`.

**Step 2: Run Claude-only batches**

Run:

```bash
SKILL_TRIGGER_HOSTS=claude \
SKILL_TRIGGER_BATCH_SIZE=2 \
SKILL_TRIGGER_BATCH_LOOPS=5 \
SKILL_TRIGGER_TIMEOUT=120 \
ruby tests/skill-trigger/run_queue_batch.rb
```

Expected: 10 Claude cases attempted with new artifacts under `tests/skill-trigger/runs/artifacts/2026-05-11-queue-batches/`.

**Step 3: Classify results immediately after each batch set**

For each finished case, record:

- exact
- acceptable
- wrong
- miss
- timed_out / empty stdout

Also note whether the opening sentence now clearly reflects the intended skill.

**Step 4: Compare against frozen Round 1 controls**

Success criteria:

- weak/confusion prompts improve by at least 20 percent in `exact + acceptable`
- no new regression in already stable prompt families
- no increase in silent timeout rate for non-execution skills

**Step 5: Commit**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: record claude shared-description experiment"
```

### Task 4: Add Claude-only startup strengthening if Phase 1 is insufficient

**Files:**
- Modify: `tests/skill-trigger/claude/startup-v1.md`
- Review: `docs/plans/2026-05-12-design-claude-skill-trigger-optimization.md`

**Step 1: Define the gate before editing**

Only proceed if Task 3 shows:

- partial improvement, but still frequent wrong-route cases
- stable runtime for non-execution skills
- evidence that description strengthening alone is not enough

If Task 3 fails because of host instability rather than routing drift, skip this task.

**Step 2: Add one short mandatory-routing paragraph**

Required additions:

- workflow skills are routing decisions, not optional stylistic hints
- Claude should invoke the narrowest matching workflow
- Claude should not flatten workflow requests into generic assistance

Keep startup guidance short. Do not add corpus-specific examples.

**Step 3: Tighten boundary lines for adjacent skills**

Specifically sharpen:

- `brainstorming` vs `writing-plans`
- `writing-plans` vs `executing-plans`
- `executing-plans` vs `subagent-driven-development`

**Step 4: Rerun the same reduced corpus**

Run the same command from Task 3 so the comparison is controlled.

**Step 5: Commit**

```bash
git add tests/skill-trigger/claude/startup-v1.md tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: tune claude startup routing guidance"
```

### Task 5: Build an isolated regression lane for execution-oriented skills

**Files:**
- Create: `tests/skill-trigger/fixtures/execution-lane/README.md`
- Create: `tests/skill-trigger/fixtures/execution-lane/docs/plans/`
- Create: `tests/skill-trigger/fixtures/execution-lane/.horspowers-config.yaml`
- Modify: `tests/skill-trigger/run_queue_batch.rb`
- Create: `tests/skill-trigger/scripts/run_execution_lane.sh`
- Create: `tests/skill-trigger/corpus-execution-lane.yaml`

**Step 1: Write the failing fixture expectation**

The fixture must provide:

- one unfinished plan
- one clearly pending execution step
- no completed implementation history that can confuse the host
- optional minimal active-doc state only if the skill requires it

**Step 2: Create the minimal fixture repo state**

Inside `tests/skill-trigger/fixtures/execution-lane/`, add:

- a short plan doc with unchecked tasks
- a minimal config enabling any required docs integration
- no unrelated source tree noise

**Step 3: Add a dedicated execution corpus**

Cases:

- 2 explicit `executing-plans`
- 2 natural-language `executing-plans`
- 2 explicit `subagent-driven-development`
- 2 natural-language `subagent-driven-development`
- 2 control prompts from stable skills

**Step 4: Add a dedicated runner wrapper**

`tests/skill-trigger/scripts/run_execution_lane.sh` should:

- cd into the fixture
- point the queue runner at `corpus-execution-lane.yaml`
- run Claude-only first
- store artifacts separately from the main baseline

If code changes are needed in `run_queue_batch.rb`, keep them generic and backward-compatible.

**Step 5: Verify the lane runs**

Run:

```bash
bash tests/skill-trigger/scripts/run_execution_lane.sh
```

Expected:

- non-empty artifact directory
- summary JSON written
- control prompts still respond

**Step 6: Commit**

```bash
git add tests/skill-trigger/fixtures/execution-lane tests/skill-trigger/corpus-execution-lane.yaml tests/skill-trigger/scripts/run_execution_lane.sh tests/skill-trigger/run_queue_batch.rb
git commit -m "test: add execution-lane claude regression fixture"
```

### Task 6: Evaluate Codex regression after Claude-focused changes

**Files:**
- Review: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`
- Review: `tests/skill-trigger/corpus.yaml`

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

Expected: no obvious drop in exact/acceptable outcomes on the control set.

**Step 3: Compare wording side effects**

Look for:

- reduced trigger rate
- more generic answers
- adjacent-skill drift introduced by stronger wording

If Codex regresses, revert only the over-aggressive descriptions and keep Claude-only startup tuning as the preferred lever.

**Step 4: Commit**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: verify codex control set after claude tuning"
```

### Task 7: Publish final analysis and rollout recommendation

**Files:**
- Modify: `docs/plans/2026-05-12-claude-skill-trigger-analysis.md`
- Modify: `docs/plans/2026-05-12-design-claude-skill-trigger-optimization.md`
- Modify: `docs/plans/2026-05-12-claude-skill-trigger-optimization-implementation.md`

**Step 1: Update outcome tables**

Summarize:

- frozen Round 1 baseline
- shared-description experiment
- Claude-startup experiment if run
- execution-lane regression results
- Codex control verification

**Step 2: Make a release decision**

Choose one:

- ship shared description changes
- ship Claude-only startup changes
- ship both
- ship neither and keep changes experimental

The decision must name the exact files to keep or revert.

**Step 3: Record unresolved risks**

Include:

- host timeout behavior still not fully explained
- execution-oriented skills still state-sensitive
- baseline corpus may need cleaner separation between routing and runtime failures

**Step 4: Final verification**

Run:

```bash
git diff --check
```

Expected: no whitespace or patch-format issues.

**Step 5: Commit**

```bash
git add docs/plans/2026-05-12-claude-skill-trigger-analysis.md docs/plans/2026-05-12-design-claude-skill-trigger-optimization.md docs/plans/2026-05-12-claude-skill-trigger-optimization-implementation.md
git commit -m "docs: publish claude skill trigger optimization plan"
```

## 验收标准

- 有一份明确的实施计划文档，覆盖共享描述实验、Claude 专属 startup 实验、执行型技能独立回归通道、Codex 回归验证。
- 每个任务都包含精确文件路径、执行命令、预期结果、提交点。
- 计划显式把 `executing-plans` 和 `subagent-driven-development` 作为独立问题域处理，而不是混入共享 prompt 调优。
- 计划允许先做低风险实验，再做 host-specific 调整，最后再决定保留哪些改动。

## 备注

- 本计划默认继续在 worktree `codex/skill-compat-review` 内执行。
- 在真正执行前，应先确认当前工作区中的未跟踪目录 `skills/skills`、`tests/unit/`、`.docs-metadata/` 是否属于本任务；若无关，执行时保持不触碰。
