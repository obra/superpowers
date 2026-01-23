# Bug: Windows 平台 doc-init 命令失败

## 基本信息
- 创建时间: 2026-01-23
- 优先级: 高
- 影响范围: Windows 平台用户

## Bug 描述

在 Windows 平台上执行 `doc-init` 命令时失败，涉及 `docs-core.js` 路径处理问题和环境变量兼容性问题。

## 潜在原因分析

### 问题 1: 路径分隔符硬编码 (docs-core.js:478)

```javascript
// lib/docs-core.js:478
const basename = filename.split('/').pop();
```

**问题：** Windows 使用 `\` 作为路径分隔符，硬编码的 `/` 会导致路径解析失败。

**影响范围：**
- `extractDocType()` 方法无法正确提取文档类型
- 可能导致文档分类、搜索、统计等功能异常

### 问题 2: 环境变量语法

doc-init 使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量：

```bash
node -e "
const DocsCore = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new DocsCore(process.cwd());
```

**潜在问题：**
- Windows cmd 使用 `%CLAUDE_PLUGIN_ROOT%` 语法
- PowerShell 使用 `$env:CLAUDE_PLUGIN_ROOT` 语法
- 转义的 `\$` 在某些 Windows 环境下可能无法正确展开

### 问题 3: Node.js -e 参数的引号处理

嵌套的引号和变量展开在 Windows 下可能失败：

```bash
node -e "
const DocsCore = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
...
```

Windows cmd 和 PowerShell 对引号的处理方式与 Unix shell 不同。

## 修复建议

### 修复 1: 使用 path.basename() 替代字符串分割

```javascript
// lib/docs-core.js:478
// 修复前:
const basename = filename.split('/').pop();

// 修复后:
const basename = path.basename(filename);
```

### 修复 2: 使用跨平台的路径处理方法

确保所有路径操作都使用 Node.js `path` 模块的方法：
- `path.join()` - 连接路径
- `path.basename()` - 提取文件名
- `path.dirname()` - 提取目录名
- `path.relative()` - 计算相对路径
- `path.resolve()` - 解析为绝对路径

### 修复 3: 环境变量获取改为 Node.js 内部获取

在 Node.js 代码中直接使用 `process.env.CLAUDE_PLUGIN_ROOT` 而非依赖 shell 展开：

```javascript
// 在 lib/docs-core.js 中添加
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname;
```

## 验收标准

- [ ] docs-core.js 中所有路径操作使用 path 模块方法
- [ ] Windows 平台 doc-init 能正常执行
- [ ] 文档类型提取、分类、搜索等功能在 Windows 下正常工作
- [ ] 在 Windows 环境下测试通过

## 相关文件

- [lib/docs-core.js](../lib/docs-core.js)
- [skills/document-management/SKILL.md](../skills/document-management/SKILL.md)

## 进展记录

- 2026-01-23: Bug 创建 - 待修复
- 2026-01-23: 代码分析完成，发现 docs-core.js:478 路径分隔符硬编码问题
