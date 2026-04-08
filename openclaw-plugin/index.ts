/**
 * OpenClaw Superpowers Plugin
 *
 * 注册兼容工具，使 Skills 文档可以直接引用 Claude Code 中的工具名
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

// TODO.md 文件操作工具的实现
// 注意：这需要插件能访问文件系统，实际使用时 OpenClaw 会提供相应的能力
function createTodoWriteTool(api: any) {
  return {
    name: "TodoWrite",
    label: "TodoWrite",
    description: `
Create and update task list in project root's TODO.md file using Markdown checkboxes.

Use this tool to track progress on multi-step tasks. When creating tasks:
- Create one task per checklist item
- Each task should have a clear subject and description
- Use - [ ] for pending tasks, - [x] for completed tasks
- Organize tasks by priority or dependency

Example TODO.md format:
# Tasks

## In Progress
- [ ] Implement authentication flow
  - Add login endpoint
  - Add session management

## Pending
- [ ] Write tests for auth
- [ ] Update documentation
    `.trim(),
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        create: {
          type: "string",
          description: "Create a new todo task (format: '- [ ] Task description')"
        },
        update: {
          type: "string",
          description: "Update an existing task (provide the task line to replace)"
        },
        complete: {
          type: "string",
          description: "Mark a task as complete (provide the task description)"
        },
        delete: {
          type: "string",
          description: "Delete a task (provide the task description)"
        },
        list: {
          type: "boolean",
          description: "List all current tasks"
        }
      }
    },
    async execute(_id: string, input: any) {
      // 注意：这是一个简化实现
      // 实际使用时，需要通过 OpenClaw 的文件操作 API 来读写 TODO.md
      // 这里我们返回说明，引导用户使用 write/edit 工具

      const instructions = `
To manage TODO.md, use the write or edit tool directly:

**Create new task:**
Use edit to append to TODO.md:
- [ ] Your task description here

**Mark task complete:**
Use edit to change - [ ] to - [x]

**Delete task:**
Use edit to remove the task line

Current TODO.md path: TODO.md (project root)
      `.trim();

      return {
        content: [{ type: "text" as const, text: instructions }],
        details: { note: "This tool provides guidance. Use write/edit tools directly to modify TODO.md" }
      };
    }
  };
}

// dispatch_agent 工具的实现
function createDispatchAgentTool(api: any) {
  return {
    name: "dispatch_agent",
    label: "Dispatch Agent",
    description: `
Dispatch a subagent to handle a specific task independently.

Use this when you need to:
- Run parallel independent tasks
- Delegate focused work to a specialist agent
- Execute background research or analysis

The subagent runs in a separate session with its own context.
    `.trim(),
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["prompt"],
      properties: {
        prompt: {
          type: "string",
          description: "The task/prompt for the subagent to execute"
        },
        agentId: {
          type: "string",
          description: "Optional agent ID to use (defaults to main agent)"
        },
        timeoutMs: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000)"
        },
        deliver: {
          type: "boolean",
          description: "Whether to deliver results to main session (default: false)"
        }
      }
    },
    async execute(_id: string, input: any) {
      try {
        const { prompt, agentId, timeoutMs = 30000, deliver = false } = input;

        // 使用 OpenClaw 的 subagent runtime
        const { runId } = await api.runtime.subagent.run({
          sessionKey: agentId || "agent:main:subagent:dispatched",
          message: prompt,
          deliver,
        });

        // 等待完成
        const result = await api.runtime.subagent.waitForRun({
          runId,
          timeoutMs,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, runId, result: result?.output || result }, null, 2) }],
          details: { runId, result: result?.output || result }
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: error.message || "Failed to dispatch agent" }, null, 2) }],
          details: { error: error.message || "Failed to dispatch agent" }
        };
      }
    }
  };
}

// 导出插件入口
export default definePluginEntry({
  id: "openclaw-superpowers",
  name: "Superpowers",
  description: "14 workflow skills with Chinese triggers: TDD, debugging, code review, planning and more",
  register(api) {
    // 注册 dispatch_agent 工具
    api.registerTool(createDispatchAgentTool(api));

    // 注册 TodoWrite 工具
    api.registerTool(createTodoWriteTool(api));
  },
});
