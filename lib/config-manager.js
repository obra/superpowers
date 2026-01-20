/**
 * Configuration Manager for Horspower
 *
 * Manages project-level configuration with version control,
 * migration, validation, and auto-initialization.
 */

import fs from 'fs';
import path from 'path';

const NEW_CONFIG_FILENAME = '.horspowers-config.yaml';
const OLD_CONFIG_FILENAME = '.superpowers-config.yaml';
const CONFIG_VERSION = '4.2.2'; // 跟随插件版本

// 简化的默认配置（移除过时的 cli_path 等）
const DEFAULT_CONFIG = {
  version: CONFIG_VERSION,
  development_mode: 'personal',
  branch_strategy: 'simple',
  testing_strategy: 'test-after',
  completion_strategy: 'merge',
  documentation: {
    enabled: true
  }
};

// 配置模板（用于生成新配置文件）
const CONFIG_TEMPLATE = `# Horspowers Configuration
# This file controls development workflow preferences
# Version: ${CONFIG_VERSION}

# Development mode: personal (individual) or team (collaborative)
development_mode: personal

# Branch strategy: simple (regular branches) or worktree (isolated environment)
branch_strategy: simple

# Testing strategy: test-after (code-first) or tdd (test-first)
testing_strategy: test-after

# Completion strategy: merge (local), pr (pull request), or keep (preserve branch)
completion_strategy: merge

# Documentation integration (enabled by default for 4.2.x+)
documentation:
  enabled: true
`;

// 必填字段定义
const REQUIRED_FIELDS = {
  version: { type: 'string', required: true },
  development_mode: { type: 'enum', values: ['personal', 'team'], required: true },
  branch_strategy: { type: 'enum', values: ['simple', 'worktree'], required: true },
  testing_strategy: { type: 'enum', values: ['test-after', 'tdd'], required: true },
  completion_strategy: { type: 'enum', values: ['merge', 'pr', 'keep'], required: true },
  documentation: { type: 'object', required: true, nested: {
    enabled: { type: 'boolean', required: true }
  }}
};

/**
 * 检测配置文件状态
 * @param {string} projectDir - 项目目录
 * @returns {Object} - { hasOld, hasNew, hasAny, oldPath, newPath }
 */
function detectConfigFiles(projectDir) {
  const oldPath = path.join(projectDir, OLD_CONFIG_FILENAME);
  const newPath = path.join(projectDir, NEW_CONFIG_FILENAME);

  return {
    hasOld: fs.existsSync(oldPath),
    hasNew: fs.existsSync(newPath),
    hasAny: fs.existsSync(oldPath) || fs.existsSync(newPath),
    oldPath: fs.existsSync(oldPath) ? oldPath : null,
    newPath: fs.existsSync(newPath) ? newPath : null
  };
}

/**
 * 查找配置文件（向上遍历目录树）
 * @param {string} startDir - 起始目录
 * @returns {Object} - { found, path, type ('new' | 'old' | null) }
 */
function findConfigFile(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    const newPath = path.join(currentDir, NEW_CONFIG_FILENAME);
    const oldPath = path.join(currentDir, OLD_CONFIG_FILENAME);

    if (fs.existsSync(newPath)) {
      return { found: true, path: newPath, type: 'new' };
    }
    if (fs.existsSync(oldPath)) {
      return { found: true, path: oldPath, type: 'old' };
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return { found: false, path: null, type: null };
}

/**
 * 简单的 YAML 解析器（支持嵌套对象）
 * @param {string} content - YAML 内容
 * @returns {Object} - 解析后的配置对象
 */
function parseSimpleYAML(content) {
  const config = {};
  const lines = content.split('\n');
  let currentObj = config;
  const stack = [];
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 计算缩进层级
    const currentIndent = line.search(/\S/);

    // 处理缩进变化
    if (currentIndent < indent) {
      // 缩进减少，回到上一级
      while (stack.length > 0 && stack[stack.length - 1].indent >= currentIndent) {
        stack.pop();
      }
      currentObj = stack.length > 0 ? stack[stack.length - 1].obj : config;
    }
    indent = currentIndent;

    // 解析 key: value 对
    const match = trimmed.match(/^([^:#]+):\s*(.+)?$/);
    if (match) {
      const [, key, value] = match;

      // 处理嵌套对象
      if (value === null || value === undefined || value === '') {
        // 这是一个对象定义
        currentObj[key] = {};
        stack.push({ indent: currentIndent, obj: currentObj });
        currentObj = currentObj[key];
      } else {
        // 解析值
        let parsedValue;
        if (value === 'true') {
          parsedValue = true;
        } else if (value === 'false') {
          parsedValue = false;
        } else if (/^-?\d+(\.\d+)?$/.test(value)) {
          parsedValue = Number(value);
        } else if (value.startsWith('"') || value.startsWith("'")) {
          // 字符串（带引号）
          parsedValue = value.slice(1, -1);
        } else {
          parsedValue = value;
        }
        currentObj[key] = parsedValue;
      }
    }
  }

  return config;
}

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Object} - { valid, errors, warnings }
 */
function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // 检查必填字段
  for (const [field, schema] of Object.entries(REQUIRED_FIELDS)) {
    if (schema.required && !(field in config)) {
      errors.push(`缺少必填字段: ${field}`);
      continue;
    }

    if (field in config) {
      const value = config[field];

      // 类型检查
      if (schema.type === 'enum' && !schema.values.includes(value)) {
        errors.push(`字段 ${field} 的值 "${value}" 无效，必须是: ${schema.values.join(', ')}`);
      }

      // 嵌套对象检查
      if (schema.nested && typeof value === 'object') {
        for (const [nestedField, nestedSchema] of Object.entries(schema.nested)) {
          if (nestedSchema.required && !(nestedField in value)) {
            errors.push(`缺少必填字段: ${field}.${nestedField}`);
          }
        }
      }
    }
  }

  // 检查未知字段（警告）
  const knownFields = new Set(Object.keys(REQUIRED_FIELDS));
  for (const key of Object.keys(config)) {
    if (!knownFields.has(key)) {
      warnings.push(`未知字段: ${key}（将被忽略）`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 读取配置文件
 * @param {string} projectDir - 项目目录
 * @returns {Object|null} - 配置对象或 null
 */
function readConfig(projectDir) {
  const { found, path: configPath } = findConfigFile(projectDir);

  if (!found) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = parseSimpleYAML(content);
    return config;
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return null;
  }
}

/**
 * 转义 YAML 字符串值
 * @param {string} value - 值
 * @returns {string} - 转义后的值
 */
function escapeYAMLString(value) {
  if (typeof value !== 'string') {
    return String(value);
  }

  const needsQuoting = /[:#\n\r\t"'\\]|^\s|\s$/.test(value);
  if (!needsQuoting) {
    return value;
  }

  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  }"`;
}

/**
 * 将配置对象转换为 YAML 格式
 * @param {Object} config - 配置对象
 * @returns {string} - YAML 格式字符串
 */
function configToYAML(config) {
  const lines = [];

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 嵌套对象
      lines.push(`${key}:`);
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        lines.push(`  ${nestedKey}: ${escapeYAMLString(nestedValue)}`);
      }
    } else {
      lines.push(`${key}: ${escapeYAMLString(value)}`);
    }
  }

  return lines.join('\n');
}

/**
 * 写入配置文件
 * @param {string} projectDir - 项目目录
 * @param {Object} config - 配置对象
 * @returns {boolean} - 成功状态
 */
function writeConfig(projectDir, config) {
  const configPath = path.join(projectDir, NEW_CONFIG_FILENAME);

  try {
    // 备份现有配置
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.copyFileSync(configPath, backupPath);
    }

    const yamlContent = configToYAML(config);
    const content = `# Horspowers Configuration
# Version: ${config.version || CONFIG_VERSION}
# Generated: ${new Date().toISOString()}

${yamlContent}
`;

    fs.writeFileSync(configPath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing config file: ${error.message}`);
    return false;
  }
}

/**
 * 迁移旧版配置到新版
 * @param {string} oldPath - 旧配置文件路径
 * @param {string} projectDir - 项目目录
 * @returns {Object} - { success, message }
 */
function migrateOldConfig(oldPath, projectDir) {
  try {
    // 读取旧配置
    const oldContent = fs.readFileSync(oldPath, 'utf8');
    const oldConfig = parseSimpleYAML(oldContent);

    // 合并默认配置（保留用户自定义值，添加缺失字段）
    const newConfig = {
      ...DEFAULT_CONFIG,
      ...oldConfig,
      version: CONFIG_VERSION // 更新版本
    };

    // 验证合并后的配置
    const validation = validateConfig(newConfig);
    if (!validation.valid) {
      return {
        success: false,
        message: `迁移后配置无效: ${validation.errors.join(', ')}`
      };
    }

    // 写入新配置
    if (writeConfig(projectDir, newConfig)) {
      return {
        success: true,
        message: '配置已成功迁移到新版格式',
        oldConfig,
        newConfig
      };
    }

    return { success: false, message: '写入新配置文件失败' };
  } catch (error) {
    return {
      success: false,
      message: `迁移失败: ${error.message}`
    };
  }
}

/**
 * 检查配置是否需要更新
 * @param {Object} config - 当前配置
 * @returns {Object} - { needsUpdate, reason, missingFields }
 */
function checkConfigUpdate(config) {
  const missingFields = [];
  const configVersion = config.version || '0.0.0';

  // 简单的版本比较
  const needsVersionUpdate = compareVersions(configVersion, CONFIG_VERSION) < 0;

  // 检查缺失的可选字段
  if (!config.documentation) {
    missingFields.push('documentation (默认启用)');
  }

  const needsUpdate = needsVersionUpdate || missingFields.length > 0;

  return {
    needsUpdate,
    reason: needsVersionUpdate ? `配置版本 (${configVersion}) 低于当前版本 (${CONFIG_VERSION})` : '配置缺少新版本字段',
    missingFields
  };
}

/**
 * 比较版本号
 * @param {string} v1 - 版本1
 * @param {string} v2 - 版本2
 * @returns {number} - -1 (v1<v2), 0 (v1=v2), 1 (v1>v2)
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * 更新配置文件（合并新字段）
 * @param {string} projectDir - 项目目录
 * @param {Object} currentConfig - 当前配置
 * @returns {Object} - { success, message, updatedConfig }
 */
function updateConfig(projectDir, currentConfig) {
  try {
    // 合并配置（保留用户自定义值）
    const updatedConfig = {
      ...currentConfig,
      version: CONFIG_VERSION
    };

    // 自动添加缺失的可选字段
    if (!updatedConfig.documentation) {
      updatedConfig.documentation = { enabled: true };
    }

    // 写入更新后的配置
    if (writeConfig(projectDir, updatedConfig)) {
      return {
        success: true,
        message: '配置已更新到最新版本',
        updatedConfig
      };
    }

    return { success: false, message: '写入配置文件失败' };
  } catch (error) {
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}

/**
 * 初始化配置文件（首次使用）
 * @param {string} projectDir - 项目目录
 * @param {string} mode - 开发模式 ('personal' | 'team')
 * @returns {Object} - { success, message }
 */
function initializeConfig(projectDir, mode = 'personal') {
  const config = {
    ...DEFAULT_CONFIG,
    development_mode: mode,
    // 根据模式设置其他默认值
    branch_strategy: mode === 'team' ? 'worktree' : 'simple',
    testing_strategy: mode === 'team' ? 'tdd' : 'test-after',
    completion_strategy: mode === 'team' ? 'pr' : 'merge'
  };

  if (writeConfig(projectDir, config)) {
    return {
      success: true,
      message: `配置文件已创建（${mode} 模式）`,
      config
    };
  }

  return { success: false, message: '创建配置文件失败' };
}

/**
 * 获取配置模板内容
 * @returns {string} - 模板内容
 */
function getTemplate() {
  return CONFIG_TEMPLATE;
}

/**
 * 获取初始配置询问结构
 * @returns {Object} - AskUserQuestion 兼容结构
 */
function promptForInitialConfig() {
  return {
    questions: [
      {
        question: '请选择你的开发模式：',
        header: '开发模式',
        options: [
          {
            label: '个人开发者',
            description: '单人开发，使用简化的工作流程（普通分支、本地合并、可选测试）'
          },
          {
            label: '团队协作',
            description: '团队开发，使用完整的工作流程（worktree 隔离、PR 流程、TDD）'
          }
        ],
        multiSelect: false
      }
    ]
  };
}

/**
 * 保留向后兼容的旧 API
 */
function detectConfig(projectDir) {
  const { path: configPath } = findConfigFile(projectDir);
  return {
    found: !!configPath,
    path: configPath
  };
}

export {
  // 文件检测
  detectConfigFiles,
  findConfigFile,
  detectConfig, // 向后兼容
  readConfig,

  // 配置验证
  validateConfig,
  checkConfigUpdate,

  // 配置操作
  writeConfig,
  migrateOldConfig,
  updateConfig,
  initializeConfig,

  // 工具函数
  getTemplate,
  promptForInitialConfig,
  compareVersions,
  CONFIG_VERSION,
  NEW_CONFIG_FILENAME,
  OLD_CONFIG_FILENAME,
  DEFAULT_CONFIG
};
