# 根本原因追踪

## 概述

Bug 通常在调用栈的深处表现出来（git init 在错误的目录、文件创建在错误的位置、数据库以错误的路径打开）。你的直觉是在错误出现的地方修复，但那只是在治标。

**核心原则：** 在调用链中反向追踪直到找到原始触发点，然后在源头修复。

## 何时使用

```dot
digraph when_to_use {
    "Bug 出现在栈的深处?" [shape=diamond];
    "能反向追踪吗?" [shape=diamond];
    "在症状点修复" [shape=box];
    "追踪到原始触发点" [shape=box];
    "更好：同时添加纵深防御" [shape=box];

    "Bug 出现在栈的深处?" -> "能反向追踪吗?" [label="是"];
    "能反向追踪吗?" -> "追踪到原始触发点" [label="是"];
    "能反向追踪吗?" -> "在症状点修复" [label="否 - 死胡同"];
    "追踪到原始触发点" -> "更好：同时添加纵深防御";
}
```

**使用场景：**
- 错误发生在执行深处（不在入口点）
- 堆栈跟踪显示长调用链
- 不清楚无效数据从哪里产生
- 需要找到哪个测试/代码触发了问题

## 追踪过程

### 1. 观察症状
```
Error: git init failed in /Users/jesse/project/packages/core
```

### 2. 找到直接原因
**哪段代码直接导致了这个问题？**
```typescript
await execFileAsync('git', ['init'], { cwd: projectDir });
```

### 3. 问：谁调用了它？
```typescript
WorktreeManager.createSessionWorktree(projectDir, sessionId)
  → 被 Session.initializeWorkspace() 调用
  → 被 Session.create() 调用
  → 被 Project.create() 处的测试调用
```

### 4. 继续向上追踪
**传递了什么值？**
- `projectDir = ''`（空字符串！）
- 空字符串作为 `cwd` 会解析为 `process.cwd()`
- 那就是源代码目录！

### 5. 找到原始触发点
**空字符串从哪里来？**
```typescript
const context = setupCoreTest(); // 返回 { tempDir: '' }
Project.create('name', context.tempDir); // 在 beforeEach 之前访问！
```

## 添加堆栈跟踪

当你无法手动追踪时，添加插桩：

```typescript
// 在有问题的操作之前
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });

  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**关键：** 在测试中使用 `console.error()`（而不是 logger - 可能不会显示）

**运行并捕获：**
```bash
npm test 2>&1 | grep 'DEBUG git init'
```

**分析堆栈跟踪：**
- 查找测试文件名
- 找到触发调用的行号
- 识别模式（同一个测试？同一个参数？）

## 找到哪个测试造成了污染

如果测试期间出现了某些东西但你不知道是哪个测试：

使用本目录中的二分查找脚本 `find-polluter.sh`：

```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```

逐个运行测试，在找到第一个污染者时停止。详见脚本用法。

## 实际示例：空的 projectDir

**症状：** `.git` 在 `packages/core/`（源代码）中被创建

**追踪链：**
1. `git init` 在 `process.cwd()` 中运行 ← 空的 cwd 参数
2. WorktreeManager 被传入空的 projectDir
3. Session.create() 传入了空字符串
4. 测试在 beforeEach 之前访问了 `context.tempDir`
5. setupCoreTest() 初始时返回 `{ tempDir: '' }`

**根本原因：** 顶层变量初始化访问了空值

**修复：** 将 tempDir 改为 getter，如果在 beforeEach 之前访问则抛出异常

**同时添加了纵深防御：**
- 第1层：Project.create() 验证目录
- 第2层：WorkspaceManager 验证非空
- 第3层：NODE_ENV 守卫拒绝在临时目录之外执行 git init
- 第4层：在 git init 之前记录堆栈跟踪

## 关键原则

```dot
digraph principle {
    "找到了直接原因" [shape=ellipse];
    "能向上追踪一层吗?" [shape=diamond];
    "反向追踪" [shape=box];
    "这是源头吗?" [shape=diamond];
    "在源头修复" [shape=box];
    "在每一层添加验证" [shape=box];
    "Bug 不可能再发生" [shape=doublecircle];
    "绝不只修复症状" [shape=octagon, style=filled, fillcolor=red, fontcolor=white];

    "找到了直接原因" -> "能向上追踪一层吗?";
    "能向上追踪一层吗?" -> "反向追踪" [label="是"];
    "能向上追踪一层吗?" -> "绝不只修复症状" [label="否"];
    "反向追踪" -> "这是源头吗?";
    "这是源头吗?" -> "反向追踪" [label="否 - 继续追踪"];
    "这是源头吗?" -> "在源头修复" [label="是"];
    "在源头修复" -> "在每一层添加验证";
    "在每一层添加验证" -> "Bug 不可能再发生";
}
```

**绝不只在错误出现的地方修复。** 反向追踪找到原始触发点。

## 堆栈跟踪技巧

**在测试中：** 使用 `console.error()` 而不是 logger - logger 可能被抑制
**在操作之前：** 在危险操作之前记录日志，而不是在失败之后
**包含上下文：** 目录、cwd、环境变量、时间戳
**捕获堆栈：** `new Error().stack` 显示完整的调用链

## 实际影响

来自调试会话（2025-10-03）：
- 通过5层追踪找到了根本原因
- 在源头修复（getter 验证）
- 添加了4层防御
- 1847个测试通过，零污染
