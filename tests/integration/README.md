# Integration Tests

Horspowers 集成测试用于验证完整工作流和跨技能交互。

## 概述

集成测试与单元测试不同：
- **单元测试** (`tests/claude-code/`) - 测试单个技能的功能
- **集成测试** (`tests/integration/`) - 测试完整工作流和技能协作

## 测试列表

| 测试文件 | 测试内容 | 预估耗时 |
|----------|----------|----------|
| `test-complete-workflow.sh` | brainstorming → writing-plans 完整流程 | ~5分钟 |
| `test-cross-skill-interaction.sh` | 跨技能交互和协作 | ~5分钟 |

## 快速开始

### 运行所有集成测试

```bash
./tests/integration/run-integration-tests.sh
```

### 运行单个集成测试

```bash
./tests/integration/test-complete-workflow.sh
./tests/integration/test-cross-skill-interaction.sh
```

### 运行特定的集成测试

```bash
./tests/integration/run-integration-tests.sh complete-workflow
```

## 测试说明

### 1. 完整工作流测试 (test-complete-workflow.sh)

测试从设计到实施的完整流程：

```
brainstorming (设计)
    ↓
writing-plans (计划)
    ↓
executing-plans (实施)
```

**验证内容：**
- ✓ 设计文档创建在 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- ✓ 计划文档创建在 `docs/plans/YYYY-MM-DD-<feature>.md`
- ✓ 任务文档创建在 `docs/active/YYYY-MM-DD-task-<slug>.md`
- ✓ 文档内容符合预期格式

### 2. 跨技能交互测试 (test-cross-skill-interaction.sh)

测试技能之间的协作：

**测试场景 1: 设计 → 计划 → 实施**
- 验证 brainstorming 创建的设计文档
- 验证 writing-plans 引用设计文档
- 验证文档间的交叉引用

**测试场景 2: TDD 调试工作流**
- 创建包含 bug 的测试文件
- 使用 systematic-debugging 分析问题
- 验证调试流程

**测试场景 3: 文档状态管理**
- 验证元数据目录创建
- 验证文档索引生成
- 验证状态追踪机制

## 辅助函数

集成测试使用 `tests/integration/test-helpers.sh` 中的辅助函数：

```bash
# 创建测试项目
create_test_project "test-name"

# 初始化 git 仓库
init_git_repo "$project_dir"

# 在测试项目中运行 Claude
run_claude_in_project "$project_dir" "prompt" 120

# 检查文件/目录存在
file_exists "$project_dir" "docs/plans/design.md"
dir_exists "$project_dir" "docs/active"

# 读取文件内容
read_file "$project_dir" "docs/plans/design.md"

# 在项目中搜索
search_in_project "$project_dir" "TODO list" "*.md"

# 清理测试项目
cleanup_test_project "$project_dir"
```

## 编写新的集成测试

### 模板

```bash
#!/usr/bin/env bash
# Integration Test: <Test Name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Integration Test: <Test Name>${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Create test project
TEST_PROJECT=$(create_test_project "test-name")
init_git_repo "$TEST_PROJECT"

# Test steps...
echo "Running test..."

# Cleanup
cleanup_test_project "$TEST_PROJECT"

echo -e "${GREEN}✓ Test PASSED${NC}"
exit 0
```

## 注意事项

1. **执行时间**: 集成测试需要调用 Claude API，每个测试约 3-5 分钟
2. **临时文件**: 测试在 `/tmp/horspowers-tests/` 创建临时项目，测试后自动清理
3. **网络依赖**: 集成测试需要能够访问 Claude API
4. **并行执行**: 集成测试不建议并行执行，因为可能创建相同的文档

## CI/CD 集成

在 CI/CD 环境中运行集成测试：

```yaml
# .github/workflows/test.yml
- name: Run integration tests
  run: ./tests/integration/run-integration-tests.sh
  env:
    CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

## 故障排除

### 测试超时

如果测试超时，可能是：
- Claude API 响应慢
- 网络延迟
- 提示词过于复杂

**解决方案**: 增加超时时间或简化提示词

### 文档未创建

如果预期文档未创建，可能是：
- 技能未正确调用
- 技能返回错误
- 文档路径不匹配

**解决方案**: 检查测试输出，查看实际错误信息

### 清理失败

如果测试失败后临时目录未清理：

```bash
# 手动清理所有测试目录
rm -rf /tmp/horspowers-tests/
```
