/**
 * 统一文档管理系统核心模块
 * 内化自 document-driven-ai-workflow CLI 工具
 * 整合 horspowers 原有文档逻辑
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

    // ========== 目录管理 ==========

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
     * 命名格式：YYYY-MM-DD-design-<topic>.md（前缀式）
     */
    createDesignDocument(topic, content = null) {
        const date = new Date().toISOString().slice(0, 10);
        const slug = this.generateSlug(topic);
        const filename = `${date}-design-${slug}.md`;
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
    createPlanDocument(featureName, content = null) {
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
     * 创建活跃文档（task/bug/context）
     * 注意: decision 类型已合并到 design，请使用 createDesignDocument() 创建设计文档
     * 新格式：YYYY-MM-DD-<type>-<slug>.md
     * @param {string} type - 文档类型: task, bug, context
     * @param {string} title - 文档标题
     * @param {string} content - 可选的自定义内容
     * @param {object} relatedDocs - 关联文档 {design, plan}
     */
    createActiveDocument(type, title, content = null, relatedDocs = {}) {
        const validTypes = ['task', 'bug', 'context'];
        if (!validTypes.includes(type)) {
            return { success: false, error: `无效类型: ${type}（decision 已合并到 design，请使用 createDesignDocument()）` };
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

        // 如果是任务文档，记录为活跃任务
        if (type === 'task') {
            // 存储相对路径（从项目根目录开始），便于跨设备使用
            // 格式: type:path (与 setActiveTask 保持一致)
            const relativePath = path.relative(this.projectRoot, filepath);
            fs.writeFileSync(
                path.join(this.metadataDir, 'active-task.txt'),
                `task:${relativePath}`
            );
            // 记录会话开始时间
            fs.writeFileSync(
                path.join(this.metadataDir, 'session-start.txt'),
                new Date().toISOString()
            );
        }

        return { success: true, path: filepath, filename };
    }

    /**
     * 更新活跃文档的状态和进展
     * @param {string} docPath - 文档路径
     * @param {object} updates - {status, progress}
     */
    updateActiveDocument(docPath, updates = {}) {
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
     * @param {string} docPath - 文档路径
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

    /**
     * 删除已修复的 bug 文档
     * Bug 文档是临时文档，修复完成后应删除以避免文档膨胀
     * @param {string} bugDocPath - bug 文档路径
     * @param {object} options - {verifyStatus, requireConfirmation}
     * @returns {object} {success, deleted, message}
     */
    deleteBugDocument(bugDocPath, options = {}) {
        const { verifyStatus = true, requireConfirmation = false } = options;

        // 解析文档路径
        const filepath = this.resolveActiveDocPath(bugDocPath);

        // 验证文件是否存在
        if (!fs.existsSync(filepath)) {
            return { success: false, deleted: false, message: 'Bug 文档不存在' };
        }

        // 验证文件类型（使用严格匹配，与 getStats() 保持一致）
        const filename = path.basename(filepath);
        const isBugDocument = filename.match(/^\d{4}-\d{2}-\d{2}-bug-/);

        if (!isBugDocument) {
            return { success: false, deleted: false, message: '指定的文档不是 bug 文档' };
        }

        // 如果需要验证状态，检查 bug 是否已修复
        if (verifyStatus) {
            const content = fs.readFileSync(filepath, 'utf8');
            const isFixed = content.match(/- 状态[：:]\s*(已修复|fixed)/i);

            if (!isFixed) {
                return {
                    success: false,
                    deleted: false,
                    message: 'Bug 状态不是"已修复"，无法删除。如需强制删除，请设置 verifyStatus: false'
                };
            }
        }

        // 如果需要用户确认，返回确认信息但不删除
        if (requireConfirmation) {
            return {
                success: true,
                deleted: false,
                requiresConfirmation: true,
                message: `准备删除 bug 文档: ${filename}`,
                filepath
            };
        }

        // 执行删除
        try {
            fs.unlinkSync(filepath);

            // 更新索引
            this.updateIndex({ file: filename, deleted: true });

            return {
                success: true,
                deleted: true,
                message: `Bug 文档已删除: ${filename}`,
                deletedPath: filepath
            };
        } catch (error) {
            return {
                success: false,
                deleted: false,
                message: `删除失败: ${error.message}`
            };
        }
    }

    // ========== 查询操作 ==========

    /**
     * 搜索文档（支持 plans 和 active）
     * @param {string} keyword - 搜索关键词
     * @param {object} options - {type, dirs}
     */
    search(keyword, options = {}) {
        const searchDirs = options.dirs || [this.plansDir, this.activeDir, this.contextDir];
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
     * 统计核心文档数量
     * 核心文档包括：design（可选）+ plan（必需）+ task（必需）
     * Bug 文档不计入核心文档（临时文档，修复后删除）
     * @param {string} featureName - 可选的功能名称，用于过滤相关文档
     * @returns {object} {total, breakdown, warning}
     */
    countCoreDocs(featureName = null) {
        const planFiles = this.getPlanFiles();
        const activeFiles = this.getActiveFiles();

        // 统计各类核心文档
        let designCount = 0;
        let planCount = 0;
        let taskCount = 0;

        // 统计 plans/ 目录中的文档
        planFiles.forEach(file => {
            const type = this.extractDocType(file);
            if (type === 'design') {
                // 如果指定了 featureName，只统计匹配的
                if (!featureName || file.toLowerCase().includes(featureName.toLowerCase())) {
                    designCount++;
                }
            } else if (type === 'plan') {
                if (!featureName || file.toLowerCase().includes(featureName.toLowerCase())) {
                    planCount++;
                }
            }
        });

        // 统计 active/ 目录中的 task 文档（使用严格匹配）
        activeFiles.forEach(file => {
            if (file.match(/^\d{4}-\d{2}-\d{2}-task-/)) {
                if (!featureName || file.toLowerCase().includes(featureName.toLowerCase())) {
                    taskCount++;
                }
            }
        });

        const total = designCount + planCount + taskCount;

        // 生成警告信息
        let warning = null;
        if (total > 3) {
            warning = `当前核心文档数量为 ${total} 个，超过了建议的 3 个上限（design: ${designCount}, plan: ${planCount}, task: ${taskCount}）`;
        }

        return {
            total,
            breakdown: {
                design: designCount,
                plan: planCount,
                task: taskCount
            },
            warning,
            // 预期数量（用于对比）
            expected: {
                design: '0-1',  // 可选
                plan: '1',      // 必需
                task: '1'       // 必需
            }
        };
    }

    /**
     * 获取文档状态统计
     * 使用与 extractDocType() 一致的严格匹配逻辑
     */
    getStats() {
        const activeFiles = this.getActiveFiles();
        const planFiles = this.getPlanFiles();

        return {
            plans: {
                // 统计 design 文档（支持新旧两种格式）
                // 使用严格匹配，与 extractDocType() 保持一致
                designs: planFiles.filter(f =>
                    f.includes('-design.md') ||  // 后缀式（旧格式）
                    f.match(/^\d{4}-\d{2}-\d{2}-design-/)  // 前缀式（新格式）
                ).length,
                total: planFiles.length
            },
            active: {
                // 使用严格前缀匹配，与 extractDocType() 保持一致
                tasks: activeFiles.filter(f => f.match(/^\d{4}-\d{2}-\d{2}-task-/)).length,
                bugs: activeFiles.filter(f => f.match(/^\d{4}-\d{2}-\d{2}-bug-/)).length,
                decisions: activeFiles.filter(f => f.match(/^\d{4}-\d{2}-\d{2}-decision-/)).length,
                contexts: activeFiles.filter(f => f.match(/^\d{4}-\d{2}-\d{2}-context-/)).length,
                total: activeFiles.length
            },
            archived: fs.existsSync(this.archiveDir) ?
                fs.readdirSync(this.archiveDir).filter(f => f.endsWith('.md')).length : 0
        };
    }

    /**
     * 获取最近文档
     * @param {number} days - 天数
     * @param {string} type - 可选的文档类型过滤
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

    /**
     * 提取文档类型（支持新旧两种格式）
     * 新格式（前缀式）：YYYY-MM-DD-<type>-<slug>.md
     * 旧格式（后缀式）：YYYY-MM-DD-<slug>-design.md
     *
     * 检查顺序：后缀式优先，确保旧格式文件不会被误分类
     * 使用严格正则匹配，避免子串误匹配（如 debug- → bug-, redesign- → design-）
     */
    extractDocType(filename) {
        // 后缀式检测（旧格式，优先检查以确保向后兼容）
        if (filename.includes('-design.md')) return 'design';

        // 前缀式检测（新格式，使用严格正则匹配）
        if (filename.includes('/design-') || filename.match(/^\d{4}-\d{2}-\d{2}-design-/)) return 'design';
        if (filename.match(/^\d{4}-\d{2}-\d{2}-task-/)) return 'task';
        if (filename.match(/^\d{4}-\d{2}-\d{2}-bug-/)) return 'bug';
        if (filename.match(/^\d{4}-\d{2}-\d{2}-decision-/)) return 'decision';
        if (filename.match(/^\d{4}-\d{2}-\d{2}-context-/)) return 'context';

        // plan 文档检测（不包含类型前缀的日期开头的文件）
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
        } else if (content.includes('## 基本信息')) {
            // 在基本信息中添加状态
            return content.replace(
                /(## 基本信息\n[\s\S]*?)(?=\n##|$)/,
                `$1- 状态: ${newStatus}\n`
            );
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
        } else {
            // 如果没有进展记录部分，添加一个
            const lastHeaderMatch = content.lastIndexOf('\n## ');
            if (lastHeaderMatch > 0) {
                const insertPoint = content.indexOf('\n', lastHeaderMatch);
                const progressSection = `\n## 进展记录\n${progressLine}\n`;
                return content.slice(0, insertPoint + 1) + progressSection + content.slice(insertPoint + 1);
            }
        }
        return content;
    }

    updateIndex(metadata = {}) {
        const indexPath = path.join(this.metadataDir, 'index.json');

        let index = {};
        if (fs.existsSync(indexPath)) {
            try {
                index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            } catch (e) {
                // 忽略解析错误，使用空对象
            }
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

    /**
     * 获取设计文档模板（统一格式：合并 design + decision）
     * 命名格式：YYYY-MM-DD-design-<topic>.md
     * 采用 DDAW 详细结构
     */
    getDesignTemplate(topic) {
        const date = new Date().toISOString().slice(0, 10);
        return `# 设计: ${topic}

## 基本信息
- 创建时间: ${date}
- 设计者: [待指定]
- 状态: [草稿/已批准/已实施]

## 设计背景
[描述需要设计的背景和原因]

## 设计方案

### 方案A
- 描述: [方案描述]
- 优点: [优点列表]
- 缺点: [缺点列表]

### 方案B
- 描述: [方案描述]
- 优点: [优点列表]
- 缺点: [缺点列表]

## 最终设计
**选择**: [选择的方案]
**理由**: [详细说明选择理由]

## 技术细节
[架构、组件、数据流等详细设计]

## 影响范围
[这个设计影响的模块/系统]

## 实施计划
1. [实施步骤1]
2. [实施步骤2]
3. [实施步骤3]

## 结果评估
[设计实施后的效果评估]

## 相关文档
- 计划文档: [../plans/YYYY-MM-DD-plan-<feature>.md](../plans/YYYY-MM-DD-plan-<feature>.md)
`;
    }

    getPlanTemplate(featureName) {
        const date = new Date().toISOString().slice(0, 10);
        return `# ${featureName} 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: ${date}

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

    /**
     * 获取活跃文档模板
     * 注意: decision 类型已合并到 design，不再支持单独创建 decision 文档
     */
    getActiveTemplate(type, title, relatedDocs = {}) {
        const date = new Date().toISOString().slice(0, 10);
        const templates = {
            task: this.getTaskTemplate(title, date, relatedDocs),
            bug: this.getBugTemplate(title, date),
            context: this.getContextTemplate(title, date)
        };

        return templates[type] || `# ${title}\n\n请在此处添加内容...`;
    }

    getTaskTemplate(title, date, relatedDocs) {
        let relatedSection = '';
        if (relatedDocs.plan || relatedDocs.design) {
            relatedSection = '\n## 相关文档\n';
            if (relatedDocs.plan) {
                relatedSection += `- 计划文档: [../plans/${relatedDocs.plan}](../plans/${relatedDocs.plan})\n`;
            }
            if (relatedDocs.design) {
                relatedSection += `- 设计文档: [../plans/${relatedDocs.design}](../plans/${relatedDocs.design})\n`;
            }
        }

        return `# 任务: ${title}

## 基本信息
- 创建时间: ${date}
- 负责人: [待指定]
- 优先级: [高/中/低]

## 任务描述
[详细描述任务目标和要求]
${relatedSection}
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
`;
    }

    getBugTemplate(title, date) {
        return `# Bug报告: ${title}

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
`;
    }


    getContextTemplate(title, date) {
        return `# 项目上下文: ${title}

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
`;
    }

    // ========== 迁移相关方法 ==========

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
     * @param {object} plan - 迁移计划
     * @param {object} options - {dryRun}
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
     * @param {string[]} dirs - 目录列表
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
    validateMigration() {
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

    // ========== 元数据追踪方法 ==========

    /**
     * 设置活跃任务文档
     * @param {string} docPath - 任务文档路径
     * @param {string} docType - 文档类型 (task|bug)
     */
    setActiveTask(docPath, docType = 'task') {
        const activeTaskFile = path.join(this.metadataDir, 'active-task.txt');
        const sessionStartFile = path.join(this.metadataDir, 'session-start.txt');

        // 确保元数据目录存在
        if (!fs.existsSync(this.metadataDir)) {
            fs.mkdirSync(this.metadataDir, { recursive: true });
        }

        // 存储相对路径（从项目根目录开始），便于跨设备使用
        const relativePath = path.relative(this.projectRoot, docPath);
        fs.writeFileSync(activeTaskFile, `${docType}:${relativePath}`, 'utf8');

        // 记录会话开始时间
        fs.writeFileSync(sessionStartFile, new Date().toISOString(), 'utf8');

        return { success: true, docPath, docType };
    }

    /**
     * 获取活跃任务文档
     * @returns {object|null} {docPath, docType} 或 null
     */
    getActiveTask() {
        const activeTaskFile = path.join(this.metadataDir, 'active-task.txt');

        if (!fs.existsSync(activeTaskFile)) {
            return null;
        }

        const content = fs.readFileSync(activeTaskFile, 'utf8').trim();

        // 新格式: task:path 或 bug:path
        let match = content.match(/^(task|bug):(.+)$/);
        if (match) {
            // 将相对路径转换为绝对路径
            const relativePath = match[2];
            const absolutePath = path.resolve(this.projectRoot, relativePath);

            return {
                docType: match[1],
                docPath: absolutePath
            };
        }

        // 旧格式兼容: 只包含路径（可能是绝对或相对路径）
        // 假设是任务类型（向后兼容）
        if (content.length > 0) {
            // 如果是相对路径，转换为绝对路径
            const taskPath = path.isAbsolute(content)
                ? content
                : path.resolve(this.projectRoot, content);

            return {
                docType: 'task', // 旧格式默认为 task
                docPath: taskPath
            };
        }

        return null;
    }

    /**
     * 清除活跃任务
     */
    clearActiveTask() {
        const activeTaskFile = path.join(this.metadataDir, 'active-task.txt');

        if (fs.existsSync(activeTaskFile)) {
            fs.unlinkSync(activeTaskFile);
        }

        return { success: true };
    }

    /**
     * 设置检查点
     * @param {string} name - 检查点名称
     * @param {object} data - 检查点数据
     */
    setCheckpoint(name, data = {}) {
        const checkpointsFile = path.join(this.metadataDir, 'checkpoints.json');

        // 确保元数据目录存在
        if (!fs.existsSync(this.metadataDir)) {
            fs.mkdirSync(this.metadataDir, { recursive: true });
        }

        let checkpoints = {};
        if (fs.existsSync(checkpointsFile)) {
            try {
                checkpoints = JSON.parse(fs.readFileSync(checkpointsFile, 'utf8'));
            } catch (e) {
                // 忽略解析错误
            }
        }

        checkpoints[name] = {
            ...data,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(checkpointsFile, JSON.stringify(checkpoints, null, 2), 'utf8');

        return { success: true, name };
    }

    /**
     * 获取所有检查点
     * @returns {object} 检查点对象
     */
    getCheckpoints() {
        const checkpointsFile = path.join(this.metadataDir, 'checkpoints.json');

        if (!fs.existsSync(checkpointsFile)) {
            return {};
        }

        try {
            return JSON.parse(fs.readFileSync(checkpointsFile, 'utf8'));
        } catch (e) {
            return {};
        }
    }

    /**
     * 获取特定检查点
     * @param {string} name - 检查点名称
     * @returns {object|null} 检查点数据或 null
     */
    getCheckpoint(name) {
        const checkpoints = this.getCheckpoints();
        return checkpoints[name] || null;
    }

    /**
     * 清除检查点
     * @param {string} name - 检查点名称
     */
    clearCheckpoint(name) {
        const checkpointsFile = path.join(this.metadataDir, 'checkpoints.json');

        if (!fs.existsSync(checkpointsFile)) {
            return { success: true };
        }

        let checkpoints = JSON.parse(fs.readFileSync(checkpointsFile, 'utf8'));
        delete checkpoints[name];

        fs.writeFileSync(checkpointsFile, JSON.stringify(checkpoints, null, 2), 'utf8');

        return { success: true, name };
    }

    /**
     * 验证检查点状态
     * @param {string} name - 检查点名称
     * @param {object} expectedState - 期望状态
     * @returns {object} {valid, actual, expected}
     */
    validateCheckpoint(name, expectedState) {
        const checkpoint = this.getCheckpoint(name);

        if (!checkpoint) {
            return {
                valid: false,
                reason: '检查点不存在'
            };
        }

        // 检查关键字段是否匹配
        for (const key of Object.keys(expectedState)) {
            if (checkpoint[key] !== expectedState[key]) {
                return {
                    valid: false,
                    reason: `字段 ${key} 不匹配`,
                    actual: checkpoint[key],
                    expected: expectedState[key]
                };
            }
        }

        return {
            valid: true,
            checkpoint
        };
    }
}

module.exports = { UnifiedDocsManager };
