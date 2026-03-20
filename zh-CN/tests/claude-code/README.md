# Claude 代码技能测试

使用 Claude Code CLI 对 superpowers 技能进行自动化测试。

## 概述

此测试套件验证技能是否正确加载以及 Claude 是否按预期遵循它们。测试以无头模式 (`claude -p`) 调用 Claude Code 并验证其行为。

## 要求

* Claude Code CLI 已安装并在 PATH 中 (运行 `claude --version` 应有效)
* 本地 superpowers 插件已安装 (安装方法请参阅主 README)

## 运行测试

### 运行所有快速测试 (推荐):

```bash
./run-skill-tests.sh
```

### 运行集成测试 (较慢，10-30 分钟):

```bash
./run-skill-tests.sh --integration
```

### 运行特定测试:

```bash
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

### 以详细输出模式运行:

```bash
./run-skill-tests.sh --verbose
```

### 设置自定义超时时间:

```bash
./run-skill-tests.sh --timeout 1800  # 30 minutes for integration tests
```

## 测试结构

### test-helpers.sh

用于技能测试的通用函数：

* `run_claude "prompt" [timeout]` - 使用提示运行 Claude
* `assert_contains output pattern name` - 验证模式存在
* `assert_not_contains output pattern name` - 验证模式不存在
* `assert_count output pattern count name` - 验证精确计数
* `assert_order output pattern_a pattern_b name` - 验证顺序
* `create_test_project` - 创建临时测试目录
* `create_test_plan project_dir` - 创建示例计划文件

### 测试文件

每个测试文件：

1. 引入 `test-helpers.sh`
2. 使用特定提示运行 Claude Code
3. 使用断言验证预期行为
4. 成功时返回 0，失败时返回非零值

## 示例测试

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: My Skill ==="

# Ask Claude about the skill
output=$(run_claude "What does the my-skill skill do?" 30)

# Verify response
assert_contains "$output" "expected behavior" "Skill describes behavior"

echo "=== All tests passed ==="
```

## 当前测试

### 快速测试 (默认运行)

#### test-subagent-driven-development.sh

测试技能内容和要求 (~2 分钟)：

* 技能加载和可访问性
* 工作流顺序 (规范合规性先于代码质量)
* 自审要求已记录
* 计划阅读效率已记录
* 规范合规性评审员的怀疑态度已记录
* 评审循环已记录
* 任务上下文提供已记录

### 集成测试 (使用 --integration 标志)

#### test-subagent-driven-development-integration.sh

完整工作流执行测试 (~10-30 分钟)：

* 创建包含 Node.js 设置的真正测试项目
* 创建包含 2 个任务的实施计划
* 使用子代理驱动开发执行计划
* 验证实际行为：
  * 计划在开始时读取一次 (非每个任务)
  * 子代理提示中提供完整的任务文本
  * 子代理在报告前执行自审
  * 规范合规性评审先于代码质量评审进行
  * 规范评审员独立阅读代码
  * 生成可工作的实现
  * 测试通过
  * 创建正确的 git 提交

**测试内容：**

* 工作流实际上能端到端运行
* 我们的改进措施实际被应用
* 子代理正确遵循技能
* 最终代码功能正常且经过测试

## 添加新测试

1. 创建新的测试文件：`test-<skill-name>.sh`
2. 引入 test-helpers.sh
3. 使用 `run_claude` 和断言编写测试
4. 添加到 `run-skill-tests.sh` 中的测试列表
5. 使其可执行：`chmod +x test-<skill-name>.sh`

## 超时注意事项

* 默认超时：每个测试 5 分钟
* Claude Code 可能需要时间响应
* 如有需要，使用 `--timeout` 进行调整
* 测试应保持专注以避免长时间运行

## 调试失败的测试

使用 `--verbose`，您将看到完整的 Claude 输出：

```bash
./run-skill-tests.sh --verbose --test test-subagent-driven-development.sh
```

如果不使用详细模式，则仅显示失败时的输出。

## CI/CD 集成

在 CI 中运行：

```bash
# Run with explicit timeout for CI environments
./run-skill-tests.sh --timeout 900

# Exit code 0 = success, non-zero = failure
```

## 注意事项

* 测试验证的是技能*指令*，而非完整执行
* 完整的工作流测试会非常缓慢
* 专注于验证关键技能要求
* 测试应具有确定性
* 避免测试实现细节
