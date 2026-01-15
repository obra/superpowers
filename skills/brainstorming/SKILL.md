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

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git
- **Crucial**: Tell the user: "设计已保存到文档。你可以通过编辑文档来调整设计，完成后说'继续'或'ready'进入实施阶段。"
- Wait for user confirmation - they may edit the document before proceeding

**Document as communication medium:**
- If user says "继续" or "ready" after documentation, re-read the design document
- The document may have been modified by the user - treat it as the source of truth
- Confirm understanding before proceeding: "基于文档中的设计，我们准备开始实施。确认继续？"

**Implementation (if continuing):**
- After user confirms, ask: "需要创建隔离的开发环境吗？"
- If yes: Use horspowers:using-git-worktrees to create isolated workspace
- If no: Continue in current branch
- Use horspowers:writing-plans to create detailed implementation plan

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
