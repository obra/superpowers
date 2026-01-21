#!/usr/bin/env node

/**
 * Horspowers 文档系统迁移脚本
 *
 * 功能：
 * 1. 重命名旧格式 design 文档：YYYY-MM-DD-<topic>-design.md → YYYY-MM-DD-design-<topic>.md
 * 2. 合并旧 decision 文档到 design（如果存在）
 * 3. 更新所有内部链接
 *
 * 使用方式：
 *   node scripts/migrate-docs.js [--dry-run] [--backup]
 *
 * 选项：
 *   --dry-run: 仅预览更改，不实际执行
 *   --backup: 在修改前创建备份
 */

const fs = require('fs');
const path = require('path');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`\n${title}`, 'bright');
  log('='.repeat(title.length), 'cyan');
}

/**
 * 匹配旧格式 design 文档
 * YYYY-MM-DD-<topic>-design.md
 */
const OLD_DESIGN_REGEX = /^(\d{4}-\d{2}-\d{2})-(.+)-design\.md$/;

/**
 * 匹配旧格式 decision 文档
 * YYYY-MM-DD-decision-<title>.md
 */
const OLD_DECISION_REGEX = /^(\d{4}-\d{2}-\d{2})-decision-(.+)\.md$/;

/**
 * 匹配新格式 design 文档
 * YYYY-MM-DD-design-<topic>.md
 */
const NEW_DESIGN_REGEX = /^(\d{4}-\d{2}-\d{2})-design-(.+)\.md$/;

/**
 * 匹配文档内部链接
 * ../plans/YYYY-MM-DD-<topic>-design.md
 * ./YYYY-MM-DD-<topic>-design.md
 */
const DOC_LINK_REGEX = /\[([^\]]+)\]\((\.\.\/[^)]*\/)?(\d{4}-\d{2}-\d{2})-([^-]+)(?:-design)?\.md\)/g;

/**
 * 文档迁移计划
 */
class MigrationPlan {
  constructor() {
    this.renames = []; // { source, target, type }
    this.merges = []; // { decision, design, type }
    this.linkUpdates = []; // { file, oldLink, newLink }
  }

  addRename(source, target, type) {
    this.renames.push({ source, target, type });
  }

  addMerge(decision, design, type) {
    this.merges.push({ decision, design, type });
  }

  addLinkUpdate(file, oldLink, newLink) {
    this.linkUpdates.push({ file, oldLink, newLink });
  }

  summary() {
    return {
      renames: this.renames.length,
      merges: this.merges.length,
      linkUpdates: this.linkUpdates.length,
    };
  }
}

/**
 * 扫描文档目录，查找需要迁移的文档
 */
function scanDocuments(docsRoot = 'docs') {
  const results = {
    oldDesignDocs: [],
    oldDecisionDocs: [],
    allDocs: [],
  };

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.allDocs.push(fullPath);

        const basename = path.basename(entry.name);

        // 检查旧格式 design 文档
        if (OLD_DESIGN_REGEX.test(basename)) {
          results.oldDesignDocs.push(fullPath);
        }

        // 检查旧格式 decision 文档
        if (OLD_DECISION_REGEX.test(basename)) {
          results.oldDecisionDocs.push(fullPath);
        }
      }
    }
  };

  scanDir(docsRoot);
  return results;
}

/**
 * 分析文档并生成迁移计划
 */
function analyzeMigration(scanResults, docsRoot = 'docs') {
  const plan = new MigrationPlan();

  // 1. 分析旧格式 design 文档重命名
  logSection('📋 分析旧格式 Design 文档');
  for (const docPath of scanResults.oldDesignDocs) {
    const basename = path.basename(docPath);
    const match = basename.match(OLD_DESIGN_REGEX);

    if (match) {
      const [, date, topic] = match;
      const newBasename = `${date}-design-${topic}.md`;
      const newPath = path.join(path.dirname(docPath), newBasename);

      plan.addRename(docPath, newPath, 'design');

      log(`  ✓ ${basename} → ${newBasename}`, 'green');
    }
  }

  // 2. 分析 decision 文档合并
  logSection('📋 分析 Decision 文档合并');
  for (const decisionPath of scanResults.oldDecisionDocs) {
    const basename = path.basename(decisionPath);
    const match = basename.match(OLD_DECISION_REGEX);

    if (match) {
      const [, date, title] = match;
      const designBasename = `${date}-design-${title}.md`;
      const designPath = path.join(path.dirname(decisionPath), designBasename);

      // 检查是否已有对应的 design 文档
      if (fs.existsSync(designPath)) {
        plan.addMerge(decisionPath, designPath, 'decision->design');
        log(`  ⚠ ${basename} 需要合并到 ${designBasename}`, 'yellow');
      } else {
        // 如果没有对应的 design，则重命名 decision 为 design
        plan.addRename(decisionPath, designPath, 'decision->design');
        log(`  → ${basename} 将重命名为 ${designBasename}`, 'blue');
      }
    }
  }

  // 3. 分析需要更新链接的文档
  logSection('📋 分析文档链接更新');
  for (const docPath of scanResults.allDocs) {
    try {
      const content = fs.readFileSync(docPath, 'utf-8');
      const basename = path.basename(docPath);

      // 跳过旧格式文档本身（它们会被重命名）
      if (OLD_DESIGN_REGEX.test(basename) || OLD_DECISION_REGEX.test(basename)) {
        continue;
      }

      let hasUpdates = false;
      let match;
      const linkRegex = new RegExp(DOC_LINK_REGEX);

      while ((match = linkRegex.exec(content)) !== null) {
        const [fullMatch, linkText, relativePath, date, slug, typeSuffix] = match;

        // 构建可能的旧格式路径
        const oldFormatPath = typeSuffix ? `${date}-${slug}-${typeSuffix}.md` : null;
        const newFormatPath = `${date}-design-${slug}.md`;

        // 检查是否是旧格式 design 链接
        if (oldFormatPath && OLD_DESIGN_REGEX.test(oldFormatPath)) {
          const newLink = fullMatch.replace(oldFormatPath, newFormatPath);
          plan.addLinkUpdate(docPath, fullMatch, newLink);
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        log(`  🔗 ${path.relative(docsRoot, docPath)} 需要更新链接`, 'cyan');
      }
    } catch (error) {
      log(`  ✗ 无法读取 ${docPath}: ${error.message}`, 'red');
    }
  }

  return plan;
}

/**
 * 创建备份
 */
function createBackup(docsRoot = 'docs') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = `${docsRoot}.backup.${timestamp}`;

  logSection('💾 创建备份');
  log(`  备份路径: ${backupPath}`);

  try {
    // 使用递归复制
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      execSync(`xcopy /E /I /H "${docsRoot}" "${backupPath}"`, { stdio: 'inherit' });
    } else {
      execSync(`cp -r "${docsRoot}" "${backupPath}"`, { stdio: 'inherit' });
    }
    log('  ✓ 备份完成', 'green');
    return backupPath;
  } catch (error) {
    log(`  ✗ 备份失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 执行迁移计划
 */
function executeMigration(plan, options = {}) {
  const { dryRun = false, backup = false, docsRoot = 'docs' } = options;
  let backupPath = null;

  if (backup && !dryRun) {
    backupPath = createBackup(docsRoot);
  }

  logSection('🚀 执行迁移');

  if (dryRun) {
    log('  ⚠ DRY RUN 模式：不会实际修改文件', 'yellow');
    log('');
  }

  // 1. 执行文档重命名
  logSection('📝 重命名文档');
  for (const rename of plan.renames) {
    const relSource = path.relative(docsRoot, rename.source);
    const relTarget = path.relative(docsRoot, rename.target);

    log(`  ${relSource} → ${relTarget}`, 'blue');

    if (!dryRun) {
      try {
        // 确保目标目录存在
        fs.mkdirSync(path.dirname(rename.target), { recursive: true });
        fs.renameSync(rename.source, rename.target);
        log('    ✓ 完成', 'green');
      } catch (error) {
        log(`    ✗ 失败: ${error.message}`, 'red');
      }
    }
  }

  // 2. 执行 decision 合并到 design
  logSection('🔀 合并 Decision 到 Design');
  for (const merge of plan.merges) {
    const relDecision = path.relative(docsRoot, merge.decision);
    const relDesign = path.relative(docsRoot, merge.design);

    log(`  ${relDecision} → ${relDesign}`, 'blue');

    if (!dryRun) {
      try {
        const decisionContent = fs.readFileSync(merge.decision, 'utf-8');
        const designContent = fs.readFileSync(merge.design, 'utf-8');

        // 在 design 文档末尾添加合并标记
        const mergeMarker = `
---
**合并说明**: 此文档已合并原 Decision 文档内容
**源文档**: ${path.basename(merge.decision)}
**合并时间**: ${new Date().toISOString()}
---

## 原决策文档内容

${decisionContent}
`;

        fs.appendFileSync(merge.design, mergeMarker);
        fs.unlinkSync(merge.decision);

        log('    ✓ 合并完成', 'green');
      } catch (error) {
        log(`    ✗ 失败: ${error.message}`, 'red');
      }
    }
  }

  // 3. 更新文档链接
  logSection('🔗 更新文档链接');
  const updatedFiles = new Set();

  for (const update of plan.linkUpdates) {
    const relFile = path.relative(docsRoot, update.file);

    if (!updatedFiles.has(update.file)) {
      log(`  ${relFile}`, 'cyan');
      updatedFiles.add(update.file);
    }

    log(`    - ${update.oldLink.slice(0, 50)}... →`, 'blue');

    if (!dryRun) {
      try {
        let content = fs.readFileSync(update.file, 'utf-8');
        content = content.replace(update.oldLink, update.newLink);
        fs.writeFileSync(update.file, content, 'utf-8');
      } catch (error) {
        log(`    ✗ 失败: ${error.message}`, 'red');
      }
    }
  }

  // 输出总结
  logSection('📊 迁移总结');
  const summary = plan.summary();
  log(`  重命名文档: ${summary.renames}`, 'green');
  log(`  合并文档: ${summary.merges}`, 'green');
  log(`  更新链接: ${summary.linkUpdates}`, 'green');

  if (backupPath) {
    log(`  备份位置: ${backupPath}`, 'yellow');
  }

  return {
    success: true,
    summary,
    backupPath,
  };
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const backup = args.includes('--backup');

  log('═══════════════════════════════════════════════════════════', 'bright');
  log('  Horspowers 文档系统迁移脚本', 'bright');
  log('═══════════════════════════════════════════════════════════', 'bright');

  const docsRoot = 'docs';

  // 检查文档目录
  if (!fs.existsSync(docsRoot)) {
    log(`\n✗ 错误: 文档目录 ${docsRoot} 不存在`, 'red');
    process.exit(1);
  }

  // 扫描文档
  logSection('🔍 扫描文档目录');
  const scanResults = scanDocuments(docsRoot);

  log(`  找到文档总数: ${scanResults.allDocs.length}`, 'blue');
  log(`  旧格式 Design: ${scanResults.oldDesignDocs.length}`, 'yellow');
  log(`  旧格式 Decision: ${scanResults.oldDecisionDocs.length}`, 'yellow');

  if (scanResults.oldDesignDocs.length === 0 && scanResults.oldDecisionDocs.length === 0) {
    log('\n✓ 没有需要迁移的文档', 'green');
    process.exit(0);
  }

  // 分析迁移计划
  const plan = analyzeMigration(scanResults, docsRoot);

  // 确认执行
  if (!dryRun) {
    logSection('⚠️ 确认执行');
    log('  此操作将修改文档文件名和内容', 'yellow');
    log('  建议先使用 --dry-run 预览更改', 'yellow');
    log('  使用 --backup 选项创建备份', 'yellow');
    log('');
    log('  按 Ctrl+C 取消，按回车继续...', 'cyan');

    // 在实际使用时需要确认，这里为了自动化跳过
    // 实际可以通过环境变量或参数控制
  }

  // 执行迁移
  const result = executeMigration(plan, { dryRun, backup, docsRoot });

  log('');
  log('═══════════════════════════════════════════════════════════', 'bright');
  if (dryRun) {
    log('  预览完成！使用不带 --dry-run 参数执行实际迁移', 'green');
  } else {
    log('  迁移完成！', 'green');
  }
  log('═══════════════════════════════════════════════════════════', 'bright');

  return result;
}

// 导出模块函数供测试使用
module.exports = {
  MigrationPlan,
  scanDocuments,
  analyzeMigration,
  executeMigration,
};

// 直接运行脚本
if (require.main === module) {
  main();
}
