# Facio Superpowers - 项目总结

## 项目概述

Facio Superpowers 是一个基于 obra/superpowers 的文档管理扩展，为 AI 辅助开发（Claude Code、Cursor）提供自动化文档管理能力。

## 核心功能

### 1. 自动化文档管理

- **ADR 自动生成**：在做出架构决策时自动生成架构决策记录
- **文档索引自动维护**：自动更新 docs/adr/README.md 和 docs/plans/README.md
- **上下文自动查找**：开发前自动搜索相关的 ADR 和设计文档

### 2. 工作流自动提醒

通过 CLAUDE.md 配置，AI 工具会在适当时机自动提醒：
- 开发前：提醒调用 `/prepare-context`
- 开发后：提醒调用 `/verification-before-completion`

### 3. CLI 工具

一键初始化项目：
```bash
npx @vattention/facio-superpowers init
```

## 文件结构

```
facio-superpowers/
├── cli.js                          # CLI 工具
├── package.json                    # NPM 配置
├── skills/
│   ├── prepare-context/            # 上下文准备 skill
│   └── verification-before-completion/  # 验证与文档检查 skill
├── templates/
│   ├── adr-template.md             # ADR 模板
│   ├── CLAUDE-PROJECT.md           # 项目配置模板（non-harness）
│   ├── CLAUDE-WORKFLOW.md          # 工作流指令模板
│   ├── AGENTS-PROJECT.md           # 项目 Agents 模板（harness mode）
│   ├── harness-*.md / .json / .yaml # Harness scaffold 配置
│   └── github-workflows-*.yml      # CI workflow 模板
├── README-FACIO.md                 # 使用文档
├── PUBLISH-GITHUB.md               # GitHub Packages 发布指南
└── vibe-coding-documentation-guide.md  # 完整文档指南
```

## 工作流程

### 开发者视角

```
1. 初始化项目
   cd your-project
   claude init
   npx @vattention/facio-superpowers init

2. 开始开发
   > 我想添加用户认证功能

   ⚠️ 开发前准备
   建议调用 /prepare-context

   > yes

   📚 找到相关 ADR：
   - ADR-003: JWT 认证模式

3. 完成开发
   > 功能已完成

   ⚠️ 完成前验证
   建议调用 /verification-before-completion

   > yes

   ✅ 测试通过
   📋 生成 ADR-005: 用户认证实现
   📋 更新文档索引
```

### 团队协作

1. **统一规范**：通过 CLAUDE-TEAM.md 定义团队标准
2. **知识沉淀**：所有架构决策自动记录为 ADR
3. **上下文传承**：新成员通过文档快速了解项目历史

## 技术亮点

### 1. 非侵入式设计

- 不破坏现有 CLAUDE.md
- 只注入必要的工作流指令
- 可以多次运行（幂等性）

### 2. 自动化优先

- 文档自动生成
- 索引自动维护
- 工作流自动提醒

### 3. 跨工具兼容

- Claude Code：使用 CLAUDE.md
- Cursor：使用 .cursorrules
- Skills 同时安装到 .claude/skills 和 .cursor/skills

## 与原版 Superpowers 的区别

| 功能 | 原版 | Facio 版本 |
|------|------|-----------|
| Brainstorming | ✅ | ✅ |
| Writing Plans | ✅ | ✅ |
| TDD | ✅ | ✅ |
| **自动上下文查找** | ❌ | ✅ |
| **ADR 自动生成** | ❌ | ✅ |
| **文档索引自动维护** | ❌ | ✅ |
| **工作流自动提醒** | ❌ | ✅ |
| **CLI 工具** | ❌ | ✅ |

## 发布方式

### GitHub Packages

```bash
# 发布
npm publish

# 使用
echo "@your-username:registry=https://npm.pkg.github.com" > .npmrc
npx @vattention/facio-superpowers init
```

详见：`PUBLISH-GITHUB.md`

## 文档

- **使用指南**：`README-FACIO.md`
- **发布指南**：`PUBLISH-GITHUB.md`
- **完整文档**：`vibe-coding-documentation-guide.md`

## 下一步

1. 发布到 GitHub Packages
2. 在实际项目中测试
3. 收集反馈并改进
4. 考虑添加更多自动化功能

## 致谢

基于 [obra/superpowers](https://github.com/obra/superpowers) 构建。
