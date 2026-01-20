# 测试文档完善实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**目标**: 完善 Horspowers 项目 4.2.0 版本的测试相关文档，使其符合统一文档系统设计规范。

**架构方案**: 参考统一文档系统设计文档中的模板规范，逐个完善三个测试文档：
1. 设计文档 (docs/plans/2026-01-19-test-feature-design.md)
2. 任务文档 (docs/active/2026-01-19-task-test-task.md)
3. 功能实施任务文档 (docs/active/2026-01-19-task-test-feature-implementation.md)

**技术栈**: Markdown 文档编辑，基于统一文档系统的模板规范

---

## Task 1: 完善测试设计文档

**文件:**
- Modify: `docs/plans/2026-01-19-test-feature-design.md`

**步骤 1: 分析统一文档系统设计文档中的设计文档模板**

参考 `docs/plans/2026-01-19-unified-document-system-design.md` 第 482-503 行的 `getDesignTemplate` 方法：

```markdown
# ${topic} 设计文档

**日期**: ${new Date().toISOString().slice(0, 10)}

## 需求概述

[描述需要解决的问题和用户需求]

## 设计方案

[详细的设计方案，包括架构、组件、数据流等]

## 实施要点

[关键实施要点和注意事项]

## 相关文档

- [相关计划文档](./YYYY-MM-DD-<feature>.md)
```

**步骤 2: 编写测试设计文档的完整内容**

```markdown
# 测试系统设计文档

**创建时间**: 2026-01-19
**状态**: 设计中
**优先级**: 高

## 一、需求概述

### 1.1 背景

Horspowers 项目在 4.2.0 版本发布后，已完成代码审查工作，但单元测试覆盖率不足。为了确保代码质量和系统的稳定性，需要建立完善的测试体系。

### 1.2 问题陈述

当前测试体系存在以下问题：
- 单元测试未完成，覆盖率未知
- 缺乏统一的测试规范和模板
- 测试文档不够完善，难以指导测试实施
- 没有明确的测试验收标准

### 1.3 目标

- 建立完整的单元测试体系
- 提高测试覆盖率到合理水平
- 建立测试文档规范
- 确保代码质量和系统稳定性

## 二、设计方案

### 2.1 测试架构

```
tests/
├── unit/              # 单元测试
│   ├── skills/        # 技能测试
│   ├── lib/           # 库函数测试
│   └── hooks/         # 钩子测试
├── integration/       # 集成测试
│   └── claude-code/   # Claude Code 集成测试
└── helpers/           # 测试辅助工具
    └── assertions/    # 自定义断言
```

### 2.2 测试分层策略

**1. 单元测试层**
- 测试范围: 独立的函数、类、方法
- 测试工具: 现有的 bash 测试框架
- 覆盖目标: 核心逻辑覆盖率 > 80%

**2. 集成测试层**
- 测试范围: 技能的完整工作流
- 测试工具: claude-code 会话测试
- 覆盖目标: 所有技能至少一个端到端测试

**3. 文档测试层**
- 测试范围: 技能文档的可读性和准确性
- 测试方式: 人工审查 + 自动化检查
- 覆盖目标: 所有技能文档

### 2.3 核心测试组件

#### 2.3.1 测试辅助库 (`tests/helpers/`)

```bash
tests/helpers/
├── assertions/
│   ├── skill-invocation-assertions.sh  # 技能调用断言
│   └── transcript-assertions.sh         # 会话记录断言
└── test-utils.sh                        # 测试工具函数
```

#### 2.3.2 技能测试框架

扩展现有的 `tests/claude-code/run-skill-tests.sh`，支持：
- 并行测试执行
- 测试结果聚合
- 覆盖率报告生成
- 失败重试机制

#### 2.3.3 文档模板测试

建立文档模板验证机制，确保：
- 所有必需的 YAML 字段存在
- 文档结构符合规范
- 交叉引用正确

## 三、实施要点

### 3.1 优先级排序

**高优先级 (P0):**
- 核心技能的单元测试 (brainstorming, writing-plans, TDD, debugging)
- 测试框架基础设施

**中优先级 (P1):**
- 辅助技能的单元测试
- 集成测试补充

**低优先级 (P2):**
- 文档测试自动化
- 性能测试

### 3.2 测试原则

1. **TDD 优先**: 新功能先写测试
2. **DRY 原则**: 复用测试辅助函数
3. **独立性**: 每个测试独立运行
4. **可读性**: 测试即文档，清晰描述预期行为

### 3.3 验收标准

- [ ] 所有核心技能有单元测试
- [ ] 测试覆盖率 > 70%
- [ ] 所有测试通过
- [ ] CI/CD 集成测试自动化

### 3.4 注意事项

1. 测试代码也需要代码审查
2. 避免测试实现细节，测试行为契约
3. Mock 外部依赖 (Claude Code API)
4. 保持测试简单快速

## 四、相关文档

- [任务文档: ../active/2026-01-19-task-test-task.md](../active/2026-01-19-task-test-task.md)
- [实施计划: ../active/2026-01-19-task-test-feature-implementation.md](../active/2026-01-19-task-test-feature-implementation.md)
- [统一文档系统设计: ./2026-01-19-unified-document-system-design.md](./2026-01-19-unified-document-system-design.md)
```

**步骤 3: 验证文档结构**

检查:
- [ ] 包含所有必需章节 (需求概述、设计方案、实施要点、相关文档)
- [ ] Markdown 格式正确
- [ ] 交叉引用路径正确

---

## Task 2: 完善测试任务文档

**文件:**
- Modify: `docs/active/2026-01-19-task-test-task.md`

**步骤 1: 分析统一文档系统设计文档中的任务文档模板**

参考 `docs/plans/2026-01-19-unified-document-system-design.md` 第 540-569 行的任务模板：

```markdown
# 任务: ${title}

## 基本信息
- 创建时间: ${date}
- 负责人: [待指定]
- 优先级: [高/中/低]

## 任务描述
[详细描述任务目标和要求]

## 相关文档
- 设计文档: [../plans/${relatedDocs.design}](../plans/${relatedDocs.design})

## 实施计划
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 进展记录
- ${date}: 创建任务 - 待开始

## 遇到的问题
[记录遇到的问题和解决方案]

## 总结
[任务完成后的总结和反思]
```

**步骤 2: 编写测试任务文档的完整内容**

```markdown
# 任务: 测试体系建立

## 基本信息
- 创建时间: 2026-01-19
- 负责人: 待指定
- 优先级: 高
- 状态: 进行中

## 任务描述

为 Horspowers 项目建立完善的测试体系，包括单元测试、集成测试和文档验证。目标是确保代码质量，提高系统稳定性，并为后续开发提供可靠的测试基础。

## 相关文档

- 设计文档: [../plans/2026-01-19-test-feature-design.md](../plans/2026-01-19-test-feature-design.md)
- 实施任务: [./2026-01-19-task-test-feature-implementation.md](./2026-01-19-task-test-feature-implementation.md)
- 统一文档系统设计: [../plans/2026-01-19-unified-document-system-design.md](../plans/2026-01-19-unified-document-system-design.md)

## 实施计划

### Phase 1: 测试基础设施 (Week 1)

1. **创建测试辅助库**
   - 创建 `tests/helpers/test-utils.sh` 通用工具函数
   - 创建 `tests/helpers/assertions/skill-invocation-assertions.sh`
   - 创建 `tests/helpers/assertions/transcript-assertions.sh`

2. **扩展测试框架**
   - 增强 `tests/claude-code/run-skill-tests.sh`
   - 添加并行执行支持
   - 添加覆盖率报告功能

3. **建立测试规范**
   - 编写测试编写指南
   - 创建测试模板示例
   - 建立 Mock 外部依赖的标准方法

### Phase 2: 核心技能测试 (Week 2-3)

4. **高优先级技能单元测试**
   - brainstorming 技能测试
   - writing-plans 技能测试
   - test-driven-development 技能测试
   - systematic-debugging 技能测试

5. **集成测试**
   - 完整工作流测试 (brainstorming → writing-plans → executing-plans)
   - 跨技能交互测试

### Phase 3: 全面覆盖 (Week 4+)

6. **中低优先级技能测试**
   - 所有剩余技能的单元测试
   - 边缘情况测试

7. **文档验证**
   - 技能文档格式检查
   - 交叉引用验证
   - 示例代码验证

8. **CI/CD 集成**
   - 自动化测试运行
   - 覆盖率报告
   - 失败通知

## 进展记录

- 2026-01-19: 创建任务文档，待开始
- 2026-01-20: 完善任务文档内容，制定详细实施计划

## 验收标准

### 数量指标
- [ ] 单元测试覆盖率 > 70%
- [ ] 所有技能至少有 1 个集成测试
- [ ] 核心技能测试覆盖率 > 80%

### 质量指标
- [ ] 所有测试通过
- [ ] 测试代码通过代码审查
- [ ] CI/CD 自动化测试正常运行

### 文档指标
- [ ] 测试编写指南完成
- [ ] 测试模板示例可用
- [ ] 测试架构文档更新

## 遇到的问题

### 已解决问题
- *暂无*

### 待解决问题
- 如何有效 Mock Claude Code API
- 集成测试的执行时间和资源平衡
- 测试覆盖率的准确度量方法

## 总结

*任务完成时填写总结，包括：*
- *实际完成时间 vs 预估时间*
- *遇到的主要挑战和解决方案*
- *经验教训和改进建议*
```

**步骤 3: 验证文档结构**

检查:
- [ ] 包含所有必需章节
- [ ] 状态标记为"进行中"
- [ ] 相关文档链接正确
- [ ] 进展记录有最新条目

---

## Task 3: 完善功能实施任务文档

**文件:**
- Modify: `docs/active/2026-01-19-task-test-feature-implementation.md`

**步骤 1: 编写测试功能实施任务文档**

这是一个具体的功能实施任务，参考任务模板：

```markdown
# 任务: 实施测试功能

## 基本信息
- 创建时间: 2026-01-19
- 负责人: 待指定
- 优先级: 高
- 状态: 进行中

## 任务描述

实施 Horspowers 项目的测试功能，建立完整的测试体系。这是 4.2.0 版本发布后的重要补充工作，确保代码质量和项目稳定性。

## 相关文档

- 设计文档: [../plans/2026-01-19-test-feature-design.md](../plans/2026-01-19-test-feature-design.md)
- 测试任务: [./2026-01-19-task-test-task.md](./2026-01-19-task-test-task.md)

## 实施计划

### 1. 测试基础设施搭建

#### 1.1 创建测试辅助函数库
**文件**: `tests/helpers/test-utils.sh`

功能需求:
- 通用测试设置和清理函数
- 断言辅助函数
- Mock 工厂函数

#### 1.2 创建技能调用断言库
**文件**: `tests/helpers/assertions/skill-invocation-assertions.sh`

功能需求:
- 验证技能是否被调用
- 验证技能参数
- 验证技能调用顺序

#### 1.3 创建会话记录断言库
**文件**: `tests/helpers/assertions/transcript-assertions.sh`

功能需求:
- 解析 `.jsonl` 会话记录
- 验证工具调用
- 验证输出内容

### 2. 扩展测试框架

#### 2.1 增强测试运行脚本
**文件**: `tests/claude-code/run-skill-tests.sh`

增强功能:
- 添加 `--coverage` 参数生成覆盖率报告
- 添加 `--parallel` 参数支持并行执行
- 添加 `--filter` 参数过滤特定测试
- 改进输出格式和错误报告

#### 2.2 创建覆盖率工具
**文件**: `tests/claude-code/coverage-report.sh`

功能:
- 分析测试覆盖的技能
- 统计测试通过/失败数量
- 生成 HTML 报告

### 3. 编写核心技能测试

#### 3.1 brainstorming 技能测试
**文件**: `tests/claude-code/test-brainstorming.sh`

测试场景:
- 基本头脑风暴流程
- 设计验证
- 文档创建

#### 3.2 writing-plans 技能测试
**文件**: `tests/claude-code/test-writing-plans.sh`

测试场景:
- 计划创建
- 任务拆解
- 文档格式验证

#### 3.3 test-driven-development 技能测试
**文件**: `tests/claude-code/test-tdd.sh`

测试场景:
- RED-GREEN-REFACTOR 循环
- 测试先于实现
- 重构步骤

#### 3.4 systematic-debugging 技能测试
**文件**: `tests/claude-code/test-debugging.sh`

测试场景:
- 问题定位
- 根因分析
- 解决方案验证

### 4. 集成测试

#### 4.1 完整工作流测试
**文件**: `tests/claude-code/test-full-workflow.sh`

测试流程:
```
brainstorming → writing-plans → executing-plans → code-review → finishing
```

验证点:
- 每个阶段的输出正确
- 文档关联正确
- 状态跟踪正确

### 5. 文档和规范

#### 5.1 编写测试指南
**文件**: `docs/testing.md` (如不存在)

内容:
- 测试编写规范
- Mock 使用指南
- 最佳实践

#### 5.2 创建测试模板
**文件**: `tests/templates/test-template.sh`

提供:
- 单元测试模板
- 集成测试模板
- 断言示例

## 进展记录

- 2026-01-19: 创建任务 - 待开始
- 2026-01-20: 完善任务文档内容，制定详细实施步骤

## 验收标准

### 功能验收
- [ ] 测试辅助库可用且文档完善
- [ ] 测试框架支持并行和覆盖率报告
- [ ] 所有核心技能有通过的测试
- [ ] 完整工作流集成测试通过

### 质量验收
- [ ] 测试代码符合项目规范
- [ ] 测试通过率 100%
- [ ] 测试覆盖率 > 70%

### 文档验收
- [ ] 测试指南完整清晰
- [ ] 测试模板可用
- [ ] 代码注释充分

## 技术考虑

### Mock 策略
- Claude Code API: 使用环境变量控制
- 文件系统: 使用临时目录
- Git 操作: 使用测试仓库

### 性能考虑
- 集成测试可能较慢，考虑标记和分层
- 并行执行需要避免资源竞争
- 缓存测试结果以加快开发迭代

## 遇到的问题

### 已解决问题
- *暂无*

### 待解决问题
- 测试框架扩展的具体实现细节
- Mock Claude Code API 的最佳方案
- 集成测试的执行时间优化

## 总结

*任务完成时填写总结，包括：*
- *实际实施情况 vs 计划*
- *遇到的技术障碍和解决方案*
- *测试体系的效果评估*
- *后续改进建议*
```

**步骤 2: 验证文档结构**

检查:
- [ ] 实施步骤详细且可操作
- [ ] 验收标准明确可衡量
- [ ] 相关文档链接正确

---

## Task 4: 验证文档关联

**步骤 1: 验证交叉引用**

运行: 检查所有文档的交叉引用链接

```bash
# 检查 markdown 链接
npx markdown-link-check docs/plans/2026-01-19-test-feature-design.md
npx markdown-link-check docs/active/2026-01-19-task-test-task.md
npx markdown-link-check docs/active/2026-01-19-task-test-feature-implementation.md
```

预期: 所有链接有效

**步骤 2: 验证文档结构符合统一规范**

检查清单:
- [ ] 设计文档使用 docs/plans/ 路径
- [ ] 任务文档使用 docs/active/ 路径
- [ ] 文档命名符合 YYYY-MM-DD-<type>-<slug>.md 格式
- [ ] 包含必需的 YAML frontmatter (如有)
- [ ] 相关文档引用使用相对路径

---

## Task 5: 提交文档更新

**步骤 1: 提交所有文档更改**

```bash
# 添加修改的文档
git add docs/plans/2026-01-19-test-feature-design.md
git add docs/active/2026-01-19-task-test-task.md
git add docs/active/2026-01-19-task-test-feature-implementation.md
git add docs/plans/2026-01-20-test-documents-completion.md

# 创建提交
git commit -m "docs: 完善测试相关文档

- 完善测试设计文档，包含完整的需求、方案和实施要点
- 完善测试任务文档，制定分阶段实施计划
- 完善功能实施任务文档，详细列出实施步骤
- 创建文档完善实施计划
- 所有文档符合统一文档系统设计规范

相关文档:
- docs/plans/2026-01-19-test-feature-design.md
- docs/active/2026-01-19-task-test-task.md
- docs/active/2026-01-19-task-test-feature-implementation.md
"
```

**步骤 2: 验证提交**

```bash
git log -1 --stat
```

预期: 显示 4 个文件已修改/创建
