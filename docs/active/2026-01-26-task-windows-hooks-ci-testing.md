# 任务: Windows Hooks CI 自动化测试

## 基本信息
- 创建时间: 2026-01-26
- 负责人: [待指定]
- 优先级: 高
- 相关问题: SessionStart: session hook error on Windows

## 任务描述

通过 GitHub Actions Windows 环境验证 Horspowers session-start hook 在 Windows 平台上的兼容性，发现问题并修复，或记录已知限制。

## 背景

### 当前问题
1. **run-hook.cmd 路径传递**: `%~dp0%~1` 展开为反斜杠路径（`C:\path\to\hooks\`），直接传给 bash 可能失败
2. **session-start.sh 相对路径**: `require('./lib/config-manager.js')` 使用相对路径，在不同工作目录下会失败
3. **bash.exe 查找逻辑**: 需要支持多种 Git 安装路径

### 测试策略
- 使用 GitHub Actions `windows-latest` runner（Windows Server 2022 + Git for Windows）
- 覆盖 95% 的标准 Windows 用户场景
- 剩余 5% 边缘案例（自定义 Git 路径等）记录为已知限制

## 实施计划

### Phase 1: 创建 CI 测试框架 ✅
- [x] 创建 `.github/workflows/test-windows-hooks.yml`
- [x] 添加 Windows 和 macOS 测试 job
- [x] 推送代码触发首次测试

**验收标准**:
- [x] workflow 文件存在且语法正确
- [x] 包含至少 10 个测试用例
- [x] Windows 和 macOS 都有测试覆盖

### Phase 2: 分析首次测试结果
**目标**: 查看 GitHub Actions 运行结果，识别失败用例

**验收标准**:
- [ ] 记录所有测试用例的通过/失败状态
- [ ] 收集失败的错误日志
- [ ] 确定失败原因（代码问题 vs 环境问题 vs 测试问题）

**输出**: `测试报告 - 首次运行.md`

### Phase 3: 修复代码问题（迭代）
**目标**: 逐个修复测试发现的代码问题

**约束条件**:
- 每个失败用例最多尝试 3 次修复
- 如果连续 3 次修复后仍失败，标记为「已知限制」
- **禁止通过删除测试用例或降低测试标准来通过测试**

**验收标准**:
- [ ] 每个修复都有对应的 git commit
- [ ] commit message 清晰描述修复的问题
- [ ] 无法修复的问题记录在「已知限制」章节

**输出**:
- 修复的代码 commits
- `已知限制.md` 文档

### Phase 4: 生成最终测试报告
**目标**: 汇总测试结果，提供明确的结论

**验收标准**:
- [ ] 包含所有测试用例的最终状态
- [ ] 列出所有修复的问题
- [ ] 列出所有已知限制
- [ ] 提供用户升级建议（如有）
- [ ] 更新相关文档（README, polyglot-hooks.md）

**输出**: `测试报告 - 最终.md`

## 测试用例清单

### 核心功能测试（必须通过）

| # | 测试用例 | 描述 | 验收点 | 状态 | 备注 |
|---|---------|------|--------|------|------|
| 1 | bash.exe 查找 | `where bash` 或常见路径能找到 bash | 退出码 0 | - | - |
| 2 | Polyglot 语法 | CMD 和 bash 都能正确解析 run-hook.cmd | CMDBLOCK 存在 | - | - |
| 3 | session-start.sh 语法 | bash -n 验证语法无错误 | 退出码 0 | - | - |
| 4 | Hook 基本执行 | run-hook.cmd session-start.sh 能执行 | 退出码 0 | - | - |
| 5 | JSON 输出格式 | 输出是有效 JSON，包含 hookSpecificOutput | jq 解析成功 | - | - |
| 6 | using-horspowers 注入 | 输出包含 "using-horspowers" 字符串 | grep 匹配 | - | - |
| 7 | 技能内容标记 | 输出包含 EXTREMELY_IMPORTANT 和 Horspowers | grep 匹配 | - | - |
| 8 | 错误处理 - 缺少参数 | run-hook.cmd 无参数时返回错误 | 退出码 非0 | - | - |
| 9 | 错误处理 - 不存在脚本 | run-hook.cmd nonexistent.sh 返回错误 | 退出码 非0 | - | - |
| 10 | 跨目录执行 | 从其他目录执行 hook 成功 | 退出码 0 | - | - |

### 回归测试（必须通过）

| # | 测试用例 | 描述 | 验收点 | 状态 | 备注 |
|---|---------|------|--------|------|------|
| 11 | macOS 兼容性 | Unix 系统执行 run-hook.cmd 成功 | 退出码 0 | - | 确保 Windows 修复不破坏 Unix |

### 可选测试（尽力而为）

| # | 测试用例 | 描述 | 验收点 | 状态 | 备注 |
|---|---------|------|--------|------|------|
| 12 | session-end hook | session-end.sh 能执行 | 退出码 0 | - | 辅助功能，失败不阻塞 |
| 13 | 自定义 Git 路径 | D:\Git 等非常规路径 | bash 找到 | - | 需手动测试 |

## 已知限制（记录无法修复的问题）

### 模板
```markdown
### 限制 #[序号]: [问题标题]

**问题描述**: [描述问题]

**影响范围**: [哪些用户会受影响]

**失败原因**: [为什么无法修复]

**用户影响**: [对用户的具体影响]

**替代方案**: [用户可以如何绕过]

**测试证据**: [GitHub Actions run 链接或错误日志]
```

### 已记录的限制
- (暂无，测试后添加)

## 测试报告模板

### 测试报告 - 首次运行.md
```markdown
# Windows Hooks CI 测试报告 - 首次运行

**测试时间**: YYYY-MM-DD HH:MM:SS UTC
**GitHub Actions Run**: [#链接]
**Commit**: [SHA]

## 测试结果总览

- 总测试用例: N
- 通过: N
- 失败: N
- 跳过: N

## 失败用例详情

### 用例 #[编号]: [用例名称]
**错误信息**:
```
[错误日志]
```

**初步分析**:
- [ ] 代码问题
- [ ] 环境问题
- [ ] 测试脚本问题

**下一步**: [需要做的操作]

...
```

### 测试报告 - 最终.md
```markdown
# Windows Hooks CI 测试报告 - 最终

**测试时间范围**: [开始] - [结束]
**测试轮次**: N
**最终 Commit**: [SHA]

## 执行摘要

[一段话总结测试结果]

## 测试结果统计

| 类别 | 数量 |
|------|------|
| 总测试用例 | N |
| 通过 | N |
| 修复后通过 | N |
| 已知限制 | N |
| 最终通过率 | N% |

## 修复的问题

### 1. [问题标题]
- **Commit**: [SHA]
- **描述**: [修复内容]

...

## 已知限制

### 1. [限制标题]
- **影响**: [受影响用户]
- **替代方案**: [绕过方法]

...

## 用户升级建议

[给用户的升级说明]

## 相关文档更新

- [ ] README.md
- [ ] docs/windows/polyglot-hooks.md
- [ ] RELEASE-NOTES.md
```

## 进展记录

- 2026-01-26: 任务创建 - Phase 1 完成，等待首次 CI 运行结果
- 2026-01-26: 等待 Phase 2 - 分析测试结果
- 2026-01-26: 等待 Phase 3 - 修复问题（迭代）
- 2026-01-26: 等待 Phase 4 - 生成最终报告

## 相关文件

- [测试 Workflow](.github/workflows/test-windows-hooks.yml)
- [Windows 兼容性文档](docs/windows/polyglot-hooks.md)
- [原始 Bug Report](docs/active/2026-01-23-bug-windows-session-hook-failure.md)
