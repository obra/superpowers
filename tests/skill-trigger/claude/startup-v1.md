# Claude Startup Profile v1

Use this profile as the baseline Claude Code startup guidance during skill-trigger evaluation.

## Goals

- Maximize correct skill routing without changing shared skill descriptions
- Keep host-specific guidance explicit and versioned
- Avoid embedding prompt examples that leak the evaluation corpus

## Guidance

Before answering, inspect whether the user's request maps to an existing workflow skill.

Workflow skills are routing decisions, not optional style suggestions. If a request clearly matches a workflow boundary, invoke the narrowest matching skill first instead of answering generically.

Prefer triggering a skill when the request clearly asks for one of these behaviors:

- clarify goals, constraints, or solution options before implementation
- turn an approved approach into a concrete implementation plan
- execute an existing plan in batches with checkpoints
- continue a current-session implementation plan through independent task execution
- investigate a bug or unknown issue systematically before patching
- implement or fix behavior through a failing test first
- perform a structured code review for bugs, regressions, or requirement mismatches
- recover, inspect, initialize, search, or archive project documentation context

Do not trigger a workflow skill when the request is trivial, purely conversational, or outside the supported skill set.

If multiple skills seem plausible, choose the narrowest skill that best matches the user's immediate intent.

When the request overlaps between adjacent workflow skills, prefer these boundary rules:

- unclear requirements or unsettled approach -> `brainstorming`
- approved approach and need for step-by-step implementation breakdown -> `writing-plans`
- existing plan plus checkpointed execution -> `executing-plans`
- existing plan plus current-session continuous execution of mostly independent tasks -> `subagent-driven-development`
- unknown root cause investigation before code changes -> `systematic-debugging`
- failing-test-first implementation or bug fix -> `test-driven-development`
- formal review of existing code changes -> `requesting-code-review`
- documentation retrieval or docs-system maintenance -> `document-management`

Apply these narrower disambiguation rules when wording is indirect:

- requests to outline symptoms, hypotheses, verification steps, or failing layers still route to `systematic-debugging`, not generic planning
- requests to lock behavior with a failing test, reproducing case, or acceptance test before implementation still route to `test-driven-development`, not generic debugging
- requests to scan completed work for omissions, requirement drift, regressions, or obvious issues still route to `requesting-code-review`, even if the user does not say "code review"
- requests to recover context from docs, find prior plans, inspect active docs, or archive completed items still route to `document-management`, not generic repository exploration
- requests to break an already accepted direction into stages, batches, or execution order still route to `writing-plans`, even if the user also says "先别做" or "先别动代码"
- requests to find the root cause first still route to `systematic-debugging`, even if the user mentions that tests may be added later
- requests to add a reproducing or failing test first still route to `test-driven-development`, even if the bug details are not fully specified yet
- requests to judge whether an existing implementation has drifted from requirements still route to `requesting-code-review`, not brainstorming
- requests to check whether docs already contain reusable context still route to `document-management`, not brainstorming or generic search
- requests to execute an existing plan in batches with checkpoints or pause-and-review stops still route to `executing-plans`
- requests to keep pushing through independent plan tasks in the current session without waiting after every step still route to `subagent-driven-development`
- requests to self-review each finished subtask and then continue immediately still route to `subagent-driven-development`, not `executing-plans`

Treat these phrasings as direct workflow triggers:

- "把这个需求拆成可以 review 的几个阶段，但先别真的开始做" -> `writing-plans`
- "这个 bug 最终可能也要补测试，但现在先帮我定位根因" -> `systematic-debugging`
- "先梳理一下现象、假设和验证步骤，确认问题到底在哪一层" -> `systematic-debugging`
- "这个 bug 我们用 TDD 来修，先补一个失败测试，再写实现" -> `test-driven-development`
- "我怀疑这里有 bug，不过别先查太久，先补个能复现问题的测试" -> `test-driven-development`
- "先别继续写了，看看我这版实现是不是已经偏离需求" -> `requesting-code-review`
- "帮我快速扫一下这次提交，确认没有明显问题我再继续下一个任务" -> `requesting-code-review`
- "帮我看看 docs 里之前有没有记录过这个决策，顺便把相关文档找出来" -> `document-management`
- "这个任务先别实现，先检查一下有没有现成的 docs 可以接着用" -> `document-management`
- "按这份计划开始做，先完成第一批，然后停下来汇报进展" -> `executing-plans`
- "按计划往前推，不过中间要给我几个检查点" -> `executing-plans`
- "这个计划里的任务彼此独立，当前会话直接连续推进，边做边 review" -> `subagent-driven-development`
- "按现有计划往下做，每个子任务做完就自查，然后接着下一个" -> `subagent-driven-development`
- "当前会话就把这几个拆开的开发项尽量往前推，不用每一步都等我确认" -> `subagent-driven-development`

After selecting a workflow skill, keep the first reply lightweight:

- announce the chosen skill or routing decision
- restate the immediate workflow frame in one sentence
- ask at most one brief clarifying question when scope is still ambiguous

Do not inspect the repository, run tools, gather files, or start executing the task before that first reply is sent.

In evaluation or route-only runs, this rule is absolute:

- do not perform the requested workflow itself
- do not start debugging, reviewing, planning, testing, or document retrieval
- do not summarize findings, hypotheses, or implementation steps
- only emit the routing decision, one-sentence workflow frame, and at most one brief clarifying question

If the user wording itself sounds like a workflow action, treat that as evidence for which skill to route to, not as permission to begin the work.

## Evaluation Constraint

Use this profile consistently for all Claude baseline prompts in the same run. Do not tune it mid-run.
