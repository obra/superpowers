---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation. 中文触发场景：当用户说'帮我想想这个功能的实现方案'、'这个需求我该怎么设计？'、'帮我理清思路'、'我想做个XXX，有什么建议？'等需要完善想法时使用此技能。"
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

**Announce at start:** "我正在使用头脑风暴技能来完善你的想法..." (I'm using brainstorming to refine your idea...)

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation Integration (遵循最小必要文档原则):**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:

  **Initialize if needed:**
  IF session context shows `docs_auto_init:true`:
    Run: Create `docs/` directory structure using core docs module

  **Search existing context (在创建新文档前):**
  Run: Search `docs/context/` for project architecture and `docs/plans/` for related designs
  Purpose: 避免重复创建，复用现有文档

  **判断是否需要创建设计文档:**
  IF 设计中包含重要的技术方案选择（架构变更、技术栈选择、数据模型设计等）:
    ASK user: "这个设计包含重要的方案决策，是否需要创建设计文档记录？

    **选项:**
    1. **创建设计文档** - 记录方案对比和决策理由（推荐用于重要功能）
    2. **跳过设计文档** - 直接进入实施计划（适用于简单功能）

    说明: 核心文档数量建议不超过 3 个（design + plan + task），避免文档膨胀"

    IF user chooses 创建设计文档:
      Use horspowers:document-management or core module
      Create: `docs/plans/YYYY-MM-DD-design-<topic>.md` (前缀式命名)

      In the created document, populate (使用统一的设计模板):
      - ## 基本信息: 创建时间、设计者、状态
      - ## 设计背景: [为什么需要这个设计]
      - ## 设计方案: [方案A、方案B等，包括优缺点]
      - ## 最终设计: [选择的方案及详细理由]
      - ## 技术细节: [架构、组件、数据流等]
      - ## 影响范围: [这个设计影响的模块/系统]
      - ## 实施计划: [如何实施这个设计]
      - ## 结果评估: [设计实施后的效果评估]
      - ## 相关文档: [计划文档链接]

    ELSE (user chooses 跳过):
      DO NOT create design document
      PROCEED directly to writing-plans

  ELSE (设计不包含重要方案选择):
    DO NOT create design document
    PROCEED directly to writing-plans

**Original documentation (备用方案):**
如果用户选择创建设计文档:
- Write the validated design to `docs/plans/YYYY-MM-DD-design-<topic>.md` (前缀式)
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git
- **Crucial**: Tell the user: "设计已保存到文档。你可以通过编辑文档来调整设计，完成后说'继续'或'ready'进入实施阶段。"
- Wait for user confirmation - they may edit the document before proceeding

**Document as communication medium:**
- If user says "继续" or "ready" after documentation, re-read the design document (if created)
- The document may have been modified by the user - treat it as the source of truth
- Confirm understanding before proceeding: "基于文档中的设计，我们准备开始实施。确认继续？"

**Implementation (if continuing):**
- After user confirms, ask: "需要创建隔离的开发环境吗？"
- If yes: Use horspowers:using-git-worktrees to create isolated workspace
- If no: Continue in current branch
- Use horspowers:writing-plans to create detailed implementation plan (which will create plan + task documents)

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
