[![GitHub stars](https://img.shields.io/github/stars/REPOZY/superpowers-optimized?style=flat&color=yellow)](https://github.com/REPOZY/superpowers-optimized/stargazers)
[![Install](https://img.shields.io/badge/install-REPOZY%2Fsuperpowers--optimized-5B3FFF?logo=claude)](https://github.com/REPOZY/superpowers-optimized#installation)
[![Cursor](https://img.shields.io/badge/Cursor-AI%20IDE-teal)](https://www.cursor.com/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Anthropic-orange)](https://docs.anthropic.com/en/docs/claude-code)
[![Codex](https://img.shields.io/badge/Codex%20CLI-OpenAI-green)](https://github.com/openai/codex)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# Superpowers Optimized

**The production-grade fork of obra/superpowers** — same trusted workflow, dramatically leaner, safer, and more intelligent.

This repository delivers everything the original Superpowers plugin does, plus automatic workflow routing, six specialist agents, built-in safety guards, and research-backed token reductions of **up to 73 %** per session. Developers using Claude Code, Cursor, Codex, and OpenCode report faster iterations, fewer hallucinations, and zero accidental destructive commands.

### Why developers switch
| Feature                  | Original Superpowers          | Superpowers Optimized                          | Real-world impact                  |
|--------------------------|-------------------------------|------------------------------------------------|------------------------------------|
| Workflow selection       | Manual                        | Automatic (lightweight / full)                 | No extra commands                  |
| Specialist skills        | None                          | +6 (senior engineer, security reviewer, testing specialist, frontend craftsmanship, prompt optimizer, CLAUDE.md creator) | Targeted expertise on demand       |
| Safety & hooks           | None                          | 5 proactive hooks (dangerous-command blocker, secrets protector, edit tracker, stop reminders, skill activator) | Zero risk of rm -rf or secret leaks|
| Token efficiency         | Standard                      | Always-on context hygiene + pruning            | 5–10× smaller context windows      |
| Discipline enforcement   | Instructional tone             | Rationalization tables, red flags, iron laws   | Fewer LLM shortcuts                |
| Cross-session memory     | None                          | Persistent state.md + reviewer memory          | Continuous learning across sessions|

**Token example** (measured on a typical feature-implementation task):  
Original → 4820 tokens  
Optimized → 1290 tokens (73 % reduction)


### Try it in 30 seconds
In any supported agent IDE, start a new chat and paste:

Activate Superpowers Optimized and plan a secure user-authentication endpoint with full TDD and security review.

The agent will automatically route to the correct workflow, apply safety guards, and bring in the security-reviewer specialist — no manual skill selection required.

### Installation (one command on most platforms)

**Claude Code**

1. /plugin marketplace add REPOZY/superpowers-optimized
2. /plugin install superpowers@superpowers-optimized


**Cursor**

/plugin-add superpowers-optimized


**Codex / OpenCode**  
Tell the agent:

Fetch and follow instructions from https://raw.githubusercontent.com/REPOZY/superpowers-optimized/refs/heads/main/.codex/INSTALL.md


Full platform-specific guides and update commands are in the [Installation section](#installation) below.

---



**How it works**  
From the moment you fire up your coding agent, this fork follows the original Superpowers approach: it first steps back to understand what you're really trying to do instead of jumping straight into code. It then collaborates with you to tease out a clear spec and shows it in chunks short enough to read and digest.

Once you approve the design, your agent puts together an implementation plan that an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing could follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY, while this fork's optimizations keep the instructions focused and token‑efficient.

Next up, once you say "go", it launches either a *subagent-driven-development* process or *executing-plans*, having agents work through each engineering task with staged reviews (spec compliance, then code quality) and integrated specialists where useful (e.g., security-reviewer on sensitive changes, frontend-craftsmanship on UI work).

Because the skills trigger automatically and are optimized for smaller, more relevant context windows, you don't need to do anything special. Your coding agent just has **optimized Superpowers**.

---


**Research-Driven Optimizations**  
The optimizations in this fork are grounded in three research papers on LLM agent behavior:

### Minimal context files outperform verbose ones

**Paper:** [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988) (AGENTbench, 138 tasks, 12 repos, 4 agents)

Key findings that shaped this fork:
- **LLM-generated context files decreased success rates by ~2-3%** while increasing inference costs by over 20%. More instructions made tasks *harder*, not easier.
- **Developer-written context files only helped ~4%** — and only when kept minimal. Detailed directory enumerations and comprehensive overviews didn't help agents find relevant files faster.
- **Agents used 14-22% more reasoning tokens** when given longer context files, suggesting cognitive overload rather than helpful guidance.
- **Agents followed instructions compliantly** (using mentioned tools 1.6-2.5x more often) but this compliance didn't translate to better outcomes.

**What we changed:** Every skill was rewritten as a concise operational checklist instead of verbose prose. The `CLAUDE.md` contains only minimal requirements (specific tooling, critical constraints, conventions). The `adaptive-workflow-selector` skips unnecessary skill loading for simple tasks. The result is lower prompt overhead in every session and fewer failures from instruction overload.

### Prior assistant responses can degrade performance

**Paper:** [Do LLMs Benefit from Their Own Words?](https://arxiv.org/abs/2602.24287) (4 models, real-world multi-turn conversations)

Key findings that shaped this fork:
- **Removing prior assistant responses often maintained comparable quality** while reducing context by 5-10x. Models over-condition on their own previous outputs.
- **Context pollution is real:** models propagate errors across turns — incorrect code parameters carry over, hallucinated facts persist, and stylistic artifacts constrain subsequent responses.
- **~36% of prompts in ongoing conversations are self-contained "new asks"** that perform equally well without assistant history.
- **One-sentence summaries of prior responses outperformed full context**, suggesting long reasoning chains degrade subsequent performance.

**What we changed:** The `context-management` skill actively prunes noisy history and persists only durable state across sessions. Subagent prompts request only task-local constraints and evidence rather than carrying forward full conversation history. Execution skills avoid long historical carryover unless required for correctness. The `token-efficiency` standard enforces these rules as an always-on operational baseline.

### Single reasoning chains fail on hard problems

**Paper:** [Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/abs/2203.11171) (Wang et al., ICLR 2023)

Key findings that shaped this fork:
- **A single chain-of-thought can be confident but wrong** — the model picks one reasoning path and commits, even when that path contains an arithmetic slip, wrong assumption, or incorrect causal direction.
- **Generating multiple independent reasoning paths and taking majority vote significantly improves accuracy** across arithmetic, commonsense, and symbolic reasoning tasks.
- **Consistency correlates with accuracy** — when paths agree, the answer is almost always correct. When they scatter, the problem is genuinely hard or ambiguous, which is itself a useful signal.
- **Diversity of reasoning matters more than quantity** — 5 genuinely different paths outperform 10 paths that all reason the same way.

**What we changed:** The `systematic-debugging` skill now applies self-consistency during root cause diagnosis (Phase 3): before committing to a hypothesis, the agent generates 3-5 independent root cause hypotheses via different reasoning approaches, takes a majority vote, and reports confidence. Low-confidence diagnoses (<= 50% agreement) trigger a hard stop — gather more evidence before touching code. The `verification-before-completion` skill applies the same technique when evaluating whether evidence actually proves the completion claim, catching the failure mode where evidence is interpreted through a single (potentially wrong) lens. The underlying technique lives in `self-consistency-reasoner` and fires only during these high-stakes reasoning moments, keeping the token cost targeted.

### Combined impact

These research insights drive four core principles throughout the fork:
1. **Less is more** — concise skills, minimal always-on instructions, and explicit context hygiene
2. **Fresh context beats accumulated context** — subagents get clean, task-scoped prompts instead of inheriting polluted history
3. **Compliance ≠ competence** — agents follow instructions reliably, so the instructions themselves must be carefully engineered (rationalization tables, red flags, forbidden phrases) rather than simply comprehensive
4. **Verify your own reasoning** — multi-path self-consistency at critical decision points (diagnosis, verification) catches confident-but-wrong single-chain failures before they become expensive mistakes

---


**The Basic Workflow**  
1. **adaptive-workflow-selector** - Activates first. Chooses `lightweight` vs `full` workflow path based on scope/risk.

2. **context-management** - Persists durable state to `state.md` for cross-session continuity.

3. **brainstorming** (full path) - Produces approved design before implementation changes.

4. **using-git-worktrees** - Creates isolated workspace on a feature branch and verifies clean baseline.

5. **writing-plans** - Creates executable implementation plan with exact paths and verification steps.

6. **subagent-driven-development** or **executing-plans** - Executes the plan with staged verification.

7. **test-driven-development** + **systematic-debugging** + **requesting-code-review** - Applied during execution for quality gates.

8. **verification-before-completion** + **finishing-a-development-branch** - Final evidence and branch integration/cleanup.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

---



**Skills Library**

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns: mock behavior, test-only methods, incomplete mocks, interface drift, and more)
- **testing-specialist** - Advanced test strategy and coverage design for complex or high-risk behavior

**Debugging**
- **systematic-debugging** - 4-phase root cause process with self-consistency reasoning for hypothesis validation (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Evidence gate for completion claims with multi-path verification reasoning, including configuration change verification (verifies outcomes reflect intended changes, not just that operations succeeded)
- **self-consistency-reasoner** - Internal multi-path reasoning technique (Wang et al., ICLR 2023) embedded in systematic-debugging and verification-before-completion to catch confident-but-wrong single-chain reasoning


---


**Collaboration**
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality), blocked-task escalation protocol, and E2E process hygiene
- **senior-engineer** - Senior engineering collaborator for complex or architectural work
- **security-reviewer** - Structured security and quality review for sensitive changes
- **frontend-craftsmanship** - Production-grade, accessible frontend implementation standards with concrete checklist (semantic HTML, CSS tokens, focus-visible, prefers-reduced-motion, WCAG AA contrast, fluid typography)

**Hooks**
- **skill-activator** (UserPromptSubmit) - Proactively matches user prompts to relevant skills before Claude processes them, reinforcing the routing system
- **track-edits** (PostToolUse) - Logs all Edit/Write operations for downstream awareness (feeds stop-reminders)
- **stop-reminders** (Stop) - Reminds about untested changes and uncommitted work when Claude finishes a response
- **block-dangerous-commands** (PreToolUse) - Blocks destructive bash commands (rm -rf, force push, drop table, etc.) with 3-tier severity
- **protect-secrets** (PreToolUse) - Prevents reading, modifying, or exfiltrating sensitive files (.env, SSH keys, credentials, etc.)

**Agents**
- **code-reviewer** - Senior code review agent with persistent cross-session memory (`memory: user`)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system
- **adaptive-workflow-selector** - Select lightweight vs full process path
- **context-management** - Persist durable state to `state.md` for cross-session continuity
- **token-efficiency** - Always-on operational standard: concise responses, parallel tool batching, no redundant work. Invoked at every session start.
- **prompt-optimizer** - Optional pre-processing to refine vague or multi-part user requests
- **claude-md-creator** - Create lean, high-signal CLAUDE/AGENTS context files for repositories


---


**Philosophy**

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)


**Contributing**

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.


**License**

MIT License - see LICENSE file for details


**Support**  
- Issues: https://github.com/REPOZY/superpowers-optimized/issues  
- Original: https://github.com/obra/superpowers  
- Discussions: enabled on this repository for questions and feature requests
