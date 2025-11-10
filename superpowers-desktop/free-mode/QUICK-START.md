# Superpowers Free Mode Quick-Start

**Time Required:** 2 minutes per conversation

**Cost:** $0 (Claude Desktop free tier)

---

## What You Get

**Free mode provides:**
- ✅ Core 3 workflows (TDD, debugging, brainstorming)
- ✅ One-page cheat sheets for quick reference
- ✅ Essential patterns without automation

**What you don't get:**
- ❌ Persistent skills (must upload each session)
- ❌ Custom instructions
- ❌ Full 20-skill library
- ❌ Automatic activation

**Good enough for:** Learning the workflows, occasional use, evaluation before upgrading

---

## Quick Start (Do This Every Conversation)

### Method 1: Full Workflows (Recommended)

1. **Download** `core-workflows.md` from this directory
2. **Start new conversation** in Claude Desktop
3. **Upload file** using the paperclip icon
4. **Say:** "Follow the core workflows in core-workflows.md"

**What's included:**
- Test-Driven Development (TDD)
- Systematic Debugging
- Brainstorming
- Quick reference for all three

### Method 2: Cheat Sheets (Quick Reference)

For quick tasks, use single-page cheat sheets:

1. **Download** the relevant cheat sheet:
   - `cheat-sheets/tdd-cheat-sheet.md` - For features/bugfixes
   - `cheat-sheets/debugging-cheat-sheet.md` - For bugs/failures
   - `cheat-sheets/brainstorming-cheat-sheet.md` - For design
2. **Upload to conversation**
3. **Say:** "Use TDD from tdd-cheat-sheet.md"

**Benefit:** Smaller files, faster upload, focused on one workflow

---

## Using the Workflows

### For Implementing Features

```
You: [Upload core-workflows.md]
     "Use TDD from core-workflows.md to implement user validation"

Claude: "I'll follow the RED-GREEN-REFACTOR cycle.

         RED: Writing failing test first..."
```

**Workflow:** Write test → Watch fail → Implement → Watch pass → Refactor

### For Debugging Issues

```
You: [Upload core-workflows.md]
     "Use systematic debugging from core-workflows.md for this error"

Claude: "I'll follow the 4-phase process.

         Phase 1: Root Cause Investigation
         Let me read the error carefully..."
```

**Workflow:** Root Cause → Pattern → Hypothesis → Fix

### For Designing Features

```
You: [Upload core-workflows.md]
     "Use brainstorming from core-workflows.md to design the login feature"

Claude: "I'll use the socratic method to refine your idea.

         First, let me check the current project state..."
```

**Workflow:** Understand → Explore → Present → Document

---

## Tips for Success

### 1. Upload at Start of Every Conversation

Free tier = no persistent knowledge. Upload fresh each time.

### 2. Be Explicit About Which Workflow

Don't just upload and hope:
- ❌ "Here's a file" (ambiguous)
- ✅ "Use TDD from core-workflows.md" (explicit)

### 3. Track Checklists Yourself

No automatic tracking. Stay organized:

```
**My TDD Checklist:**
- [x] Write failing test for valid input
- [x] Run test, saw it fail
- [x] Implement validation
- [ ] Run test, verify pass
- [ ] Write test for invalid input
```

Update as you go.

### 4. Refer Back to the Document

During the conversation:
```
"What does systematic debugging say about Phase 2?"
"Check the TDD red flags in core-workflows.md"
```

### 5. Keep Files Handy

**Create a workflow:**
1. Keep workflow files in an easy-to-access folder
2. Drag and drop into conversations
3. Becomes quick muscle memory

---

## Workflow Reference

### TDD (Test-Driven Development)

**The Iron Law:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

**Cycle:**
1. RED - Write test
2. Verify RED - Watch fail (mandatory)
3. GREEN - Implement minimal code
4. Verify GREEN - Watch pass (mandatory)
5. REFACTOR - Clean up
6. Repeat

**Red Flag:** Code before test? Delete and start over.

### Systematic Debugging

**The Iron Law:** NO FIXES WITHOUT ROOT CAUSE FIRST

**Phases:**
1. Root Cause - Investigate, reproduce, gather evidence
2. Pattern - Find working examples, compare
3. Hypothesis - Form theory, test minimally
4. Fix - Create test, implement, verify

**Red Flag:** "Quick fix for now"? Stop, return to Phase 1.

### Brainstorming

**Purpose:** Design first, implement second

**Process:**
1. Understand - Ask questions one at a time
2. Explore - Propose 2-3 approaches
3. Present - 200-300 words, validate incrementally
4. Document - Write to design doc

**Principle:** YAGNI ruthlessly

---

## Common Questions

### "Do I need to upload every time?"

**Yes.** Free tier has no persistent project knowledge.

**Workaround:** Keep files easily accessible, takes 5 seconds.

### "Can I use part of a workflow?"

**Not recommended.** Workflows are designed as complete systems. Cherry-picking steps loses the benefit.

**Example:** TDD without watching tests fail? You don't know if they test the right thing.

### "What if Claude doesn't follow the workflow?"

**Remind explicitly:**
```
"According to core-workflows.md, what should we do first?"
"Check the TDD checklist in core-workflows.md"
"Core-workflows.md says no fixes without root cause - let's investigate"
```

### "Can I modify the workflows?"

**You can, but:**
- Workflows are proven and tested
- Modifications often rationalize away the discipline
- If it feels "too rigid," that's usually the point

**Better:** Use as-is for a few weeks, then evaluate.

---

## Upgrading to Pro

### When to Consider Pro

**Upgrade if:**
- ✅ Uploading every conversation feels tedious
- ✅ You want the full 20-skill library
- ✅ You need custom instructions
- ✅ You use these workflows regularly

**What you gain:**
- Persistent skills (no more uploads!)
- Custom instructions (automatic reminders)
- Full skills library (testing, collaboration, meta)
- Better context management

**What you still won't have:**
- Automatic activation (still manual, but easier)
- TodoWrite tracking (still manual)
- Subagent spawning

### Migration Path

1. Decide Pro is worth $20/month for you
2. Upgrade your Claude Desktop subscription
3. Follow [Pro Setup Guide](../pro-setup/SETUP.md)
4. Keep using the same workflows, just more conveniently

---

## Cheat Sheet Comparison

| Sheet | Use When | Size | Content |
|-------|----------|------|---------|
| **tdd-cheat-sheet.md** | Implementing features/bugs | 1 page | RED-GREEN-REFACTOR reference |
| **debugging-cheat-sheet.md** | Debugging issues | 1 page | 4-phase process reference |
| **brainstorming-cheat-sheet.md** | Designing features | 1 page | Socratic method reference |
| **core-workflows.md** | General work | 3-4 pages | All three workflows in detail |

**Strategy:**
- **Daily work:** Upload core-workflows.md once, use all session
- **Quick tasks:** Upload specific cheat sheet for focused reference
- **Learning:** Read full core-workflows.md to understand principles

---

## Example Session

```
[New conversation]

You: [Uploads core-workflows.md]
     "I need to add email validation to my signup form.
      Use core-workflows.md for this."

Claude: "I see you want to add email validation.
         According to core-workflows.md, I should use:
         1. Brainstorming (if design needed)
         2. TDD (for implementation)

         Is the design clear, or should we brainstorm first?"

You: "Design is clear - just validate email format"

Claude: "Great! I'll use TDD from core-workflows.md.

         Phase: RED - Write failing test

         test('rejects invalid email format', () => {
           expect(validateEmail('notanemail')).toBe(false);
         });

         Let me run this to verify it fails..."

[Conversation continues through TDD cycle]
```

---

## Troubleshooting

### Claude Isn't Following the Workflow

**Try:**
1. More explicit reference: "Section 1 of core-workflows.md says..."
2. Quote directly: "The TDD Iron Law is: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
3. Checklist enforcement: "What's the next step in the RED-GREEN-REFACTOR cycle?"

### File Upload Issues

**Solutions:**
- Ensure file is `.md` format
- Check file isn't corrupted
- Try re-downloading from distribution
- Verify file size is reasonable (<100KB)

### Workflow Feels Too Rigid

**Remember:**
- Rigidity is the point (prevents rationalization)
- "Too rigid" usually means "preventing me from skipping steps"
- Try it exactly as written for 2-3 weeks before modifying
- Shortcuts lose the benefits

---

## Next Steps

1. **Download** `core-workflows.md` (or cheat sheets)
2. **Try it** on a small task
3. **Follow exactly** - Don't skip steps
4. **Evaluate** - Does this help?
5. **Consider Pro** - If you like it but uploading is tedious

---

## Getting Help

- **Workflow questions:** Read core-workflows.md carefully
- **Technical issues:** [GitHub Issues](https://github.com/obra/superpowers/issues)
- **Want full experience:** Try [Claude Code plugin](https://github.com/obra/superpowers)

---

## Files in This Directory

```
free-mode/
├── QUICK-START.md (you are here)
├── core-workflows.md (upload this for full workflows)
└── cheat-sheets/
    ├── tdd-cheat-sheet.md (1-page TDD reference)
    ├── debugging-cheat-sheet.md (1-page debugging reference)
    └── brainstorming-cheat-sheet.md (1-page design reference)
```

---

**Ready to start?**

1. Download `core-workflows.md`
2. Start a new Claude conversation
3. Upload the file
4. Say: "Follow the workflows in core-workflows.md"
5. Start building!

**Good luck! 🚀**
