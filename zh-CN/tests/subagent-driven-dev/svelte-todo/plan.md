# Svelte 待办事项列表 - 实施计划

使用 `superpowers:subagent-driven-development` 技能执行此计划。

## 背景

使用 Svelte 构建一个待办事项列表应用。完整规范请参见 `design.md`。

## 任务

### 任务 1：项目设置

使用 Vite 创建 Svelte 项目。

**执行：**

* 运行 `npm create vite@latest . -- --template svelte-ts`
* 使用 `npm install` 安装依赖项
* 验证开发服务器正常工作
* 清理 App.svelte 中默认的 Vite 模板内容

**验证：**

* `npm run dev` 启动服务器
* 应用显示最小的 "Svelte Todos" 标题
* `npm run build` 成功

***

### 任务 2：待办事项存储

创建用于状态管理的 Svelte store。

**执行：**

* 创建 `src/lib/store.ts`
* 定义 `Todo` 接口，包含 id、text、completed
* 创建具有初始空数组的可写 store
* 导出函数：`addTodo(text)`、`toggleTodo(id)`、`deleteTodo(id)`、`clearCompleted()`
* 创建 `src/lib/store.test.ts`，包含每个函数的测试

**验证：**

* 测试通过：`npm run test`（如果需要，安装 vitest）

***

### 任务 3：localStorage 持久化

为待办事项添加持久化层。

**执行：**

* 创建 `src/lib/storage.ts`
* 实现 `loadTodos(): Todo[]` 和 `saveTodos(todos: Todo[])`
* 优雅地处理 JSON 解析错误（返回空数组）
* 与 store 集成：初始化时加载，更改时保存
* 为加载/保存/错误处理添加测试

**验证：**

* 测试通过
* 手动测试：添加待办事项，刷新页面，待办事项持久化

***

### 任务 4：TodoInput 组件

创建用于添加待办事项的输入组件。

**执行：**

* 创建 `src/lib/TodoInput.svelte`
* 文本输入绑定到本地状态
* 添加按钮调用 `addTodo()` 并清空输入
* 回车键也可提交
* 输入为空时禁用添加按钮
* 添加组件测试

**验证：**

* 测试通过
* 组件渲染输入框和按钮

***

### 任务 5：TodoItem 组件

创建单个待办事项项组件。

**执行：**

* 创建 `src/lib/TodoItem.svelte`
* 属性：`todo: Todo`
* 复选框切换完成状态（调用 `toggleTodo`）
* 完成时文本有删除线
* 删除按钮（X）调用 `deleteTodo`
* 添加组件测试

**验证：**

* 测试通过
* 组件渲染复选框、文本、删除按钮

***

### 任务 6：TodoList 组件

创建列表容器组件。

**执行：**

* 创建 `src/lib/TodoList.svelte`
* 属性：`todos: Todo[]`
* 为每个待办事项渲染 TodoItem
* 为空时显示 "No todos yet"
* 添加组件测试

**验证：**

* 测试通过
* 组件渲染 TodoItem 列表

***

### 任务 7：FilterBar 组件

创建过滤器和状态栏组件。

**执行：**

* 创建 `src/lib/FilterBar.svelte`
* 属性：`todos: Todo[]`、`filter: Filter`、`onFilterChange: (f: Filter) => void`
* 显示数量："X items left"（未完成数量）
* 三个过滤器按钮：全部、进行中、已完成
* 活动过滤器视觉上高亮显示
* "清除已完成" 按钮（没有已完成待办事项时隐藏）
* 添加组件测试

**验证：**

* 测试通过
* 组件渲染数量、过滤器、清除按钮

***

### 任务 8：应用集成

在 App.svelte 中将所有组件连接起来。

**执行：**

* 导入所有组件和 store
* 添加过滤器状态（默认：'all'）
* 根据过滤器状态计算过滤后的待办事项
* 渲染：标题、TodoInput、TodoList、FilterBar
* 向每个组件传递适当的属性

**验证：**

* 应用渲染所有组件
* 添加待办事项有效
* 切换状态有效
* 删除有效

***

### 任务 9：过滤功能

确保端到端的过滤工作。

**执行：**

* 验证过滤器按钮更改显示的待办事项
* 'all' 显示所有待办事项
* 'active' 仅显示未完成的待办事项
* 'completed' 仅显示已完成的待办事项
* 清除已完成会移除已完成的待办事项，并在需要时重置过滤器
* 添加集成测试

**验证：**

* 过滤器测试通过
* 手动验证所有过滤器状态

***

### 任务 10：样式和优化

为可用性添加 CSS 样式。

**执行：**

* 将应用样式设置为与设计稿匹配
* 已完成的待办事项有删除线和柔和颜色
* 活动过滤器按钮高亮显示
* 输入框具有焦点样式
* 删除按钮在悬停时显示（或在移动设备上始终显示）
* 响应式布局

**验证：**

* 应用在视觉上可用
* 样式不会破坏功能

***

### 任务 11：端到端测试

为完整的用户流程添加 Playwright 测试。

**执行：**

* 安装 Playwright：`npm init playwright@latest`
* 创建 `tests/todo.spec.ts`
* 测试流程：
  * 添加待办事项
  * 完成待办事项
  * 删除待办事项
  * 过滤待办事项
  * 清除已完成
  * 持久化（添加、重新加载、验证）

**验证：**

* `npx playwright test` 通过

***

### 任务 12：README

记录项目。

**执行：**

* 创建 `README.md`，包含：
  * 项目描述
  * 设置：`npm install`
  * 开发：`npm run dev`
  * 测试：`npm test` 和 `npx playwright test`
  * 构建：`npm run build`

**验证：**

* README 准确描述项目
* 说明有效
