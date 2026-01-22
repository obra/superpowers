---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

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
- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use superpowers:using-git-worktrees to create isolated workspace
- Use superpowers:writing-plans to create detailed implementation plan

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense

## Visual Companion (Claude Code Only)

A browser-based visual companion for showing mockups, diagrams, and options. Use it whenever visual representation makes feedback easier. **Only works in Claude Code.**

### When to Use

Use the visual companion when seeing beats describing:
- **UI mockups** - layouts, navigation, component designs
- **Architecture diagrams** - system components, data flow, relationships
- **Complex choices** - multi-option decisions with visual trade-offs
- **Design polish** - when the question is about look and feel
- **Spatial relationships** - file structures, database schemas, state machines

**Always ask first:**
> "This involves some visual decisions. Would you like me to show mockups in a browser window? (Requires opening a local URL)"

Only proceed if they agree. Otherwise, describe options in text.

### How to Use Effectively

**Scale fidelity to the question.** If you're asking about layout structure, simple wireframes suffice. If you're asking about visual polish, show polish. Match the mockup's detail level to what you're trying to learn.

**Explain the question on each page.** Don't just show options—state what decision you're seeking. "Which layout feels more professional?" not just "Pick one."

**Iterate before moving on.** If feedback changes the current screen, update it and show again. Validate that your changes address their feedback before proceeding to the next question.

**Limit choices to 2-4 options.** More gets overwhelming. If you have more alternatives, narrow them down first or group them.

**Use real content when it matters.** For a photography portfolio, use actual images (Unsplash). For a blog, use realistic text. Placeholder content obscures design issues.

### Starting a Session

```bash
# Start server (creates unique session directory)
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/start-server.sh

# Returns: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/tmp/brainstorm-12345"}
```

Save `screen_dir` from the response. Tell user to open the URL.

### The Loop

1. **Start watcher first** (background bash) - avoids race condition:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/wait-for-feedback.sh $SCREEN_DIR
   ```

2. **Write HTML** to a new file in `screen_dir`:
   - Use semantic filenames: `platform.html`, `visual-style.html`, `layout.html`
   - **Never reuse filenames** - each screen gets a fresh file
   - Use Write tool - **never use cat/heredoc** (dumps noise into terminal)
   - Server automatically serves the newest file

3. **Tell user what to expect:**
   - Remind them of the URL (every step, not just first)
   - Give a brief text summary of what's on screen (e.g., "Showing 3 layout options for the homepage")
   - This lets them know what to look for before switching to browser

4. **Wait for feedback** - call `TaskOutput(task_id, block=true, timeout=600000)`
   - If timeout, call TaskOutput again (watcher still running)
   - After 3 timeouts (30 min), say "Let me know when you want to continue"

5. **Process feedback** - returns JSON like `{"choice": "a", "feedback": "make header smaller"}`

6. **Iterate or advance** - if feedback changes current screen, write a new file (e.g., `layout-v2.html`). Only move to next question when current step is validated.

7. Repeat until done.

### Cleaning Up

```bash
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/stop-server.sh $SCREEN_DIR
```

### Resources

- Frame template: `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/frame-template.html`
- CSS classes: `.options`, `.cards`, `.mockup`, `.split`, `.pros-cons`
- Detailed examples: `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/CLAUDE-INSTRUCTIONS.md`
- Quick reference: `${CLAUDE_PLUGIN_ROOT}/skills/brainstorming/visual-companion.md`
