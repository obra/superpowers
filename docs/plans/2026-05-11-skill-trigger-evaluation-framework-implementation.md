# 技能触发评估与 A/B 迭代框架 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-05-11

## 目标

将设计文档 `docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md` 中定义的第一轮交付物全部落地：目录骨架、语料库、评分规则、baseline 模板、执行说明，并确保产物之间字段名与术语一致、可直接复制使用。

## 架构方案

本轮只新增评估文档与测试资产，不改宿主 hook，不自动运行双宿主评估。先把 `tests/skill-trigger/` 目录、`corpus.yaml`、`rubric.md`、`README.md`、startup profile 示例和 baseline run 模板搭起来，确保后续可以在此基础上迭代 wording 与宿主 startup prompt。

## 技术栈

Markdown 文档、YAML 测试语料、YAML 结果模板、仓库内测试资产组织

## 当前状态

以下文件已在工作树中存在但尚未提交：

- `tests/skill-trigger/README.md` ✅ 已写
- `tests/skill-trigger/rubric.md` ✅ 已写
- `tests/skill-trigger/corpus.yaml` ✅ 已写（48 条样本）
- `tests/skill-trigger/claude/startup-v1.md` ✅ 已写
- `tests/skill-trigger/codex/startup-v1.md` ✅ 已写
- `tests/skill-trigger/runs/baseline-template.yaml` ✅ 已写
- `tests/skill-trigger/runs/README.md` ✅ 已写
- `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml` ✅ 部分填写（4/48 有观测结果）
- `tests/skill-trigger/run_full_baseline.rb` ⚠️ 存在但未跟踪
- `tests/skill-trigger/run_queue_batch.rb` ⚠️ 存在但未跟踪
- `tests/skill-trigger/runs/artifacts/` ⚠️ 存在但未跟踪

---

### Task 1: 提交评估框架核心资产

**Files:**
- Verify: `tests/skill-trigger/README.md`
- Verify: `tests/skill-trigger/rubric.md`
- Verify: `tests/skill-trigger/corpus.yaml`
- Verify: `tests/skill-trigger/claude/startup-v1.md`
- Verify: `tests/skill-trigger/codex/startup-v1.md`
- Verify: `tests/skill-trigger/runs/baseline-template.yaml`
- Verify: `tests/skill-trigger/runs/README.md`

**Step 1: 验证 corpus.yaml 中 8 个 skills 各有 6 条样本**

运行：

```bash
cd /Users/zego/Zego/horspowers/.worktrees/codex-skill-compat
ruby -ryaml -e '
  corpus = YAML.load_file("tests/skill-trigger/corpus.yaml")
  skills = %w[brainstorming writing-plans executing-plans subagent-driven-development systematic-debugging test-driven-development requesting-code-review document-management]
  skills.each do |sk|
    samples = corpus.select { |s| s["expected_skill"] == sk }
    strong = samples.count { |s| s["id"].include?("strong") }
    weak   = samples.count { |s| s["id"].include?("weak") }
    conf   = samples.count { |s| s["id"].include?("confusion") }
    puts "#{sk}: #{samples.size} total (strong=#{strong} weak=#{weak} confusion=#{conf})"
  end
  puts "Total samples: #{corpus.size}"
'
```

Expected: 每行显示 `6 total (strong=2 weak=2 confusion=2)`，总计 48

**Step 2: 验证 rubric 标签与 baseline-template 字段名一致**

人工核对：

- rubric 定义的 primary labels: `exact`, `acceptable`, `miss`, `wrong`, `no-trigger-expected`
- baseline-template.yaml 中 `outcome` 字段是否使用了相同标签
- rubric 定义的 failure reason tags 与 baseline-template 的 `reason_tags` 字段是否一致

Expected: 术语完全一致

**Step 3: 验证 README 引用路径全部存在**

运行：

```bash
cd /Users/zego/Zego/horspowers/.worktrees/codex-skill-compat
for f in corpus.yaml rubric.md claude/startup-v1.md codex/startup-v1.md runs/baseline-template.yaml runs/README.md; do
  test -f "tests/skill-trigger/$f" && echo "OK: $f" || echo "MISSING: $f"
done
```

Expected: 全部显示 `OK`

**Step 4: 提交核心资产**

```bash
git add tests/skill-trigger/README.md \
        tests/skill-trigger/rubric.md \
        tests/skill-trigger/corpus.yaml \
        tests/skill-trigger/claude/startup-v1.md \
        tests/skill-trigger/codex/startup-v1.md \
        tests/skill-trigger/runs/baseline-template.yaml \
        tests/skill-trigger/runs/README.md
git commit -m "test: add skill trigger evaluation scaffold

Corpus: 48 samples covering 8 core skills (2 strong + 2 weak + 2 confusion each)
Rubric: 5 primary labels, 9 failure reason tags
Startup profiles: claude/startup-v1.md, codex/startup-v1.md
Run template: runs/baseline-template.yaml with dual-host result structure"
```

---

### Task 2: 提交部分 baseline 观测记录

**Files:**
- Verify: `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`

**Step 1: 验证 baseline-v1 中已观测样本的完整性**

已观测的 4 条样本（brainstorming_strong_001, writing_plans_strong_001, systematic_debugging_strong_001, code_review_strong_001）的 claude 和 codex 字段不应包含 `"Fill with observed"` 占位文本。

运行：

```bash
cd /Users/zego/Zego/horspowers/.worktrees/codex-skill-compat
grep -c "Fill with observed" tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
```

Expected: 44（48 条中 4 条已观测 × 2 host = 8 个非占位，48×2 - 8 = 88 行... 实际应数为占位行数）

运行更精确的检查：

```bash
ruby -ryaml -e '
  data = YAML.load_file("tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml")
  filled = 0
  placeholder = 0
  data["results"].each do |r|
    %w[claude codex].each do |host|
      if r[host]["notes"].to_s.include?("Fill with observed")
        placeholder += 1
      else
        filled += 1
      end
    end
  end
  puts "Filled: #{filled}, Placeholder: #{placeholder}"
'
```

Expected: `Filled: 8, Placeholder: 88`

**Step 2: 确认 run 元信息正确**

检查 `skills.commit` 是否为当前分支的 commit：

```bash
git log --oneline -1
```

Expected: commit hash 与 baseline-v1.yaml 中的 `skills.commit: 17f239d` 一致（如果当前 HEAD 不同，更新该字段）

**Step 3: 提交部分 baseline**

```bash
git add tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml
git commit -m "test: add partial baseline skill-trigger evaluation (4/48 observed)

4 exact results: brainstorming_strong_001, writing_plans_strong_001,
systematic_debugging_strong_001, code_review_strong_001
Remaining 44 samples are placeholders for future runs."
```

---

### Task 3: 清理并提交自动化运行脚本

**Files:**
- Modify: `tests/skill-trigger/run_full_baseline.rb`
- Modify: `tests/skill-trigger/run_queue_batch.rb`

**Step 1: 检查 run_full_baseline.rb 中的硬编码路径**

运行：

```bash
grep -n '/Users/' tests/skill-trigger/run_full_baseline.rb
```

Expected: 发现 CLAUDE_BIN 和 CODEX_BIN 的硬编码默认值

**Step 2: 将硬编码路径改为环境变量驱动（保留默认值注释）**

在 `run_full_baseline.rb` 中，将：

```ruby
CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "/Users/zego/.local/bin/claude")
CODEX_BIN = ENV.fetch("CODEX_BIN", "/Users/zego/.nvm/versions/node/v24.13.0/bin/codex")
```

改为：

```ruby
CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
CODEX_BIN = ENV.fetch("CODEX_BIN", "codex")
```

对 `run_queue_batch.rb` 做同样修改。

**Step 3: 验证 Ruby 脚本可加载**

运行：

```bash
cd /Users/zego/Zego/horspowers/.worktrees/codex-skill-compat
ruby -c tests/skill-trigger/run_full_baseline.rb
ruby -c tests/skill-trigger/run_queue_batch.rb
```

Expected: 两个文件都输出语法检查通过

**Step 4: 提交运行脚本**

```bash
git add tests/skill-trigger/run_full_baseline.rb \
        tests/skill-trigger/run_queue_batch.rb
git commit -m "test: add skill trigger baseline runners

run_full_baseline.rb: parallelized dual-host corpus runner
run_queue_batch.rb: incremental queue-based runner with resume
Both use env vars CLAUDE_BIN/CODEX_BIN for host binary paths."
```

---

### Task 4: 将 baseline artifacts 加入 gitignore

**Files:**
- Modify: `tests/skill-trigger/.gitignore` (create)
- Verify: `tests/skill-trigger/runs/artifacts/` exists

**Step 1: 创建 .gitignore 排除运行产物**

创建 `tests/skill-trigger/.gitignore`：

```gitignore
# Run artifacts are large and host-specific; do not commit.
runs/artifacts/
```

**Step 2: 验证 artifacts 目录已被忽略**

运行：

```bash
cd /Users/zego/Zego/horspowers/.worktrees/codex-skill-compat
git status tests/skill-trigger/runs/artifacts/
```

Expected: artifacts 目录不再出现在 untracked 列表中

**Step 3: 提交**

```bash
git add tests/skill-trigger/.gitignore
git commit -m "chore: gitignore skill trigger run artifacts"
```

---

### Task 5: 做设计规格与实施产物一致性核对

**Files:**
- Review: `docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md`
- Review: `tests/skill-trigger/README.md`
- Review: `tests/skill-trigger/rubric.md`
- Review: `tests/skill-trigger/corpus.yaml`
- Review: `tests/skill-trigger/runs/baseline-template.yaml`

**Step 1: 核对设计文档 §10 目录产物是否全部落地**

设计文档 §10 要求的产物：

| 设计产物 | 实际文件 | 状态 |
|----------|----------|------|
| `corpus.yaml` | `tests/skill-trigger/corpus.yaml` | ✅ |
| `README.md` | `tests/skill-trigger/README.md` | ✅ |
| `rubric.md` | `tests/skill-trigger/rubric.md` | ✅ |
| `claude/startup-v1.md` | `tests/skill-trigger/claude/startup-v1.md` | ✅ |
| `codex/startup-v1.md` | `tests/skill-trigger/codex/startup-v1.md` | ✅ |
| `runs/baseline-template.yaml` | `tests/skill-trigger/runs/baseline-template.yaml` | ✅ |

Expected: 全部 ✅

**Step 2: 核对设计文档 §5 评估范围的 8 个 skills 在 corpus 中都有覆盖**

已在 Task 1 Step 1 验证。确认无误即可。

**Step 3: 核对设计文档 §7 评分标准与 rubric.md 一致**

对照设计文档的 4 档（exact/acceptable/miss/wrong）与 rubric.md 的 5 个 primary labels（增加了 no-trigger-expected）。

确认 `no-trigger-expected` 是合理的扩展（设计文档未明确排除该标签），不需要修改。

**Step 4: 核对设计文档 §8 失败原因分类与 rubric.md 一致**

设计文档列出 8 个标签，rubric.md 列出 9 个标签（增加了 `insufficient_context`）。

确认扩展合理，不需要修改。

**Step 5: 核对设计文档 §9 上下文版本化字段在 baseline-template.yaml 中都有对应**

| 设计字段 | template 字段 | 状态 |
|----------|---------------|------|
| `run_id` | `run_id` | ✅ |
| `skills_commit` | `skills.commit` | ✅ |
| `claude_startup_profile` | `hosts.claude.startup_profile` | ✅ |
| `codex_startup_profile` | `hosts.codex.startup_profile` | ✅ |
| `model_claude` | `hosts.claude.model` | ✅ |
| `model_codex` | `hosts.codex.model` | ✅ |
| `date` | `date` | ✅ |

Expected: 全部 ✅

**Step 6: 核对 A/B 策略与 README 一致**

设计文档 §11 的 5 轮策略 vs README.md 的 `## Iteration Order` 和 `## Guardrails`。

确认一致。

**Step 7: 如果发现任何不一致，修正后提交**

```bash
git add -A tests/skill-trigger/ docs/plans/
git commit -m "docs: fix consistency issues found in spec-to-asset review"
```

如果没有不一致，跳过此步骤。

---

### Task 6: 最终自检——确保 4 个核心问题可从文档中找到答案

**Files:**
- Review: `tests/skill-trigger/README.md`
- Review: `tests/skill-trigger/rubric.md`

**Step 1: 回答"测什么"**

从 README.md 的 `## Scope` 和 `## Files` 中能找到答案。

Expected: 能找到 8 个 skills 列表和文件说明

**Step 2: 回答"怎么记录"**

从 `runs/README.md` 和 `baseline-template.yaml` 中能找到答案。

Expected: 能找到命名规范和记录结构

**Step 3: 回答"怎么评分"**

从 `rubric.md` 的 `## Primary Labels` 和 `## How To Judge` 中能找到答案。

Expected: 能找到 5 档评分和判定示例

**Step 4: 回答"怎么判断该改哪一层"**

从 `rubric.md` 的 `## Which Layer To Change Next` 和 README.md 的 `## Evaluation Workflow` step 6 中能找到答案。

Expected: 能找到分层决策规则

**Step 5: 如果 4 个问题都有答案，提交最终状态**

确认所有文件已提交：

```bash
git status
```

Expected: working tree clean（除了 artifacts 和 untracked codex 测试文件）

---

### Task 7: 更新设计文档状态为"第一轮已交付"

**Files:**
- Modify: `docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md`

**Step 1: 将设计文档状态从"待实施"改为"第一轮已交付"**

将：

```yaml
**状态**: 设计完成，待实施
```

改为：

```yaml
**状态**: 第一轮已交付（评估框架基础设施已落地）
```

**Step 2: 在设计文档末尾追加交付记录**

追加：

```markdown
---

## 16. 第一轮交付记录

**交付日期**: 2026-05-11

**已交付产物:**

1. `tests/skill-trigger/` 目录骨架
2. `tests/skill-trigger/corpus.yaml` — 48 条样本（8 skills × 6）
3. `tests/skill-trigger/rubric.md` — 5 档评分 + 9 个失败标签
4. `tests/skill-trigger/claude/startup-v1.md` — Claude baseline startup profile
5. `tests/skill-trigger/codex/startup-v1.md` — Codex baseline startup profile
6. `tests/skill-trigger/runs/baseline-template.yaml` — 双宿主结果记录模板
7. `tests/skill-trigger/runs/README.md` — run 命名与存储规范
8. `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml` — 部分 baseline（4/48 已观测）
9. `tests/skill-trigger/run_full_baseline.rb` — 并行双宿主 corpus runner
10. `tests/skill-trigger/run_queue_batch.rb` — 增量队列式 runner

**下一步建议:**

1. 运行完整 baseline（补全 48 条样本观测结果）
2. 分析高混淆 pair 的失败原因
3. 进入第 2 轮：共享 description 微调实验
```

**Step 3: 提交**

```bash
git add docs/plans/2026-05-11-design-skill-trigger-evaluation-framework.md
git commit -m "docs: mark skill trigger evaluation design as round-1 delivered"
```

---

## 检查点汇总

| Task | 检查点 | 验证方式 |
|------|--------|----------|
| 1 | 核心资产已提交 | `git log --oneline -1` 显示 scaffold commit |
| 2 | 部分 baseline 已提交 | `git show --stat HEAD` 包含 baseline-v1.yaml |
| 3 | 运行脚本已提交且无硬编码路径 | `grep '/Users/' run_full_baseline.rb` 无结果 |
| 4 | artifacts 已被 gitignore | `git status` 不显示 artifacts/ |
| 5 | 设计规格与产物一致 | 核对表全部 ✅ |
| 6 | 4 个核心问题可从文档中找到答案 | 人工确认 |
| 7 | 设计文档状态已更新 | 状态字段显示"第一轮已交付" |

## 检查点

- 批次: 2
- 已完成:
  - Task 5 一致性核对已完成，未发现需要修正的评估资产差异
  - Task 6 自检已完成，4 个核心问题都能从现有文档中直接找到答案
  - Task 7 设计文档状态已更新为“第一轮已交付”，并补充交付记录
- 下次任务:
  - 复核这两份文档改动后是否需要单独提交
  - 若继续推进执行层工作，优先补全 `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml` 的剩余观测结果
- 时间: 2026-05-11
