# 统一文档系统设计方案

**创建时间**: 2025-01-19
**状态**: 设计评审中
**优先级**: 高

## 一、问题分析

### 1.1 当前两套文档系统

**horspowers 原有系统：**
```
docs/
└── plans/
    ├── YYYY-MM-DD-<topic>-design.md        # brainstorming 生成的设计文档
    └── YYYY-MM-DD-<feature-name>.md        # writing-plans 生成的计划文档
```

**document-driven-ai-workflow 系统：**
```
.docs/
├── active/         # 活跃文档
│   ├── YYYY-MM-DD-task-<slug>.md
│   ├── YYYY-MM-DD-bug-<slug>.md
│   ├── YYYY-MM-DD-decision-<slug>.md
│   └── YYYY-MM-DD-context-<slug>.md
├── archive/        # 已归档文档
└── context/        # 项目上下文文档
```

### 1.2 冲突点分析

| 维度 | horspowers | document-driven | 冲突 |
|------|------------|-----------------|------|
| **根目录** | `docs/` | `.docs/` | 两个不同目录 |
| **命名格式** | `-design.md` / 无后缀 | `-task-` / `-bug-` / `-decision-` | 类型标识方式不同 |
| **文档用途** | 设计/计划 | 任务/缺陷/决策/上下文 | 分类体系不同 |
| **状态跟踪** | 无 | 有（status/progress） | 功能差异 |
| **归档机制** | 无 | 有（archive） | 功能差异 |

### 1.3 融合目标

1. **统一目录结构** - 合并 `docs/` 和 `.docs/` 为单一体系
2. **保留现有功能** - 不破坏现有 `docs/plans/` 的使用
3. **引入状态跟踪** - 为文档添加状态管理能力
4. **统一命名规范** - 兼容现有命名，同时支持新类型
5. **无缝迁移** - 现有用户无需手动迁移

---

## 二、统一文档架构设计

### 2.1 统一后的目录结构

```
docs/                              # 统一文档根目录（可见，非隐藏）
├── plans/                         # 设计和计划文档（保持兼容）
│   ├── YYYY-MM-DD-<topic>-design.md
│   └── YYYY-MM-DD-<feature-name>.md
│
├── active/                        # 活跃的状态跟踪文档（新增）
│   ├── YYYY-MM-DD-task-<slug>.md
│   ├── YYYY-MM-DD-bug-<slug>.md
│   ├── YYYY-MM-DD-decision-<slug>.md
│   └── YYYY-MM-DD-context-<slug>.md
│
├── archive/                       # 已归档文档（新增）
│   └── [归档的 active 文档]
│
├── context/                       # 项目上下文（新增）
│   └── YYYY-MM-DD-context-<slug>.md
│
└── .docs-metadata/                # 文档元数据（内部使用）
    └── index.json                 # 文档索引和关联关系
```

### 2.2 设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                    文档类型定位                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  docs/plans/          docs/active/                          │
│  ├─ design.md         ├─ task.md        ─────┐              │
│  └─ plan.md           ├─ bug.md             │              │
│    (静态内容)          ├─ decision.md  ─────┼──> 互相关联    │
│                       └─ context.md   └────┘              │
│                         (状态跟踪)                          │
│                                                              │
│  plans 文档：    一次创建，很少修改，存档参考                │
│  active 文档：  持续更新，状态跟踪，完成后归档                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**核心概念：**

1. **plans/** - "写完即存"的文档
   - 设计文档（brainstorming 生成）
   - 计划文档（writing-plans 生成）
   - 特点：一次性写入，之后很少修改

2. **active/** - "持续跟踪"的文档
   - 任务文档（task）
   - Bug 文档（bug）
   - 决策文档（decision）
   - 上下文文档（context）
   - 特点：持续更新状态和进展，完成后归档

3. **关联机制** - active 文档可以引用 plans 文档
   ```markdown
   ## 相关文档
   - 设计文档: docs/plans/2025-01-19-feature-design.md
   - 计划文档: docs/plans/2025-01-19-feature.md
   ```

---

## 三、核心模块设计

### 3.1 `lib/docs-core.js` - 统一文档管理核心

```javascript
/**
 * 统一文档管理系统
 * 整合 horspowers 原有文档逻辑和 document-driven-ai-workflow 功能
 */

const fs = require('fs');
const path = require('path');

class UnifiedDocsManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.docsRoot = path.join(projectRoot, 'docs');

        // 子目录
        this.plansDir = path.join(this.docsRoot, 'plans');
        this.activeDir = path.join(this.docsRoot, 'active');
        this.archiveDir = path.join(this.docsRoot, 'archive');
        this.contextDir = path.join(this.docsRoot, 'context');
        this.metadataDir = path.join(this.docsRoot, '.docs-metadata');

        // 初始化目录结构
        this.ensureDirectories();
    }

    /**
     * 确保目录结构存在
     */
    ensureDirectories() {
        const dirs = [
            this.docsRoot,
            this.plansDir,
            this.activeDir,
            this.archiveDir,
            this.contextDir,
            this.metadataDir
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 检查是否已初始化
     */
    isInitialized() {
        return fs.existsSync(this.docsRoot);
    }

    /**
     * 初始化文档系统
     */
    init() {
        if (this.isInitialized()) {
            return { success: false, message: '文档目录已存在' };
        }

        this.ensureDirectories();

        // 创建索引文件
        this.updateIndex();

        return { success: true, message: '文档系统初始化完成' };
    }

    // ========== Plans 文档操作（原有逻辑） ==========

    /**
     * 创建设计文档（brainstorming 使用）
     * 保持原有格式：YYYY-MM-DD-<topic>-design.md
     */
    createDesignDocument(topic, content) {
        const date = new Date().toISOString().slice(0, 10);
        const slug = this.generateSlug(topic);
        const filename = `${date}-${slug}-design.md`;
        const filepath = path.join(this.plansDir, filename);

        if (fs.existsSync(filepath)) {
            return { success: false, error: '设计文档已存在' };
        }

        const designContent = content || this.getDesignTemplate(topic);
        fs.writeFileSync(filepath, designContent, 'utf8');

        this.updateIndex({ type: 'design', file: filename, topic });
        return { success: true, path: filepath, filename };
    }

    /**
     * 创建计划文档（writing-plans 使用）
     * 保持原有格式：YYYY-MM-DD-<feature-name>.md
     */
    createPlanDocument(featureName, content) {
        const date = new Date().toISOString().slice(0, 10);
        const slug = this.generateSlug(featureName);
        const filename = `${date}-${slug}.md`;
        const filepath = path.join(this.plansDir, filename);

        if (fs.existsSync(filepath)) {
            return { success: false, error: '计划文档已存在' };
        }

        const planContent = content || this.getPlanTemplate(featureName);
        fs.writeFileSync(filepath, planContent, 'utf8');

        this.updateIndex({ type: 'plan', file: filename, feature: featureName });
        return { success: true, path: filepath, filename };
    }

    // ========== Active 文档操作（状态跟踪） ==========

    /**
     * 创建活跃文档（task/bug/decision/context）
     * 新格式：YYYY-MM-DD-<type>-<slug>.md
     */
    createActiveDocument(type, title, content = null, relatedDocs = {}) {
        const validTypes = ['task', 'bug', 'decision', 'context'];
        if (!validTypes.includes(type)) {
            return { success: false, error: `无效类型: ${type}` };
        }

        const date = new Date().toISOString().slice(0, 10);
        const slug = this.generateSlug(title);
        const filename = `${date}-${type}-${slug}.md`;
        const filepath = path.join(this.activeDir, filename);

        if (fs.existsSync(filepath)) {
            return { success: false, error: '文档已存在' };
        }

        const template = content || this.getActiveTemplate(type, title, relatedDocs);
        fs.writeFileSync(filepath, template, 'utf8');

        this.updateIndex({ type, file: filename, title, relatedDocs });
        return { success: true, path: filepath, filename };
    }

    /**
     * 更新活跃文档的状态和进展
     */
    updateActiveDocument(docPath, updates) {
        const filepath = this.resolveActiveDocPath(docPath);
        if (!fs.existsSync(filepath)) {
            return { success: false, error: '文档不存在' };
        }

        let content = fs.readFileSync(filepath, 'utf8');

        if (updates.status) {
            content = this.updateStatusField(content, updates.status);
        }

        if (updates.progress) {
            content = this.updateProgressField(content, updates.progress);
        }

        fs.writeFileSync(filepath, content, 'utf8');
        return { success: true };
    }

    /**
     * 归档活跃文档
     */
    archiveDocument(docPath) {
        const filepath = this.resolveActiveDocPath(docPath);
        if (!fs.existsSync(filepath)) {
            return { success: false, error: '文档不存在' };
        }

        const filename = path.basename(filepath);
        const archivePath = path.join(this.archiveDir, filename);

        fs.renameSync(filepath, archivePath);

        this.updateIndex({ file: filename, archived: true });
        return { success: true, archivedPath: archivePath };
    }

    /**
     * 归档所有已完成的文档
     */
    archiveCompleted() {
        const files = fs.readdirSync(this.activeDir).filter(f => f.endsWith('.md'));
        let archivedCount = 0;

        files.forEach(file => {
            const filepath = path.join(this.activeDir, file);
            const content = fs.readFileSync(filepath, 'utf8');

            // 检查状态是否为已完成/已修复
            if (content.match(/- 状态[：:]\s*(已完成|已修复|completed|fixed)/i)) {
                const archivePath = path.join(this.archiveDir, file);
                fs.renameSync(filepath, archivePath);
                archivedCount++;
            }
        });

        return { success: true, count: archivedCount };
    }

    // ========== 查询操作 ==========

    /**
     * 搜索文档（支持 plans 和 active）
     */
    search(keyword, options = {}) {
        const searchDirs = [this.plansDir, this.activeDir, this.contextDir];
        let results = [];

        searchDirs.forEach(dir => {
            if (!fs.existsSync(dir)) return;

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
            files.forEach(file => {
                const filepath = path.join(dir, file);
                const content = fs.readFileSync(filepath, 'utf8');

                if (content.toLowerCase().includes(keyword.toLowerCase())) {
                    results.push({
                        file: path.relative(this.docsRoot, filepath),
                        fullpath: filepath,
                        matches: this.countMatches(content, keyword),
                        type: this.extractDocType(file)
                    });
                }
            });
        });

        return results.sort((a, b) => b.matches - a.matches);
    }

    /**
     * 获取文档状态统计
     */
    getStats() {
        const activeFiles = this.getActiveFiles();
        const planFiles = this.getPlanFiles();

        return {
            plans: {
                designs: planFiles.filter(f => f.includes('-design.md')).length,
                total: planFiles.length
            },
            active: {
                tasks: activeFiles.filter(f => f.includes('task-')).length,
                bugs: activeFiles.filter(f => f.includes('bug-')).length,
                decisions: activeFiles.filter(f => f.includes('decision-')).length,
                contexts: activeFiles.filter(f => f.includes('context-')).length,
                total: activeFiles.length
            },
            archived: fs.existsSync(this.archiveDir) ?
                fs.readdirSync(this.archiveDir).filter(f => f.endsWith('.md')).length : 0
        };
    }

    /**
     * 获取最近文档
     */
    getRecent(days = 7, type = null) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const allFiles = [...this.getActiveFiles(), ...this.getPlanFiles()];

        return allFiles.filter(file => {
            const match = file.match(/(\d{4}-\d{2}-\d{2})/);
            if (!match) return false;
            const fileDate = new Date(match[1]).getTime();
            return fileDate >= cutoff && (!type || file.includes(type));
        });
    }

    // ========== 辅助方法 ==========

    getActiveFiles() {
        if (!fs.existsSync(this.activeDir)) return [];
        return fs.readdirSync(this.activeDir).filter(f => f.endsWith('.md'));
    }

    getPlanFiles() {
        if (!fs.existsSync(this.plansDir)) return [];
        return fs.readdirSync(this.plansDir).filter(f => f.endsWith('.md'));
    }

    resolveActiveDocPath(docPath) {
        if (path.isAbsolute(docPath)) return docPath;
        if (fs.existsSync(docPath)) return path.resolve(docPath);
        return path.join(this.activeDir, docPath);
    }

    extractDocType(filename) {
        if (filename.includes('-design.md')) return 'design';
        if (filename.includes('task-')) return 'task';
        if (filename.includes('bug-')) return 'bug';
        if (filename.includes('decision-')) return 'decision';
        if (filename.includes('context-')) return 'context';
        if (filename.includes('-design.md')) return 'design';
        if (!filename.includes('-') || filename.match(/^\d{4}-\d{2}-\d{2}-[^-]+\.md$/)) return 'plan';
        return 'unknown';
    }

    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 保留中文
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    countMatches(content, keyword) {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = content.match(regex);
        return matches ? matches.length : 0;
    }

    updateStatusField(content, newStatus) {
        const statusLine = `- 状态: ${newStatus}`;
        if (content.includes('- 状态:')) {
            return content.replace(/- 状态[：:].+/, statusLine);
        }
        return content;
    }

    updateProgressField(content, newProgress) {
        const timestamp = new Date().toISOString().slice(0, 10);
        const progressLine = `- ${timestamp}: ${newProgress}`;

        if (content.includes('## 进展记录')) {
            const progressMatch = content.match(/## 进展记录\n([\s\S]*?)(?=\n##|\Z)/);
            if (progressMatch) {
                const progress = progressMatch[1] + `\n${progressLine}`;
                return content.replace(progressMatch[0], `## 进展记录\n${progress}`);
            }
        }
        return content;
    }

    updateIndex(metadata) {
        const indexPath = path.join(this.metadataDir, 'index.json');

        let index = {};
        if (fs.existsSync(indexPath)) {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        if (metadata.file) {
            index[metadata.file] = {
                ...index[metadata.file],
                ...metadata,
                updatedAt: new Date().toISOString()
            };
        }

        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
    }

    // ========== 模板方法 ==========

    getDesignTemplate(topic) {
        return `# ${topic} 设计文档

**日期**: ${new Date().toISOString().slice(0, 10)}

## 需求概述

[描述需要解决的问题和用户需求]

## 设计方案

[详细的设计方案，包括架构、组件、数据流等]

## 实施要点

[关键实施要点和注意事项]

## 相关文档

- [相关计划文档](./YYYY-MM-DD-<feature>.md)
`;
    }

    getPlanTemplate(featureName) {
        return `# ${featureName} 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: ${new Date().toISOString().slice(0, 10)}

## 目标

[一句话描述这个计划要实现什么]

## 架构方案

[2-3 句话说明实现方法]

## 技术栈

[关键技术/库]

## 任务分解

### Task 1: [任务名称]

**文件:**
- Create: \`path/to/file.ext\`
- Test: \`tests/path/to/test.ext\`

**步骤:**
1. [具体步骤]
2. [具体步骤]

...
`;
    }

    getActiveTemplate(type, title, relatedDocs = {}) {
        const date = new Date().toISOString().slice(0, 10);
        const templates = {
            task: `# 任务: ${title}

## 基本信息
- 创建时间: ${date}
- 负责人: [待指定]
- 优先级: [高/中/低]

## 任务描述
[详细描述任务目标和要求]

${relatedDocs.plan ? `## 相关文档\n- 计划文档: [../plans/${relatedDocs.plan}](../plans/${relatedDocs.plan})\n` : ''}
${relatedDocs.design ? `- 设计文档: [../plans/${relatedDocs.design}](../plans/${relatedDocs.design})\n` : ''}

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
`,

            bug: `# Bug报告: ${title}

## 基本信息
- 发现时间: ${date}
- 严重程度: [严重/一般/轻微]
- 影响范围: [描述影响的功能模块]

## 问题描述
[详细描述问题的现象和复现步骤]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 期望结果
[描述期望的正确行为]

## 实际结果
[描述实际发生的问题]

## 分析过程
[问题分析和调试过程]

## 解决方案
[描述修复方案]

## 验证结果
[修复后的验证情况]
`,

            decision: `# 技术决策: ${title}

## 决策信息
- 决策时间: ${date}
- 决策者: [待指定]
- 影响范围: [描述影响范围]

${relatedDocs.design ? `## 相关文档\n- 设计文档: [../plans/${relatedDocs.design}](../plans/${relatedDocs.design})\n` : ''}

## 决策背景
[描述需要做出决策的背景和原因]

## 可选方案
### 方案A
- 描述: [方案描述]
- 优点: [优点列表]
- 缺点: [缺点列表]

### 方案B
- 描述: [方案描述]
- 优点: [优点列表]
- 缺点: [缺点列表]

## 最终决策
**选择**: [选择的方案]
**理由**: [详细说明选择理由]

## 实施计划
1. [实施步骤1]
2. [实施步骤2]
3. [实施步骤3]

## 结果评估
[决策实施后的效果评估]
`,

            context: `# 项目上下文: ${title}

## 基本信息
- 创建时间: ${date}
- 更新时间: ${date}
- 维护者: [待指定]

## 概述
[项目/模块的总体描述]

## 技术栈
- 前端: [技术列表]
- 后端: [技术列表]
- 数据库: [数据库列表]
- 工具: [工具列表]

## 架构设计
[描述系统架构和设计理念]

## 开发规范
- 代码风格: [描述代码规范]
- 命名约定: [命名规则]
- 文档要求: [文档编写规范]

## 相关资源
- [相关文档链接]
- [外部资源链接]
- [参考资料]

## 更新历史
- ${date}: 创建文档
`
        };

        return templates[type] || `# ${title}\n\n请在此处添加内容...`;
    }
}

module.exports = { UnifiedDocsManager };
```

---

## 四、技能集成设计

### 4.1 更新后的 `brainstorming/SKILL.md`

```markdown
## After the Design

**Documentation:**

1. **Create design document** (保持原有逻辑):
   - Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
   - Use elements-of-style:writing-clearly-and-concisely skill if available

2. **Create decision tracking document** (新增，如果启用):
   IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:

     Use horspowers:document-management
     Run `$DOCS_CREATE decision "<decision-title>"` with related plan document

     This creates a status-trackable decision document in `docs/active/`

3. **Commit and inform**:
   - Commit the design document to git
   - Tell user: "设计已保存到文档。你可以通过编辑文档来调整设计，完成后说'继续'或'ready'进入实施阶段。"
```

### 4.2 更新后的 `writing-plans/SKILL.md`

```markdown
## Execution Handoff

**Documentation:**

1. **Create plan document** (保持原有逻辑):
   - Save plan to `docs/plans/YYYY-MM-DD-<feature-name>.md`

2. **Create task tracking document** (新增，如果启用):
   IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:

     Use horspowers:document-management

     **Search related tasks:**
     Run `$DOCS_SEARCH "similar features"` to avoid duplication

     **Create task document:**
     Run `$DOCS_CREATE task "Implement: [feature-name]" --related-plan="<plan-filename>"`

     Store the returned document path as `$TASK_DOC` for progress tracking.

3. **Offer execution choice:**
   "**计划已完成并保存到 `docs/plans/<filename>.md`。同时创建了任务跟踪文档。两种执行方式："
```

---

## 五、配置文件设计

### `.superpowers-config.yaml`

```yaml
# Horspowers 项目配置
version: "1.0"

# 开发模式: personal | team
development_mode: personal

# 完成策略: merge | pr | keep
completion_strategy: merge

# 文档管理功能
documentation:
  # 是否启用状态跟踪功能
  enabled: true

  # 是否自动初始化文档目录
  auto_init: true

  # 文档行为配置
  behavior:
    # brainstorming 完成后是否自动创建 decision 文档
    create_decision_after_design: true

    # writing-plans 完成后是否自动创建 task 文档
    create_task_after_plan: true

    # 测试失败时是否自动创建 bug 文档
    create_bug_on_test_failure: true

    # 任务完成时是否自动归档
    auto_archive_on_complete: true

  # 归档设置
  archive:
    # 保留最近 N 天的活跃文档
    keep_recent_days: 30
    # 归档位置（默认 docs/archive/）
    directory: "archive"
```

---

## 六、迁移路径

### 6.1 从旧系统迁移

对于使用 `document-driven-bridge` 的用户：

```bash
# 迁移脚本
docs:migrate

# 自动执行：
1. 将 .docs/active/* 移动到 docs/active/
2. 将 .docs/context/* 移动到 docs/context/
3. 将 .docs/archive/* 移动到 docs/archive/
4. 删除空的 .docs/ 目录
5. 更新配置文件
```

### 6.2 向后兼容

- 保留 `docs/plans/` 路径的创建逻辑
- 保留原有的 `-design.md` 和无后缀命名格式
- 新功能通过 `documentation.enabled` 控制，默认开启

---

## 七、实施路线图

### Phase 1: 核心基础设施

- [ ] 创建 `lib/docs-core.js`（约600行）
- [ ] 创建 `docs/plans/` 到 `docs/active/` 的关联逻辑
- [ ] 编写单元测试

### Phase 2: 更新现有技能

- [ ] 更新 `brainstorming/SKILL.md`（添加 decision 文档创建）
- [ ] 更新 `writing-plans/SKILL.md`（添加 task 文档创建）
- [ ] 更新 `test-driven-development/SKILL.md`（添加 bug 文档）
- [ ] 更新 `finishing-a-development-branch/SKILL.md`（添加归档）

### Phase 3: 新增技能和命令

- [ ] 创建 `skills/document-management/SKILL.md`
- [ ] 创建 `/docs:*` 用户命令

### Phase 4: 文档和迁移

- [ ] 编写使用文档
- [ ] 编写迁移指南
- [ ] 标记 `document-driven-bridge` 为 deprecated

---

## 八、对比：融合前后

| 特性 | 融合前 | 融合后 |
|------|--------|--------|
| **文档目录** | `docs/plans/` + `.docs/` | `docs/` 统一 |
| **命名规范** | 两套不同命名 | 兼容现有，支持新类型 |
| **状态跟踪** | 无 | 有（active 文档） |
| **文档关联** | 无 | 有（relatedDocs） |
| **归档功能** | 无 | 有 |
| **搜索功能** | 无 | 统一搜索 |
| **迁移成本** | N/A | 低（向后兼容） |

---

## 九、示例工作流

### 示例 1: 从设计到实现

```
1. brainstorming
   ↓
   创建: docs/plans/2025-01-19-user-auth-design.md
   创建: docs/active/2025-01-19-decision-auth-method.md

2. writing-plans
   ↓
   创建: docs/plans/2025-01-19-user-auth.md
   创建: docs/active/2025-01-19-task-user-auth.md
   (关联设计文档)

3. subagent-driven-development
   ↓
   更新: docs/active/2025-01-19-task-user-auth.md
   (持续更新进展)

4. finishing-a-development-branch
   ↓
   归档: docs/archive/2025-01-19-task-user-auth.md
```

---

## 十、文档迁移检测和提示功能

### 10.1 功能概述

在启用文档管理系统时，自动检测项目中可能存在的其他文档目录，并询问用户是否需要将文档迁移到统一的 `docs/` 目录结构中进行集中管理。

### 10.2 检测逻辑

#### 检测的文档目录模式

```javascript
// 在 lib/docs-core.js 中添加
const DOC_DIR_PATTERNS = [
    'docs',       // 常见文档目录
    'doc',        // 单数形式
    'document',   // 完整拼写
    '.docs',      // 隐藏目录（旧系统）
    '.doc',       // 隐藏目录
    'documentation' // 完整拼写
];

const DOC_SUBDIR_PATTERNS = [
    'plans',
    'active',
    'archive',
    'context',
    'guides',
    'api',
    'design',
    'specifications'
];
```

#### 检测流程

```
Session Start
     ↓
检测文档目录
     ↓
┌────────────────┐
│ 发现多个目录？  │
└────────────────┘
     ↓ 是
分析文档内容
     ↓
生成迁移建议
     ↓
注入提示到会话上下文
     ↓
用户首次回复时显示提示
```

### 10.3 Session Start Hook 修改

#### `hooks/session-start.sh` 添加文档检测

```bash
# 在现有配置检测后添加文档目录检测
doc_detection_output=""

# 检测文档目录
doc_dirs_found=()
for pattern in docs doc document .docs .doc documentation; do
    if [ -d "$PWD/$pattern" ]; then
        doc_dirs_found+=("$pattern")
    fi
done

# 如果发现多个文档目录，进行详细分析
if [ ${#doc_dirs_found[@]} -gt 1 ]; then
    # 调用 Node.js 脚本分析
    doc_detection_output=$(node -e "
    const fs = require('fs');
    const path = require('path');

    const docDirs = ${doc_dirs_found[@]}; // 传入发现的目录列表
    const analysis = [];

    docDirs.forEach(dir => {
        const dirPath = process.cwd() + '/' + dir;
        const stats = {
            name: dir,
            files: 0,
            subdirs: []
        };

        try {
            const items = fs.readdirSync(dirPath);
            items.forEach(item => {
                const itemPath = path.join(dirPath, item);
                if (fs.statSync(itemPath).isFile() && item.endsWith('.md')) {
                    stats.files++;
                } else if (fs.statSync(itemPath).isDirectory()) {
                    stats.subdirs.push(item);
                }
            });
            analysis.push(stats);
        } catch (e) {
            // ignore errors
        }
    });

    console.log(JSON.stringify(analysis));
    " 2>&1)

    # 构建提示消息
    doc_migration_notice="

<doc-migration-detected>
检测到项目中存在多个文档目录：${doc_dirs_found[@]}
建议迁移到统一的 docs/ 目录结构以便管理。
运行 /docs:analyze 查看详细分析，或 /docs:migrate 开始迁移。
</doc-migration-detected>"
fi
```

### 10.4 核心迁移模块

#### `lib/docs-core.js` 添加迁移相关方法

```javascript
class UnifiedDocsManager {
    // ... 现有方法 ...

    /**
     * 检测项目中的文档目录
     */
    detectDocDirectories() {
        const patterns = ['docs', 'doc', 'document', '.docs', '.doc', 'documentation'];
        const found = [];

        patterns.forEach(pattern => {
            const dirPath = path.join(this.projectRoot, pattern);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                const stats = this.analyzeDocDirectory(dirPath);
                found.push({
                    path: pattern,
                    fullPath: dirPath,
                    ...stats
                });
            }
        });

        return found;
    }

    /**
     * 分析文档目录内容
     */
    analyzeDocDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);
        const stats = {
            files: 0,
            subdirs: [],
            fileTypes: {}
        };

        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            try {
                const stat = fs.statSync(itemPath);

                if (stat.isFile() && item.endsWith('.md')) {
                    stats.files++;
                    // 分析文件类型
                    const type = this.classifyDocument(itemPath);
                    stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
                } else if (stat.isDirectory()) {
                    stats.subdirs.push(item);
                }
            } catch (e) {
                // ignore permission errors
            }
        });

        return stats;
    }

    /**
     * 分类文档类型
     */
    classifyDocument(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // 根据文件名判断
        if (filename.includes('design') || filename.includes('-design.md')) return 'design';
        if (filename.includes('task') || filename.includes('-task-')) return 'task';
        if (filename.includes('bug') || filename.includes('-bug-')) return 'bug';
        if (filename.includes('decision') || filename.includes('-decision-')) return 'decision';

        // 根据内容判断
        if (content.includes('# 技术决策') || content.includes('# Decision')) return 'decision';
        if (content.includes('# Bug报告') || content.includes('# Bug')) return 'bug';
        if (content.includes('# 任务') || content.includes('# Task')) return 'task';
        if (content.includes('# 设计') || content.includes('# Design')) return 'design';

        return 'unknown';
    }

    /**
     * 生成迁移计划
     */
    generateMigrationPlan() {
        const detectedDirs = this.detectDocDirectories();

        if (detectedDirs.length <= 1) {
            return { needsMigration: false, reason: '只发现一个文档目录或无文档目录' };
        }

        const plan = {
            needsMigration: true,
            sourceDirs: [],
            targetStructure: {}
        };

        // 分析每个目录
        detectedDirs.forEach(dir => {
            // 跳过已经统一的 docs/ 目录
            if (dir.path === 'docs' && dir.subdirs.includes('plans')) {
                return;
            }

            const dirPlan = {
                from: dir.path,
                actions: []
            };

            // 分析子目录
            dir.subdirs.forEach(subdir => {
                const subPath = path.join(dir.fullPath, subdir);
                const subStats = this.analyzeDocDirectory(subPath);

                // 确定目标位置
                let targetSubdir;
                if (subdir === 'plans' || subdir === 'design') {
                    targetSubdir = 'plans';
                } else if (subdir === 'active' || subdir === 'tasks') {
                    targetSubdir = 'active';
                } else if (subdir === 'archive') {
                    targetSubdir = 'archive';
                } else if (subdir === 'context') {
                    targetSubdir = 'context';
                } else {
                    targetSubdir = 'active'; // 默认位置
                }

                dirPlan.actions.push({
                    from: path.join(dir.path, subdir),
                    to: targetSubdir,
                    fileCount: subStats.files
                });
            });

            // 分析根目录的文件
            if (dir.files > 0) {
                dirPlan.actions.push({
                    from: dir.path,
                    to: 'plans',
                    fileCount: dir.files
                });
            }

            if (dirPlan.actions.length > 0) {
                plan.sourceDirs.push(dirPlan);
            }
        });

        return plan;
    }

    /**
     * 执行迁移
     */
    executeMigration(plan, options = {}) {
        const results = {
            success: true,
            migrated: [],
            errors: [],
            skipped: []
        };

        const dryRun = options.dryRun || false;

        plan.sourceDirs.forEach(dirPlan => {
            dirPlan.actions.forEach(action => {
                try {
                    const sourcePath = path.join(this.projectRoot, action.from);
                    const targetPath = path.join(this.docsRoot, action.to);

                    if (dryRun) {
                        results.migrated.push({
                            from: action.from,
                            to: `docs/${action.to}`,
                            count: action.fileCount,
                            dryRun: true
                        });
                        return;
                    }

                    // 创建目标目录
                    if (!fs.existsSync(targetPath)) {
                        fs.mkdirSync(targetPath, { recursive: true });
                    }

                    // 移动文件
                    const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.md'));
                    files.forEach(file => {
                        const srcFile = path.join(sourcePath, file);
                        const destFile = path.join(targetPath, file);

                        // 检查目标是否已存在
                        if (fs.existsSync(destFile)) {
                            results.skipped.push({
                                file: file,
                                reason: '目标文件已存在'
                            });
                        } else {
                            fs.renameSync(srcFile, destFile);
                        }
                    });

                    results.migrated.push({
                        from: action.from,
                        to: `docs/${action.to}`,
                        count: files.length
                    });

                    // 尝试删除空目录
                    try {
                        if (fs.readdirSync(sourcePath).length === 0) {
                            fs.rmdirSync(sourcePath);
                        }
                    } catch (e) {
                        // ignore
                    }

                } catch (error) {
                    results.errors.push({
                        action: action,
                        error: error.message
                    });
                    results.success = false;
                }
            });
        });

        // 清理空根目录
        if (!dryRun) {
            this.cleanupEmptyDirs(plan.sourceDirs.map(d => d.from));
        }

        return results;
    }

    /**
     * 清理空目录
     */
    cleanupEmptyDirs(dirs) {
        dirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            try {
                if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
                    fs.rmdirSync(dirPath);
                }
            } catch (e) {
                // ignore
            }
        });
    }

    /**
     * 验证迁移结果
     */
    validateMigration(beforePlan) {
        const afterAnalysis = this.detectDocDirectories();
        const validation = {
            success: true,
            remainingDocs: 0,
            issues: []
        };

        // 检查是否还有分散的文档目录
        afterAnalysis.forEach(dir => {
            if (dir.path !== 'docs' && dir.files > 0) {
                validation.remainingDocs += dir.files;
                validation.issues.push(`${dir.path}/ 仍有 ${dir.files} 个文档文件`);
            }
        });

        if (validation.remainingDocs > 0) {
            validation.success = false;
        }

        return validation;
    }
}
```

### 10.5 用户命令设计

#### `commands/docs/analyze.md`

```yaml
---
description: Analyze project documentation directories and generate migration plan
---

Use horspowers:document-management to analyze the project's documentation structure.

The analysis will:
1. Detect all documentation directories (docs/, doc/, .docs/, etc.)
2. Count files in each directory
3. Classify document types (designs, plans, tasks, bugs, decisions)
4. Generate a migration plan to consolidate into docs/

Example output:
```
检测到以下文档目录：

docs/
├── plans/          12 files (designs, plans)
└── (empty)

.docs/
├── active/         5 files (tasks, bugs)
└── context/        2 files (contexts)

建议迁移：
- .docs/active/* → docs/active/
- .docs/context/* → docs/context/

运行 /docs:migrate 开始迁移
```
```

#### `commands/docs/migrate.md`

```yaml
---
description: Migrate documentation to unified docs/ directory structure
---

Use horspowers:document-management to execute the migration plan.

Options:
- `--dry-run` - Preview changes without executing
- `--confirm` - Skip confirmation prompt

Example:
```
/docs:migrate
/docs:migrate --dry-run
/docs:migrate --confirm
```

The migration will:
1. Create unified docs/ structure (plans/, active/, archive/, context/)
2. Move documents to appropriate subdirectories
3. Remove empty source directories
4. Generate migration report
```

### 10.6 提示消息设计

#### Session Start 中的提示

```markdown
<doc-migration-suggestion>
📋 文档目录整理建议

检测到项目中存在多个文档目录：
- `docs/` (12 个文件)
- `.docs/` (7 个文件)

建议迁移到统一的目录结构：
```
docs/
├── plans/     # 设计和计划文档
├── active/    # 任务、Bug、决策跟踪
├── archive/   # 已完成的文档
└── context/   # 项目上下文
```

**选项：**
1. 运行 `/docs:analyze` 查看详细分析
2. 运行 `/docs:migrate --dry-run` 预览迁移
3. 运行 `/docs:migrate` 开始迁移
4. 暂时跳过（下次会话仍会提示）
</doc-migration-suggestion>
```

### 10.7 迁移策略矩阵

| 源目录 | 源子目录 | 目标位置 | 文档类型判断 |
|--------|----------|----------|--------------|
| `.docs/` | `active/` | `docs/active/` | task, bug, decision |
| `.docs/` | `context/` | `docs/context/` | context |
| `.docs/` | `archive/` | `docs/archive/` | 任何类型 |
| `docs/` | `plans/` | `docs/plans/` | design, plan |
| `doc/` | * | `docs/plans/` | 按内容判断 |
| `document/` | * | `docs/plans/` | 按内容判断 |
| `documentation/` | * | `docs/plans/` | 按内容判断 |

### 10.8 智能分类规则

```javascript
// 文档分类优先级
const CLASSIFICATION_RULES = [
    // 1. 按文件名精确匹配
    { pattern: /-design\.md$/, type: 'design', target: 'plans' },
    { pattern: /-task-/, type: 'task', target: 'active' },
    { pattern: /-bug-/, type: 'bug', target: 'active' },
    { pattern: /-decision-/, type: 'decision', target: 'active' },
    { pattern: /-context-/, type: 'context', target: 'context' },

    // 2. 按文件名模糊匹配
    { pattern: /design|设计/, type: 'design', target: 'plans' },
    { pattern: /plan|计划/, type: 'plan', target: 'plans' },
    { pattern: /task|任务/, type: 'task', target: 'active' },
    { pattern: /bug|缺陷/, type: 'bug', target: 'active' },
    { pattern: /decision|决策/, type: 'decision', target: 'active' },
    { pattern: /context|上下文/, type: 'context', target: 'context' },

    // 3. 按内容标题匹配
    { pattern: /^# (技术决策|决策)/m, type: 'decision', target: 'active' },
    { pattern: /^# (Bug报告|Bug)/m, type: 'bug', target: 'active' },
    { pattern: /^# (任务|Task)/m, type: 'task', target: 'active' },
    { pattern: /^# (设计|Design)/m, type: 'design', target: 'plans' },

    // 4. 默认归类
    { pattern: /./, type: 'unknown', target: 'plans' }
];
```

### 10.9 迁移示例

#### 场景 1: 从 `.docs/` 迁移到 `docs/`

```bash
# 迁移前
.docs/
├── active/
│   ├── 2025-01-19-task-auth.md
│   └── 2025-01-19-bug-login.md
└── context/
    └── 2025-01-19-context-architecture.md

# 执行迁移
/docs:migrate

# 迁移后
docs/
├── active/
│   ├── 2025-01-19-task-auth.md
│   └── 2025-01-19-bug-login.md
└── context/
    └── 2025-01-19-context-architecture.md

# .docs/ 目录被自动删除（如果为空）
```

#### 场景 2: 合并 `doc/` 和 `docs/`

```bash
# 迁移前
docs/
└── plans/
    └── 2025-01-19-feature-design.md

doc/
├── user-guide.md
└── api-reference.md

# 执行迁移
/docs:migrate

# 迁移后
docs/
├── plans/
│   └── 2025-01-19-feature-design.md
└── active/  # 或按内容判断放适当位置
    ├── user-guide.md
    └── api-reference.md

# doc/ 目录被自动删除（如果为空）
```

---

## 十一、实施路线图更新

### Phase 1: 核心基础设施

- [ ] 创建 `lib/docs-core.js`（约800行，包含迁移功能）
- [ ] 创建 `docs/plans/` 到 `docs/active/` 的关联逻辑
- [ ] 实现文档目录检测功能
- [ ] 实现智能文档分类
- [ ] 编写单元测试

### Phase 2: Session Start 集成

- [ ] 修改 `hooks/session-start.sh` 添加文档检测
- [ ] 实现检测结果的上下文注入
- [ ] 测试多文档目录场景

### Phase 3: 更新现有技能

- [ ] 更新 `brainstorming/SKILL.md`
- [ ] 更新 `writing-plans/SKILL.md`
- [ ] 更新 `test-driven-development/SKILL.md`
- [ ] 更新 `finishing-a-development-branch/SKILL.md`

### Phase 4: 新增技能和命令

- [ ] 创建 `skills/document-management/SKILL.md`
- [ ] 创建 `/docs:init` 命令
- [ ] 创建 `/docs:analyze` 命令
- [ ] 创建 `/docs:migrate` 命令
- [ ] 创建 `/docs:search` 命令
- [ ] 创建 `/docs:status` 命令

### Phase 5: 文档和迁移

- [ ] 编写使用文档
- [ ] 编写迁移指南
- [ ] 标记 `document-driven-bridge` 为 deprecated

---

## 十二、文档状态自动同步机制

### 12.1 问题分析

**用户痛点：**
- 使用 document-driven-ai-workflow 时需要主动让 AI 更新文档
- 文档状态和实际修改状态经常不一致
- 手动同步文档状态繁琐且容易遗漏

**设计目标：**
- 在工作流关键节点自动更新文档状态
- 减少手动操作，提高状态准确性
- 保持文档与实际进度的一致性

### 12.2 自动同步触发点

#### 触发点矩阵

| 触发点 | 触发时机 | 自动更新内容 | 实现方式 |
|--------|----------|--------------|----------|
| **brainstorming 完成** | 设计文档保存后 | 创建 decision 文档 | 技能自动调用 |
| **writing-plans 完成** | 计划文档保存后 | 创建 task 文档，状态=待开始 | 技能自动调用 |
| **subagent 完成任务** | Task 完成 | 更新 task 进展，状态=进行中→已完成 | 技能自动调用 |
| **TDD 修复 Bug** | Bug 修复后 | 更新 bug 文档，状态=已修复 | 技能自动调用 |
| **代码提交** | Git commit 时 | 记录 commit 到进展 | 可选：Git Hook |
| **Session 结束** | 会话结束前 | 总结并更新状态 | Session End Hook |
| **finishing** | 准备合并前 | 最终状态更新，归档 | 技能自动调用 |

### 12.3 工作流集成设计

#### 12.3.1 状态变量传递

在工作流中传递文档引用：

```markdown
# 在 writing-plans 完成后
$TASK_DOC = "docs/active/2025-01-19-task-user-auth.md"

# 后续技能自动使用此变量
- subagent-driven-development: 读取 $TASK_DOC，更新进展
- finishing-a-development-branch: 更新 $TASK_DOC 状态为"已完成"
```

#### 12.3.2 技能自动更新点

**subagent-driven-development 集成：**

```markdown
## Task Completion

For each completed task:

1. **Update task document automatically:**
   IF $TASK_DOC is set:
     Run: `$DOCS_UPDATE "$TASK_DOC" "status:进行中" "progress:[task-description] 完成"`

2. **Mark as complete when all tasks done:**
   IF all tasks completed AND $TASK_DOC is set:
     Run: `$DOCS_UPDATE "$TASK_DOC" "status:已完成" "progress:所有任务已完成，准备测试"`
```

**test-driven-development 集成：**

## GREEN Phase

After making test pass:

IF `$BUG_DOC` is set:
  Run: `$DOCS_UPDATE "$BUG_DOC" "status:已修复" "progress:修复方案：[brief description]"`

Also append to bug document:

```markdown
## 解决方案
[代码变更描述]

## 验证结果
测试通过：[test-name]
```

**finishing-a-development-branch 集成：**

## Pre-Completion Checklist

After tests pass:

1. **Update all related documents:**
   ```bash
   # 更新任务文档
   $DOCS_UPDATE "$TASK_DOC" "status:已完成" "progress:实现完成，测试通过，准备合并"

   # 检查并归档
   $DOCS_ARCHIVE --completed
   ```

2. **Generate completion summary:**
   Automatically append to task document:

   ```markdown
   ## 完成总结
   - 完成时间: [timestamp]
   - 提交数: [commit count]
   - 测试覆盖: [test status]
   ```

### 12.4 Session End Hook 设计

#### `hooks/session-end.sh`（新建）

```bash
#!/usr/bin/env bash
# SessionEnd hook for automatic document updates

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 检测是否有活跃的任务文档
if [ -f "docs/.docs-metadata/active-task.txt" ]; then
    ACTIVE_TASK=$(cat docs/.docs-metadata/active-task.txt)

    # 获取当前 git 变更
    if git rev-parse --git-dir > /dev/null 2>&1; then
        COMMITS_SINCE_START=$(git log --since="$(cat docs/.docs-metadata/session-start.txt 2>/dev/null || echo '1 hour ago')" --oneline 2>/dev/null || echo "")

        if [ -n "$COMMITS_SINCE_START" ]; then
            # 自动更新任务进展
            node -e "
            const fs = require('fs');
            const path = require('path');

            const taskDoc = '$ACTIVE_TASK';
            const commits = \`$COMMITS_SINCE_START\`;

            if (fs.existsSync(taskDoc)) {
                let content = fs.readFileSync(taskDoc, 'utf8');
                const timestamp = new Date().toISOString().slice(0, 10);

                // 添加进展记录
                const progressEntry = \`- \${timestamp}: 会话完成 - \${commits.split('\\n').length} 个提交\`;

                if (content.includes('## 进展记录')) {
                    content = content.replace(
                        /(## 进展记录\\n[\\s\\S]*?)(?=\\n##|\\Z)/,
                        '\$1\\n' + progressEntry
                    );
                }

                fs.writeFileSync(taskDoc, content);
            }
            "
        fi
    fi
fi

exit 0
```

#### `hooks/hooks.json` 注册

```json
{
  "hooks": {
    "SessionStart": "hooks/session-start.sh",
    "SessionEnd": "hooks/session-end.sh"
  }
}
```

### 12.5 任务文档元数据追踪

创建 `docs/.docs-metadata/` 用于追踪：

```
docs/.docs-metadata/
├── active-task.txt          # 当前活跃任务路径
├── session-start.txt        # 会话开始时间
├── last-commit.txt          # 上次记录的 commit
└── checkpoints.json         # 检查点记录
```

**使用方式：**

```javascript
// 在创建任务文档时
createTaskDocument(title) {
    const docPath = this.createActiveDocument('task', title);

    // 记录活跃任务
    fs.writeFileSync(
        path.join(this.metadataDir, 'active-task.txt'),
        docPath.path
    );

    // 记录会话开始
    fs.writeFileSync(
        path.join(this.metadataDir, 'session-start.txt'),
        new Date().toISOString()
    );

    return docPath;
}
```

### 12.6 自动更新策略

#### 策略 1: 基于工作流节点（推荐）

```markdown
工作流节点 → 自动触发文档更新

brainstorming → decision 文档创建
     ↓
writing-plans → task 文档创建 + 状态="待开始"
     ↓
subagent → task 文档进展更新（每完成一个子任务）
     ↓
finishing → task 文档状态="已完成" + 归档
```

**优点：**
- 上下文完整，AI 知道更新什么
- 及时准确，与工作流同步
- 无需额外基础设施

#### 策略 2: 基于提交消息（可选增强）

在 commit message 中引用文档：

```bash
# commit message 格式
git commit -m "feat(auth): implement user login

Task: docs/active/2025-01-19-task-user-auth.md
Progress: 完成基础认证组件
Status: 进行中
```

**Git Hook 自动解析：**

```javascript
// hooks/post-commit (可选)
const commitMsg = fs.readFileSync('.git/COMMIT_EDITMSG', 'utf8');
const taskMatch = commitMsg.match(/Task:\s*(.+?)(?:\n|$)/);
const progressMatch = commitMsg.match(/Progress:\s*(.+?)(?:\n|$)/);
const statusMatch = commitMsg.match(/Status:\s*(.+?)(?:\n|$)/);

if (taskMatch) {
    // 自动更新文档
    updateDocument(taskMatch[1], {
        progress: progressMatch?.[1],
        status: statusMatch?.[1]
    });
}
```

#### 策略 3: 基于 AI 总结（Session End）

在会话结束时自动总结：

```markdown
## Session End Summary

AI 检测到本次会话：
- 完成的文件: [列表]
- 相关任务: docs/active/2025-01-19-task-xxx.md
- 建议更新: "实现用户认证组件"

是否自动更新任务文档？[Y/n]
```

### 12.7 状态一致性保障

#### 检查点机制

在关键节点设置检查点：

```javascript
// 在执行重要操作前
checkpoints = {
    before_implementation: {
        taskDoc: 'docs/active/2025-01-19-task-xxx.md',
        expectedStatus: '待开始',
        timestamp: '2025-01-19T10:00:00Z'
    },
    after_implementation: {
        taskDoc: 'docs/active/2025-01-19-task-xxx.md',
        expectedStatus: '已完成',
        timestamp: '2025-01-19T15:00:00Z'
    }
};
```

#### 一致性验证

```javascript
validateConsistency() {
    const checkpoints = JSON.parse(
        fs.readFileSync('docs/.docs-metadata/checkpoints.json', 'utf8')
    );

    checkpoints.forEach(cp => {
        const content = fs.readFileSync(cp.taskDoc, 'utf8');

        // 检查状态是否匹配
        const statusMatch = content.match(/- 状态[：:]\s*(.+)/);
        if (statusMatch && statusMatch[1] !== cp.expectedStatus) {
            console.warn(`状态不一致: ${cp.taskDoc}`);
            console.warn(`  期望: ${cp.expectedStatus}`);
            console.warn(`  实际: ${statusMatch[1]}`);
        }
    });
}
```

### 12.8 用户覆盖选项

始终允许用户手动覆盖自动更新：

```yaml
# .superpowers-config.yaml
documentation:
  enabled: true
  auto_update:
    # 工作流节点自动更新
    workflow_nodes: true
    # Session 结束时总结
    session_summary: true
    # Git commit 消息解析
    git_commit_parsing: false  # 默认关闭，需要手动启用

    # 用户确认模式
    confirmation_mode: "smart"  # always | never | smart
```

**confirmation_mode 说明：**
- `always` - 每次更新前都询问用户
- `never` - 完全自动更新
- `smart` - 重要更新询问，小进展直接更新（推荐）

### 12.9 实现示例

#### 示例 1: 完整工作流自动更新

```
用户: "帮我实现用户认证功能"

↓ brainstorming
AI: [设计过程...]
自动: 创建 docs/plans/2025-01-19-user-auth-design.md
自动: 创建 docs/active/2025-01-19-decision-auth-method.md

↓ writing-plans
AI: [编写计划...]
自动: 创建 docs/plans/2025-01-19-user-auth.md
自动: 创建 docs/active/2025-01-19-task-user-auth.md
     状态="待开始"
     设置 $TASK_DOC = "docs/active/2025-01-19-task-user-auth.md"

↓ subagent-driven-development
AI: [执行任务 1]
自动: 更新 $TASK_DOC progress="完成登录组件" status="进行中"

AI: [执行任务 2]
自动: 更新 $TASK_DOC progress="完成密码加密"

AI: [执行任务 3]
自动: 更新 $TASK_DOC progress="完成会话管理"

↓ finishing-a-development-branch
AI: 测试通过，准备合并
自动: 更新 $TASK_DOC status="已完成"
自动: 归档到 docs/archive/
```

#### 示例 2: Session End 自动总结

```
用户: "完成了，再见"

Session End Hook 触发:
- 检测到 3 个新 commits
- 读取活跃任务: docs/active/2025-01-19-task-user-auth.md
- 自动更新:
  ## 进展记录
  - 2025-01-19: 会话完成 - 3 个提交

用户下次打开会话时:
AI: "看到您上次完成了用户认证的 3 个组件，
     任务文档已自动更新。继续下一步？"
```

### 12.10 最小侵入方案

如果不想完全自动化，可以采用**提示 + 一键应用**模式：

```markdown
## 工作流完成提示

检测到以下文档需要更新：

📋 docs/active/2025-01-19-task-user-auth.md
   状态: 进行中 → 已完成
   进展: 完成所有认证组件

运行 `/docs:sync-apply` 应用建议的更新
或 `/docs:sync-edit` 手动编辑
```

这种方式：
- 保持用户控制权
- 减少手动编辑
- AI 提供建议，用户决定

---

## 十三、实施路线图最终版

### Phase 1: 核心基础设施

- [ ] 创建 `lib/docs-core.js`（约800行，包含迁移功能）
- [ ] 创建 `docs/plans/` 到 `docs/active/` 的关联逻辑
- [ ] 实现文档目录检测功能
- [ ] 实现智能文档分类
- [ ] 编写单元测试

### Phase 2: 工作流集成（自动更新）

- [ ] 更新 `brainstorming/SKILL.md` - 自动创建 decision
- [ ] 更新 `writing-plans/SKILL.md` - 自动创建 task
- [ ] 更新 `subagent-driven-development/SKILL.md` - 自动更新进展
- [ ] 更新 `test-driven-development/SKILL.md` - 自动更新 bug
- [ ] 更新 `finishing-a-development-branch/SKILL.md` - 自动完成并归档

### Phase 3: Session Hooks

- [ ] 创建 `hooks/session-end.sh`
- [ ] 实现会话结束自动总结
- [ ] 更新 `hooks/hooks.json` 注册
- [ ] 创建元数据追踪机制

### Phase 4: Session Start 集成

- [ ] 修改 `hooks/session-start.sh` 添加文档检测
- [ ] 实现检测结果的上下文注入
- [ ] 测试多文档目录场景
- [ ] 实现迁移提示功能

### Phase 5: 新增技能和命令

- [ ] 创建 `skills/document-management/SKILL.md`
- [ ] 创建 `/docs:init` 命令
- [ ] 创建 `/docs:analyze` 命令
- [ ] 创建 `/docs:migrate` 命令
- [ ] 创建 `/docs:search` 命令
- [ ] 创建 `/docs:status` 命令
- [ ] 创建 `/docs:sync-apply` 命令（可选）
- [ ] 创建 `/docs:sync-edit` 命令（可选）

### Phase 6: 文档和迁移

- [ ] 编写使用文档
- [ ] 编写迁移指南
- [ ] 编写自动同步功能文档
- [ ] 标记 `document-driven-bridge` 为 deprecated

---

**文档状态**: 待评审（已添加自动状态同步机制）
**下一步**: 评审通过后开始实施
