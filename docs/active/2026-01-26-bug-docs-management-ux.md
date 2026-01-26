# Bug Report: 文档管理系统用户体验问题

**报告时间**: 2026-01-26
**严重程度**: Medium
**状态**: 待修复
**影响范围**: Horspowers 文档管理系统

---

## 问题描述

当使用 `horspowers:document-management` 技能时，用户期望技能能够**自动执行**文档管理操作，但实际需要**手动调用底层 Node.js 脚本**，导致体验不符合预期。

## 实际行为

```bash
# 用户期望
/docs init

# 实际需要
node -e "
const { UnifiedDocsManager } = require('/path/to/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const result = manager.init();
console.log(result.message);
"
```

## 期望行为

提供高级命令接口，自动封装底层脚本调用：

```bash
/docs init          # 初始化文档系统
/docs stats         # 查看文档统计
/docs search <key>  # 搜索文档
/docs archive <id>  # 归档文档
```

## 根本原因

**Horspowers 技能设计模式：**
- 技能 (skill.md) 提供**操作手册**
- AI 需要阅读并**手动执行**手册中的命令
- 缺少 CLI 封装层来提供用户友好的命令接口

## 受影响的技能

- `horspowers:document-management`
- 可能影响其他依赖脚本的技能

## 影响范围

1. **用户体验**: 需要手动编写复杂的 node 命令
2. **学习曲线**: 新用户需要理解内部实现细节
3. **易用性**: 不符合"技能即工具"的直觉预期

## 建议的解决方案

### 方案 1: 创建 Horspowers CLI 工具 (推荐)

创建独立的 CLI 工具封装所有操作：

```bash
# 安装
npm install -g @horspowers/cli

# 使用
horspowers docs init
horspowers docs stats
horspowers docs search user
```

**优点：**
- 专业的 CLI 工具，更好的用户体验
- 可以独立于 Claude Code 使用
- 支持 tab 补全、帮助文档等

**缺点：**
- 需要维护额外的包
- 发布流程更复杂

### 方案 2: 增强 npm scripts

在每个项目中添加 scripts：

```json
{
  "scripts": {
    "docs:init": "horspowers-docs init",
    "docs:stats": "horspowers-docs stats"
  }
}
```

**优点：**
- 实现简单
- 与现有 npm 生态集成

**缺点：**
- 需要在每个项目中配置
- 命令较长 (`npm run docs:init`)

### 方案 3: 创建 Shell 别名函数

在 `.bashrc` 或 `.zshrc` 中添加：

```bash
horspowers-docs() {
  node -e "
  const { UnifiedDocsManager } = require('$CLAUDE_PLUGIN_ROOT/lib/docs-core.js');
  const manager = new UnifiedDocsManager(process.cwd());
  const args = process.argv.slice(2);
  manager[args[0]](...args.slice(1));
  " "$@"
}
```

**优点：**
- 快速实现
- 全局可用

**缺点：**
- 依赖环境变量
- 错误处理不完善

### 方案 4: 修改技能实现方式

修改技能使其包含实际的执行逻辑，而不是仅提供手册：

```markdown
## Initialize Document System

**执行操作：**
1. 调用 docs-core.js 初始化
2. 显示结果给用户
3. 更新任务追踪文档
```

**优点：**
- 无需额外工具
- AI 自动执行

**缺点：**
- 技能文件变得更长
- 仍需要底层脚本调用

## 推荐实施计划

1. **短期** (方案 3): 创建 Shell 别名函数，快速改善体验
2. **中期** (方案 1): 开发专业的 CLI 工具
3. **长期**: 考虑将 CLI 集成到插件系统中

## 相关文件

- 技能文件: `/Users/zego/.claude/plugins/cache/horspowers-dev/horspowers/4.3.1/skills/document-management/skill.md`
- 核心模块: `lib/docs-core.js`
- 配置文件: `lib/config-manager.js`

## 复现步骤

1. 调用 `horspowers:document-management` 技能
2. 观察返回的是操作手册而非自动执行
3. 尝试按照手册手动执行 node 脚本
4. 体验不符合"技能即工具"的预期

## 额外备注

这个问题在以下场景中特别明显：
- 新用户首次使用 Horspowers
- 需要频繁执行文档管理操作
- 不熟悉 Node.js 脚本调用的用户

---

**下一步**: 在 [horspowers GitHub 仓库](https://github.com/...) 提交 Issue 或 PR
