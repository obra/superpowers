# SuperVibe Flow Stages

## Overview

```
Start → Design → Plan → Implement → Finish
  │        │        │        │         │
  │        │        │        │         └─ State → Closed
  │        │        │        └─ Progress comments
  │        │        └─ Optional subtasks
  │        └─ Design summary comment
  └─ State → Active
```

## ADO Comment Helper

**重要:** Comments 必须使用 **HTML 格式**，不支持 Markdown 渲染。

```bash
# 添加 ADO Comment 的通用方法
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "<h2>标题</h2><p>内容</p>"}'
```

**HTML 格式规范：**
| 元素 | HTML 标签 |
|------|-----------|
| 标题 | `<h2>`, `<h3>` |
| 段落 | `<p>` |
| 粗体 | `<strong>` |
| 代码 | `<code>` |
| 表格 | `<table><tr><th>/<td>` |
| 列表 | `<ul><li>` 或 `<ol><li>` |

---

## Stage 1: Start

**Trigger:** User says `/supervibe {id}` or describes task intent

**Actions:**

1. Parse Work Item ID from input
   - If ID provided: use directly
   - If not: ask user for ID or search by keyword

2. Fetch Work Item details:
   ```bash
   az boards work-item show --id {id}
   ```

3. Fetch relations:
   ```bash
   az boards work-item relation list --id {id}
   ```

4. Display task info:
   ```
   📋 Work Item #{id}
   ──────────────────
   Title: {title}

   Description:
   {description}

   Acceptance Criteria:
   {acceptance_criteria}

   Dependencies:
   - #{dep_id}【{dep_title}】{dep_state}

   Blocked by this:
   - #{blocked_id}【{blocked_title}】
   ```

5. Update ADO state:
   ```bash
   az boards work-item update --id {id} --state "Active"
   ```

6. Create local state file:
   ```bash
   mkdir -p .supervibe
   echo '{"workItemId": {id}, "stage": "start", "startedAt": "{timestamp}"}' > .supervibe/current.json
   ```

7. Add ADO Comment (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h2>🚀 任务启动</h2>

<p>SuperVibe 开始处理此任务。</p>

<table>
<tr><th>信息</th><th>值</th></tr>
<tr><td><strong>当前阶段</strong></td><td>Design（设计）</td></tr>
<tr><td><strong>操作人</strong></td><td>{user}</td></tr>
<tr><td><strong>时间</strong></td><td>{timestamp}</td></tr>
</table>

<h3>下一步</h3>
<p>进行需求分析和技术设计。</p>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

8. Ask user: "这个需求清楚吗？有问题现在可以提，没问题我们开始设计。"

**Gate:** User confirms understanding

**ADO Sync:** State → Active, Comment: 任务启动

---

## Stage 2: Design

**Trigger:** User confirms understanding of requirements

<HARD-GATE>
**IMMEDIATELY invoke the `brainstorming` skill using the Skill tool.** Do NOT ask questions, do NOT explore code, do NOT do any other work first. The brainstorming skill will handle all exploration and questioning.
</HARD-GATE>

**Actions:**

1. **FIRST:** Invoke `brainstorming` skill immediately using the Skill tool
   ```
   好的，我们进入设计阶段。现在启动 brainstorming...
   ```
   Then call: `Skill(skill="brainstorming")`

2. The brainstorming skill will:
   - Explore project context
   - Ask clarifying questions
   - Propose approaches
   - Create design doc

3. Wait for brainstorming to complete
   - Design doc should be saved to `docs/plans/YYYY-MM-DD-{feature}-design.md`

4. Extract design summary (first 200 chars or ## Summary section)

5. Add ADO Comment (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h2>📐 设计完成</h2>

<p><strong>设计文档:</strong> <code>{design_doc_path}</code></p>

<h3>概要</h3>
<p>{design_summary}</p>

<h3>技术选型</h3>
<table>
<tr><th>组件</th><th>技术</th></tr>
<tr><td>后端</td><td>{backend}</td></tr>
<tr><td>前端</td><td>{frontend}</td></tr>
<tr><td>数据库</td><td>{database}</td></tr>
</table>

<h3>下一步</h3>
<p>进入计划阶段，制定详细实施计划。</p>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

6. Update local state:
   ```json
   {"workItemId": {id}, "stage": "design", "designDoc": "{path}"}
   ```

7. Ask user: "设计方案已完成并同步到 ADO。接下来制定实施计划？"

**Gate:** Design doc exists in `docs/plans/`

**ADO Sync:** Comment with design summary

---

## Stage 3: Plan

**Trigger:** Design doc saved and approved

<HARD-GATE>
**IMMEDIATELY invoke the `writing-plans` skill using the Skill tool.** Do NOT proceed with any other work. The writing-plans skill will create the implementation plan.
</HARD-GATE>

**Actions:**

1. **FIRST:** Invoke `writing-plans` skill immediately using the Skill tool
   ```
   设计已完成，现在进入计划阶段。启动 writing-plans...
   ```
   Then call: `Skill(skill="writing-plans")`

2. The writing-plans skill will:
   - Reference the design doc
   - Generate detailed implementation plan
   - Save plan to `docs/plans/YYYY-MM-DD-{feature}-implementation.md`

3. Wait for plan completion
   - Plan should be saved to `docs/plans/YYYY-MM-DD-{feature}-implementation.md`

4. Optional: Create ADO subtasks for major plan steps
   ```bash
   az boards work-item create --type "Task" --title "{step_title}" --parent {id}
   ```

5. Add ADO Comment (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h2>📋 计划完成</h2>

<p><strong>实施计划:</strong> <code>{plan_doc_path}</code></p>

<h3>任务列表</h3>
<ol>
<li>{task_1}</li>
<li>{task_2}</li>
<li>{task_3}</li>
</ol>

<h3>预计工作量</h3>
<table>
<tr><th>指标</th><th>数值</th></tr>
<tr><td>任务数</td><td>{task_count}</td></tr>
<tr><td>预计文件</td><td>{file_count}</td></tr>
</table>

<h3>下一步</h3>
<p>进入实现阶段，按 TDD 方式开发。</p>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

6. Update local state:
   ```json
   {"workItemId": {id}, "stage": "plan", "planDoc": "{path}"}
   ```

7. Ask user: "实施计划已就绪。现在开始实现？"

**Gate:** Implementation plan confirmed

**ADO Sync:** Comment: 计划完成, Optional subtask creation

---

## Stage 4: Implement

**Trigger:** Implementation plan confirmed

<HARD-GATE>
**IMMEDIATELY invoke the `test-driven-development` skill using the Skill tool.** Do NOT write any code before invoking this skill. The TDD skill will guide the implementation process.
</HARD-GATE>

**Dry Run Check:**

If `--dry-run` mode is active:
```
═══════════════════════════════════════════════════════════════
🧪 DRY RUN - Implement 阶段

任务列表：
{task_list}

[DRY RUN] 跳过代码生成，以下文件不会被创建：
{file_list}

直接进入 Finish 阶段
═══════════════════════════════════════════════════════════════
```

Then add ADO Comment (REST API + HTML):
```bash
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

COMMENT='<h2>🧪 [DRY RUN] 实现阶段</h2>

<p><strong>⚠️ Dry Run 模式</strong> - 代码未实际生成</p>

<h3>任务列表（未实际执行）</h3>
<ol>
<li>{task_1}</li>
<li>{task_2}</li>
<li>{task_3}</li>
</ol>

<h3>跳过的代码文件</h3>
<ul>
<li><code>{file_1}</code></li>
<li><code>{file_2}</code></li>
<li><code>{file_3}</code></li>
</ul>

<p><strong>共计:</strong> {task_count} 个任务, {file_count} 个文件 <strong>[已跳过]</strong></p>'

curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$COMMENT\"}"
```

Then skip to Stage 5 (Finish).

**Normal Mode Actions:**

1. **FIRST:** Invoke `test-driven-development` skill immediately using the Skill tool
   ```
   计划已就绪，现在进入实现阶段。启动 test-driven-development...
   ```
   Then call: `Skill(skill="test-driven-development")`

2. The TDD skill will:
   - Follow the implementation plan
   - Write tests first, then implementation
   - Guide incremental development

3. Periodically update progress (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h3>进度更新</h3>
<ul>
<li>✅ Task 1 完成</li>
<li>✅ Task 2 完成</li>
<li>🔄 Task 3 进行中...</li>
</ul>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

4. Monitor for completion signals:
   - All plan tasks done
   - Tests passing
   - Code committed

5. Update local state:
   ```json
   {"workItemId": {id}, "stage": "implement", "commits": [...]}
   ```

6. Add ADO Comment (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h2>🔨 实现完成</h2>

<h3>完成的任务</h3>
<ul>
<li>✅ {task_1}</li>
<li>✅ {task_2}</li>
<li>✅ {task_3}</li>
</ul>

<h3>代码统计</h3>
<table>
<tr><th>指标</th><th>数值</th></tr>
<tr><td>文件数</td><td>{file_count}</td></tr>
<tr><td>测试数</td><td>{test_count}</td></tr>
<tr><td>测试状态</td><td>✅ All passing</td></tr>
</table>

<h3>下一步</h3>
<p>进入代码审查阶段。</p>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

7. When implementation complete, ask: "实现已完成，测试通过。进行代码审查？"

**Gate:** Tests pass, code committed

**ADO Sync:** Comment: 实现完成, Progress comments

---

## Stage 5: Finish

**Trigger:** Tests pass, code ready for review

<HARD-GATE>
**IMMEDIATELY invoke the `requesting-code-review` skill using the Skill tool.** Do NOT skip this step. The code review skill will verify the implementation meets requirements.
</HARD-GATE>

**Actions:**

1. **FIRST:** Invoke `requesting-code-review` skill immediately using the Skill tool
   ```
   实现已完成，测试通过。现在进入代码审查阶段。启动 requesting-code-review...
   ```
   Then call: `Skill(skill="requesting-code-review")`

2. The code review skill will:
   - Review implementation against design doc
   - Check test coverage
   - Verify acceptance criteria

3. Wait for review approval

4. Generate completion summary

5. Add ADO Comment (REST API + HTML):
   ```bash
   TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

   COMMENT='<h2>✅ 任务完成</h2>

<table>
<tr><th>信息</th><th>值</th></tr>
<tr><td><strong>Work Item</strong></td><td>#{id} {title}</td></tr>
<tr><td><strong>完成时间</strong></td><td>{timestamp}</td></tr>
</table>

<h3>📦 产出物</h3>
<table>
<tr><th>类型</th><th>路径</th></tr>
<tr><td>设计文档</td><td><code>{design_doc}</code></td></tr>
<tr><td>实施计划</td><td><code>{plan_doc}</code></td></tr>
<tr><td>代码</td><td><code>{code_path}</code></td></tr>
</table>

<h3>实现内容</h3>
<p>{implementation_summary}</p>

<h3>测试覆盖</h3>
<ul>
<li>✅ {test_count} tests passing</li>
<li>覆盖率: {coverage}%</li>
</ul>

<hr/>
<p>🎉 <strong>任务已完成！</strong></p>'

   curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"$COMMENT\"}"
   ```

6. Update ADO state:
   ```bash
   az boards work-item update --id {id} --state "Closed"
   ```

7. Check for dependent Work Items:
   ```bash
   az boards work-item relation list --id {id}
   # Filter for Successor relations
   ```

8. Notify about unblocked items:
   ```
   🎉 任务完成！

   📢 提醒：以下任务现在可以开始了：
   - #{dep_id}【{dep_title}】负责人: {assignee}
   ```

9. Clean up local state:
   ```bash
   mv .supervibe/current.json .supervibe/history/{id}.json
   ```

**Gate:** Code review passed

**ADO Sync:** State → Closed, completion summary

---

## Interruption Handling

If session interrupted mid-stage:

1. Check `.supervibe/current.json` on next `/supervibe` call
2. If exists, ask user:
   ```
   发现未完成的任务 #{id}【{title}】，当前在 {stage} 阶段。

   要继续这个任务还是开始新任务？
   ```
3. If continue: resume from current stage
4. If new: archive current to history, start fresh

---

## Error Handling

### ADO Connection Failed

```
⚠️ 无法连接 Azure DevOps。请检查：
1. az login 是否已执行？
2. 网络连接是否正常？
3. 组织和项目配置是否正确？

运行 az account show 检查状态。
```

### Work Item Not Found

```
⚠️ 找不到 Work Item #{id}。请检查：
1. ID 是否正确？
2. 是否有权限访问该 Work Item？
```

### State Update Failed

```
⚠️ 无法更新 Work Item 状态。可能原因：
1. 状态转换不允许（如 Closed → Active）
2. 权限不足

继续进行，稍后手动更新 ADO。
```
