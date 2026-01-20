# 测试运行器使用指南

本项目提供三种测试运行方式，适应不同的使用场景。

---

## 1. 原始测试运行器（批量模式）

**文件**: `run-skill-tests.sh`

**特点**:
- 一次性运行所有测试
- 适合 CI/CD 集成
- 快速获得整体结果

**使用**:
```bash
# 运行所有核心测试
./tests/claude-code/run-skill-tests.sh

# 运行特定测试
./tests/claude-code/run-skill-tests.sh test-tdd.sh

# 包含集成测试（耗时 10-30 分钟）
./tests/claude-code/run-skill-tests.sh --integration
```

**输出示例**:
```
=========================================
 Claude Code Skills Test Suite
========================================-

----------------------------------------
Running: test-tdd.sh
----------------------------------------
  [PASS] (189s)

========================================
 Test Results Summary
========================================

  Passed:  3
  Failed:  0
```

---

## 2. 交互式测试运行器（实时进度）

**文件**: `run-skill-tests-interactive.sh`

**特点**:
- 显示测试队列和预估时间
- 实时进度反馈
- 彩色输出，更易读
- 显示每个测试的耗时统计

**使用**:
```bash
# 运行所有测试（带实时进度）
./tests/claude-code/run-skill-tests-interactive.sh

# 运行单个测试
./tests/claude-code/run-skill-tests-interactive.sh test-tdd.sh
```

**输出示例**:
```
=========================================
 Interactive Skill Tests
=========================================

Mode: Single-step with real-time feedback

Test Queue (6 tests, ~12 minutes total):

  1. test-brainstorming.sh (~10m)
  2. test-writing-plans.sh (~10m)
  3. test-tdd.sh (~10m)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1/6: test-tdd.sh
Estimated: ~10 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[运行测试...]

✅ PASSED (189s)

Progress: 1/6 tests completed
Elapsed: 3m 9s
Estimated remaining: ~19m
```

---

## 3. 单步确认运行器（完全控制）

**文件**: `run-skill-tests-stepwise.sh`

**特点**:
- 每个测试后暂停等待确认
- 倒计时开始
- 可检查中间结果
- 可随时中断

**使用**:
```bash
# 从第一个测试开始
./tests/claude-code/run-skill-tests-stepwise.sh

# 跳过前面的测试，从指定测试开始
./tests/claude-code/run-skill-tests-stepwise.sh test-tdd.sh

# 不需要确认，自动运行（类似原始模式）
CONFIRM_EACH=false ./tests/claude-code/run-skill-tests-stepwise.sh
```

**输出示例**:
```
=========================================
 Stepwise Test Runner
=========================================

Each test will run and pause for your confirmation.
Press Enter to continue, or Ctrl+C to exit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3/6: test-tdd.sh
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Starting in 3... 2... 1... Go!

[运行测试...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TEST PASSED
Duration: 189s (3m 9s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: 3/6 | Passed: 3 | Failed: 0

Press Enter to continue to next test...
```

---

## 推荐使用场景

### 场景 1: 日常开发检查

**推荐**: 交互式运行器

```bash
./tests/claude-code/run-skill-tests-interactive.sh
```

**原因**:
- 可以看到预计剩余时间
- 实时了解进度
- 彩色输出更友好

### 场景 2: 调试特定测试

**推荐**: 单步确认运行器

```bash
# 从失败的测试开始
./tests/claude-code/run-skill-tests-stepwise.sh test-tdd.sh
```

**原因**:
- 每个测试后可以检查结果
- 可以在测试间查看日志
- 完全控制执行节奏

### 场景 3: CI/CD 集成

**推荐**: 原始批量运行器

```bash
./tests/claude-code/run-skill-tests.sh
```

**原因**:
- 标准输出格式
- 适合日志解析
- 退出码明确

### 场景 4: 快速验证单个技能

**推荐**: 直接运行测试文件

```bash
./tests/claude-code/test-tdd.sh
```

**原因**:
- 最快方式
- 输出简洁
- 适合频繁迭代

---

## 测试文件列表

| 测试文件 | 测试数量 | 预估耗时 | 说明 |
|----------|----------|----------|------|
| test-brainstorming.sh | 6 | ~10分钟 | 头脑风暴技能 |
| test-writing-plans.sh | 6 | ~10分钟 | 编写计划技能 |
| test-tdd.sh | 6 | ~10分钟 | TDD技能 |
| test-systematic-debugging.sh | 5 | ~10分钟 | 系统化调试技能 |
| test-subagent-driven-development.sh | 7 | ~15分钟 | 子代理驱动开发 |
| test-automated-development-workflow.sh | 3 | ~15分钟 | 自动化开发工作流 |

---

## 超时配置

所有测试现在使用 **120秒** 超时（可在 `test-helpers.sh` 中配置）：

```bash
# 修改默认超时时间
# test-helpers.sh line 11:
local timeout="${2:-120}"  # 修改为你需要的秒数
```

---

## 调试模式

启用详细调试输出：

```bash
# 启用调试模式
TEST_DEBUG_MODE=1 ./tests/claude-code/test-tdd.sh

# 查看正在执行的命令
TEST_DEBUG_MODE=1 ./tests/claude-code/run-skill-tests-stepwise.sh
```

---

## 快捷命令

```bash
# 创建别名（可选）
alias test-skills='./tests/claude-code/run-skill-tests-interactive.sh'
alias test-step='./tests/claude-code/run-skill-tests-stepwise.sh'
alias test-quick='./tests/claude-code/test-tdd.sh'

# 使用
test-skills      # 交互式运行所有测试
test-step        # 单步运行所有测试
test-quick       # 快速测试 TDD
```
