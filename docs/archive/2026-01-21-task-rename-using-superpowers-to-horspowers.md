# 任务: 将 using-superpowers 重命名为 using-horspowers

## 基本信息
- 创建时间: 2026-01-21
- 负责人: [待指定]
- 优先级: 中

## 任务描述

将 `using-superpowers` 技能重命名为 `using-horspowers`，以反映项目从 superpowers fork 而来的事实，并建立独立的品牌标识。

## 背景分析

### 需要修改的原因

1. **品牌一致性**: Horspowers 是从 obra/superpowers fork 出来的独立项目，应该有自己的命名
2. **用户混淆**: 用户可能会困惑 `using-superpowers` 和 Horspowers 项目之间的关系
3. **完整性**: 2025-01-04 的设计方案中提到这个任务，但一直未完成

### 影响范围

这是一个核心技能，在多个地方被引用：

1. **Session Start Hook** - 在每次会话开始时注入此技能
2. **所有技能文档** - 作为技能系统的入口点被引用
3. **用户文档** - 用户指南中多处提及
4. **命令系统** - 可能存在相关命令

## 实施计划

### Phase 1: 重命名核心技能

**目标**: 将 `using-superpowers` 技能目录和内容重命名为 `using-horspowers`

**步骤**:
1. 创建新目录 `skills/using-horspowers/`
2. 复制并更新 `SKILL.md` 内容
   - 更新 name: `using-horspowers`
   - 更新 description 中的引用
   - 更新技能内容中的所有 "Superpowers" 为 "Horspowers"
   - 保留对 "superpowers" 原项目的引用说明
3. 添加向后兼容说明：技能也可通过 `horspowers:using-superpowers` 调用（为了兼容）

### Phase 2: 更新 Session Start Hook

**目标**: 修改会话启动时的技能注入逻辑

**步骤**:
1. 更新 `hooks/session-start.sh`
   - 将 `using-superpowers` 路径改为 `using-horspowers`
   - 更新上下文注入内容
2. 测试确保会话启动正常

### Phase 3: 更新所有技能引用

**目标**: 更新所有技能文档中的交叉引用

**步骤**:
1. 搜索所有引用 `using-superpowers` 的技能文件
2. 将引用更新为 `using-horspowers`
3. 更新技能描述中的触发说明

### Phase 4: 更新文档和命令

**目标**: 更新用户文档和命令系统

**步骤**:
1. 更新 `docs/` 下所有文档
2. 检查 `commands/` 目录是否有相关命令
3. 更新 README 和其他用户指南
4. 添加迁移说明（向后兼容性）

### Phase 5: 保留向后兼容

**目标**: 确保旧的引用方式仍然可用

**步骤**:
1. 在 `skills/` 目录创建 `using-superpowers` 软链接指向 `using-horspowers`
2. 或创建一个简单的重定向技能文件
3. 在文档中说明两种调用方式都支持

## 验收标准

- [ ] `using-horspowers` 技能创建并正常工作
- [ ] Session Start Hook 正确注入新技能
- [ ] 所有技能引用已更新
- [ ] 用户文档已更新
- [ ] 保留向后兼容性（旧调用方式仍可用）
- [ ] 测试通过：会话启动、技能调用、文档引用

## 技术细节

### 文件变更清单

**新增**:
- `skills/using-horspowers/SKILL.md`

**修改**:
- `hooks/session-start.sh`
- `skills/*/SKILL.md` (所有引用 using-superpowers 的技能)
- `docs/**/*.md` (所有相关文档)
- `README.md` 和其他用户指南

**可选（向后兼容）**:
- `skills/using-superpowers/SKILL.md` (重定向或软链接)

### 内容更新要点

在重命名时需要注意：

1. **保留原项目归属**: 在技能开头说明 Horspowers 是从 obra/superpowers fork 而来
2. **配置文件名**: 确保使用 `.horspowers-config.yaml` 而非 `.superpowers-config.yaml`
3. **欢迎消息**: 将 "欢迎使用 Superpowers" 改为 "欢迎使用 Horspowers"

## 相关文档

- [Superpowers 个人开发者适配设计方案](../plans/2025-01-04-personal-superpowers-design.md)
- [README.md](../../README.md)

## 进展记录

- 2026-01-21: 创建任务 - 待开始
- 2026-01-21: 完成 Phase 1 - 创建 `skills/using-horspowers/SKILL.md`
- 2026-01-21: 完成 Phase 2 - 更新 `hooks/session-start.sh` 引用
- 2026-01-21: 完成 Phase 3 - 更新 `CLAUDE.md` 中的引用
- 2026-01-21: 完成 Phase 4 - 更新 `README.md` 中的引用
- 2026-01-21: 完成 Phase 5 - 保留 `using-superpowers` 作为向后兼容别名
- 2026-01-21: **任务完成** - ✅ 所有阶段已完成
