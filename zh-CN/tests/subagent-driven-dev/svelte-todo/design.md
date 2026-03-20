# Svelte 待办事项列表 - 设计

## 概述

一个使用 Svelte 构建的简单待办事项列表应用。支持创建、完成和删除待办事项，并具备 localStorage 持久化功能。

## 功能

* 添加新待办事项
* 将待办事项标记为完成/未完成
* 删除待办事项
* 按以下方式筛选：全部 / 进行中 / 已完成
* 清除所有已完成的待办事项
* 持久化到 localStorage
* 显示剩余项目数量

## 用户界面

```
┌─────────────────────────────────────────┐
│  Svelte Todos                           │
├─────────────────────────────────────────┤
│  [________________________] [Add]       │
├─────────────────────────────────────────┤
│  [ ] Buy groceries                  [x] │
│  [✓] Walk the dog                   [x] │
│  [ ] Write code                     [x] │
├─────────────────────────────────────────┤
│  2 items left                           │
│  [All] [Active] [Completed]  [Clear ✓]  │
└─────────────────────────────────────────┘
```

## 组件

```
src/
  App.svelte           # Main app, state management
  lib/
    TodoInput.svelte   # Text input + Add button
    TodoList.svelte    # List container
    TodoItem.svelte    # Single todo with checkbox, text, delete
    FilterBar.svelte   # Filter buttons + clear completed
    store.ts           # Svelte store for todos
    storage.ts         # localStorage persistence
```

## 数据模型

```typescript
interface Todo {
  id: string;        // UUID
  text: string;      // Todo text
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';
```

## 验收标准

1. 可以通过输入并按 Enter 键或点击"添加"来添加待办事项
2. 可以通过点击复选框来切换待办事项的完成状态
3. 可以通过点击 X 按钮来删除待办事项
4. 筛选按钮显示正确的待办事项子集
5. "X 项待办"显示未完成的待办事项数量
6. "清除已完成"移除所有已完成的待办事项
7. 待办事项在页面刷新后仍然存在（localStorage）
8. 空状态显示有帮助的信息
9. 所有测试通过
