# 任务: 配置文件系统改进

## 基本信息
- 创建时间: 2026-01-21
- 负责人: [待指定]
- 优先级: 高

## 任务描述

完善配置文件系统的初始化和版本升级逻辑，确保在安装或升级 Horspowers 时能够正确创建默认配置文件。

## 背景分析

### 当前问题

1. **配置文件名称已更新但未完全迁移**:
   - 代码已使用 `.horspowers-config.yaml`（`lib/config-manager.js`）
   - 但部分文档和代码中仍引用 `.superpowers-config.yaml`
   - `hooks/session-start.sh` 中同时检测两个文件名

2. **缺少自动初始化机制**:
   - 新安装 Horspowers 后不会自动创建配置文件
   - 首次使用时才通过 `using-superpowers` 技能提示用户创建
   - 没有默认配置文件的概念

3. **版本升级时配置未更新**:
   - 升级到新版本时不会自动创建或更新配置文件
   - `lib/version-upgrade.js` 没有处理配置文件迁移逻辑

4. **配置模板文件存在但未使用**:
   - 存在 `.horspowers-config.template.yaml` 模板文件
   - 但代码中未使用该模板，而是在 `config-manager.js` 中硬编码模板

## 实施计划

### Phase 1: 清理配置文件引用

**目标**: 统一使用 `.horspowers-config.yaml` 作为唯一配置文件名

**步骤**:
1. 更新 `hooks/session-start.sh`，移除对 `.superpowers-config.yaml` 的检测
2. 更新所有技能文档中的配置文件引用
3. 更新用户文档和指南
4. 保留 `.superpowers-config.yaml` 的向后兼容读取（但不推荐）

### Phase 2: 实现默认配置创建机制

**目标**: 提供合理的默认配置，减少首次使用的配置负担

**步骤**:
1. 设计默认配置策略（个人模式为默认）
2. 在 `session-start.sh` 中添加自动创建逻辑
3. 创建 `/init-config` 命令用于手动初始化
4. 更新 `using-horspowers` 技能的首次配置流程

**配置策略**:
- 默认模式：个人开发者（`development_mode: personal`）
- 默认分支策略：简单分支（`branch_strategy: simple`）
- 默认测试策略：测试后置（`testing_strategy: test-after`）
- 默认完成策略：本地合并（`completion_strategy: merge`）
- 文档系统：默认启用（`documentation.enabled: true`）

### Phase 3: 实现版本升级时的配置迁移

**目标**: 在升级时自动检查和更新配置文件

**步骤**:
1. 在 `lib/version-upgrade.js` 中添加配置文件检测逻辑
2. 实现配置文件版本管理（在配置中添加 `version` 字段）
3. 自动迁移旧配置到新格式
4. 保留用户自定义配置项

### Phase 4: 优化配置管理模块

**目标**: 提升配置管理的健壮性和用户体验

**步骤**:
1. 使用 `.horspowers-config.template.yaml` 作为模板源
2. 添加配置验证逻辑（检查必填字段和有效值）
3. 添加配置文件格式化输出
4. 实现配置项的合并和更新功能

### Phase 5: 集成到 Session Start Hook

**目标**: 在会话开始时自动检测和处理配置状态

**步骤**:
1. 在 `hooks/session-start.sh` 中调用配置检测逻辑
2. 根据检测结果设置相应的标记：
   - `<config-needs-init>`: 无配置文件，需要初始化
   - `<config-needs-migration>`: 有旧配置文件，需要迁移
   - `<config-needs-update>`: 有新配置但版本过低，需要更新
   - `<config-valid>`: 配置有效且最新
3. 将检测详情注入到 session 上下文中

### Phase 6: 更新 using-horspowers 技能

**目标**: 根据 Session Start Hook 的检测结果引导用户

**步骤**:
1. 读取配置状态标记
2. 根据不同状态显示对应的引导信息
3. 使用 AskUserQuestion 获取用户选择
4. 调用相应的配置管理函数

### Phase 7: 清理过时配置

**目标**: 移除不再需要的配置和代码

**步骤**:
1. 更新 `.horspowers-config.template.yaml` 为简化版本
2. 移除 `document-driven-bridge` 技能（已内置）
3. 清理用户文档中的过时引用
4. 更新 README 中的配置示例

## 验收标准

- [x] 配置文件名称统一为 `.horspowers-config.yaml`
- [x] 配置管理模块支持版本管理（4.2.2）
- [x] 支持旧版配置检测和迁移
- [x] 支持新版配置验证和更新
- [x] 添加自动备份功能
- [x] 首次安装时自动创建默认配置文件
- [x] 升级时自动检测和更新配置文件
- [x] Session Start Hook 集成配置检测逻辑
- [x] using-horspowers 技能引导用户配置
- [x] 测试通过：新安装、升级、手动创建配置文件的场景

## 相关文档

- [Superpowers 个人开发者适配设计方案](../plans/2025-01-04-personal-superpowers-design.md)
- [lib/config-manager.js](../../lib/config-manager.js)
- [.horspowers-config.template.yaml](../../.horspowers-config.template.yaml)

## 进展记录

- 2026-01-21: 创建任务 - 待开始
- 2026-01-21: 完成 Phase 1-4 - 重写 `lib/config-manager.js` 实现完整功能
  - 支持旧版配置检测和迁移
  - 支持新版配置验证和更新
  - 添加版本管理（跟随插件版本 4.2.2）
  - 简化配置模板（移除过时的 cli_path）
  - 添加自动备份功能
  - 新增 API: `detectConfigFiles()`, `migrateOldConfig()`, `updateConfig()`, `initializeConfig()`, `validateConfig()`, `checkConfigUpdate()`
- 2026-01-21: 完成 Phase 5 - 更新 Session Start Hook 集成配置检测逻辑
  - 使用 `config-manager.js` 统一 API
  - 支持检测多种配置状态（needs-init, needs-migration, needs-update, invalid, valid）
  - 修复 `docs_enabled` 检测逻辑，支持布尔值和字符串值
- 2026-01-21: 完成 Phase 6 - 更新 using-horspowers 技能引导逻辑
  - 根据配置状态显示对应的引导信息
  - 支持初始化、迁移、更新、无效配置等场景
  - 提供清晰的 Node.js 代码示例
- 2026-01-21: 完成 Phase 7 - 清理过时配置和技能
  - 简化 `.horspowers-config.template.yaml` 模板（从 200+ 行减少到 20 行）
  - 删除 `document-driven-bridge` 技能（功能已内置）
  - 更新 README.md 中的配置文件引用和文档系统说明
  - 移除对外部 `document-driven-ai-workflow` 的依赖说明
- 2026-01-21: 完成测试 - 验证所有功能正常工作
  - 测试配置初始化（personal 模式）
  - 测试旧配置迁移（自动添加缺失字段）
  - 测试配置验证和更新检测
  - 测试 Session Start Hook 集成
- 2026-01-21: 任务完成 ✅

## 技术细节

### 新的配置管理 API

```javascript
// 文件检测
detectConfigFiles(projectDir)  // { hasOld, hasNew, hasAny, oldPath, newPath }
findConfigFile(startDir)        // { found, path, type: 'new'|'old'|null }

// 配置读取和验证
readConfig(projectDir)          // Object | null
validateConfig(config)          // { valid, errors[], warnings[] }
checkConfigUpdate(config)       // { needsUpdate, reason, missingFields[] }

// 配置操作
writeConfig(projectDir, config)         // boolean
migrateOldConfig(oldPath, projectDir)   // { success, message, oldConfig, newConfig }
updateConfig(projectDir, currentConfig) // { success, message, updatedConfig }
initializeConfig(projectDir, mode)      // { success, message, config }

// 工具函数
compareVersions(v1, v2)        // -1 | 0 | 1
getTemplate()                  // string (YAML template)
promptForInitialConfig()        // AskUserQuestion structure

// 常量
CONFIG_VERSION              // '4.2.2'
NEW_CONFIG_FILENAME         // '.horspowers-config.yaml'
OLD_CONFIG_FILENAME         // '.superpowers-config.yaml'
DEFAULT_CONFIG              // { version, development_mode, branch_strategy, testing_strategy, completion_strategy, documentation }
```

### Session Start Hook 集成方案

在 `hooks/session-start.sh` 中添加配置检测逻辑，使用 Node.js 调用 `config-manager.js`：

```bash
# 检测配置文件状态
CONFIG_STATUS=$(node -e "
const { detectConfigFiles, checkConfigUpdate, readConfig } = require('./lib/config-manager.js');
const detection = detectConfigFiles(process.cwd());

if (detection.hasOld) {
  console.log('needs-migration');
} else if (detection.hasNew) {
  const config = readConfig(process.cwd());
  const check = checkConfigUpdate(config);
  console.log(check.needsUpdate ? 'needs-update' : 'valid');
} else {
  console.log('needs-init');
}
")

# 根据状态设置标记
case "$CONFIG_STATUS" in
  needs-init)
    config_marker="<config-needs-init>true</config-needs-init>"
    ;;
  needs-migration)
    config_marker="<config-needs-migration>true</config-needs-migration>"
    ;;
  needs-update)
    config_marker="<config-needs-update>true</config-needs-update>"
    ;;
  valid)
    config_marker="<config-valid>true</config-valid>"
    ;;
esac
```
