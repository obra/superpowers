# DESI's Global Claude Code Instructions

> **Copy this file to your local CLAUDE.md to use it.**
> This is your original vibe coding methodology + 4 superpowers concepts merged in as non-breaking additions.

---

## Who I Am
I'm DESI, founder of Digital Alchemy - teaching creative professionals to build real apps with AI assistance ("vibe coding"). 10+ years in creative education. I need code that's practical, secure, and teachable.

## My Communication Style
- Direct and high-energy - skip the theory, give me actionable steps
- Comprehensive responses - don't make me ask follow-ups for obvious next steps
- Security-first always - never skip auth, validation, or API key protection
- Teach as you go - explain WHY when it helps me teach others

---

## Vibe Coding Best Practices

### The Philosophy
Vibe coding = using AI to build real applications without traditional programming background. It's NOT "no code" - you're writing real code with AI as your pair programmer.

### Core Principles

#### 1. Prompt with Intent, Not Syntax
- Describe WHAT you want, not HOW to code it
- Be specific about outcomes: "a login form that validates email format and shows inline errors"
- Include context: who's using it, what's the flow, what could go wrong

#### 2. Build in Layers
Start simple → Get it working → Add features → Harden security → Polish UI
Never try to build everything at once. Ship ugly, iterate pretty.

#### 3. Understand Before You Ship
- Don't blindly paste code you can't explain
- Ask "explain this like I'm teaching it" when confused
- If you can't describe what it does, don't deploy it

#### 4. Security is Not Optional
Even when vibing fast:
- API keys → environment variables (ALWAYS)
- User input → validate it
- Database → lock down rules
- Auth → check it before sensitive operations

#### 5. Test Like a User, Break Like a Hacker
- Click everything
- Enter garbage data
- Try to break your own app
- Check mobile view

#### 6. Version Control is Your Safety Net
- Commit before big changes
- Meaningful commit messages ("added auth" not "stuff")
- Branch for experiments

#### 7. Read the Errors
Error messages are hints, not failures. Copy the full error, paste it to your AI, and learn from it.

### Vibe Coding Workflow
1. **DESCRIBE** → What am I building? For whom? What's the happy path?
2. **SCAFFOLD** → Get basic structure working (ugly is fine)
3. **VALIDATE** → Does it actually work? Test it.
4. **SECURE** → Lock it down before adding features
5. **ITERATE** → Add features one at a time
6. **POLISH** → UI, UX, error messages
7. **DOCUMENT** → Comments, README, teach it back

### Red Flags to Catch
- "It works but I don't know why" → Stop and understand
- API keys visible in code → Fix immediately
- No error handling → Add it before shipping
- "I'll add auth later" → No you won't, add it now
- Skipping mobile testing → Half your users are on phones

---

## Verification Before Completion

> *Adapted from superpowers:verification-before-completion*

**Core rule: Evidence before claims, always.**

This applies especially during VALIDATE and SECURE in the vibe coding workflow. Don't say "it works" until you've SEEN it work.

### The Gate (run this every time before saying "done")
1. **IDENTIFY** - What command/action proves this claim?
2. **RUN** - Execute it fresh, right now
3. **READ** - Full output, check for errors
4. **VERIFY** - Does the output actually confirm what you're about to say?
5. **THEN CLAIM** - Now you can say it works

### Red Flags - You're About to Lie
| What You're Tempted to Say | What You Should Do Instead |
|---|---|
| "Should work now" | Run the command and show the output |
| "I'm confident this fixes it" | Confidence ≠ evidence. Run it. |
| "Tests should pass" | Run the tests. Show the results. |
| "Just deployed, looks good" | Open the URL. Click through it. Show me. |
| "I fixed the bug" | Reproduce the original bug. Show it's gone. |

### For Digital Alchemy Context
When building curriculum or demos, verification is EXTRA important:
- Students will follow your exact steps
- If something doesn't actually work, they'll get stuck with no way forward
- Always run through the complete flow before declaring a tutorial "done"

---

## Systematic Debugging

> *Adapted from superpowers:systematic-debugging*

**Core rule: Find the root cause BEFORE attempting fixes. Random fixes waste time and create new bugs.**

This upgrades the "Read the Errors" principle into a structured process.

### The Four Phases

#### Phase 1: Investigate (BEFORE touching any code)
1. **Read error messages carefully** - Don't skip past them. They contain the answer 90% of the time. Read stack traces completely.
2. **Reproduce it** - Can you trigger it reliably? What are the exact steps?
3. **Check what changed** - Git diff, recent commits, new dependencies, config changes
4. **Trace the data flow** - Where does the bad value come from? Keep tracing upstream until you find the source.

#### Phase 2: Find the Pattern
1. Find working code that's similar to what's broken
2. Compare them - what's different?
3. Don't assume any difference is irrelevant

#### Phase 3: Test Your Theory
1. State your hypothesis: "I think X is broken because Y"
2. Make the SMALLEST possible change to test it
3. One variable at a time - don't fix multiple things at once
4. If it didn't work, form a NEW hypothesis. Don't pile more fixes on top.

#### Phase 4: Fix It
1. Fix the ROOT CAUSE, not the symptom
2. Verify the fix - run the thing, show the output
3. **If 3+ fixes have failed: STOP.** This is probably an architecture problem, not a bug. Step back and rethink the approach.

### Red Flags - You're Guessing
- "Let me just try changing this..." → STOP. What's your hypothesis?
- "Quick fix for now" → This becomes the permanent fix. Do it right.
- "It's probably X" → Probably ≠ evidence. Investigate.
- Multiple failed fixes → Architecture problem. Step back.

### For Vibe Coders
This is especially important when you're learning. Random fix attempts teach you nothing. Following the phases teaches you HOW the code works, which makes you better at building next time.

---

## Skill Invocation Pattern

> *Adapted from superpowers:using-superpowers*

**Core rule: If you have the superpowers plugin installed, check for applicable skills before any action.**

### How It Works
When the superpowers plugin is installed, Claude has access to 14+ development skills via the `Skill` tool. Before responding to any request:

1. **Check** - Could any skill apply to what I'm about to do? (even 1% chance)
2. **Invoke** - Load the skill using the Skill tool
3. **Follow** - The skill provides the HOW. Your instructions provide the WHAT.

### Priority Order
1. **Your explicit instructions** (this CLAUDE.md, direct requests) - HIGHEST
2. **Superpowers skills** - override default behavior
3. **Default Claude behavior** - LOWEST

Your vibe coding workflow always takes precedence. Skills add structure to HOW you execute it.

### When Skills Help Most
- **Starting a new feature** → brainstorming skill helps you think before coding
- **Bug hunting** → systematic-debugging skill (see above)
- **About to say "done"** → verification skill (see above)
- **Big task with many parts** → subagent/parallel skills break it down

### Red Flags
| Thought | Reality |
|---|---|
| "This is simple, don't need a skill" | Simple things become complex. Check anyway. |
| "Let me just start coding" | Skills tell you HOW to start. Check first. |
| "I remember what the skill says" | Skills evolve. Read the current version. |

---

## Subagent Patterns

> *Adapted from superpowers:subagent-driven-development + dispatching-parallel-agents*

**Core rule: Use fresh subagents for isolated tasks. Use parallel agents for independent work.**

### When to Use Subagents
- You have a plan with multiple independent tasks
- Each task can be done without knowing about the others
- You want quality gates (review) after each task

### The Pattern: One Agent Per Task
1. **Dispatch** a fresh subagent with complete context for ONE task
2. **Review** the result (does it match the spec? is the code quality good?)
3. **Fix** any issues (same subagent fixes, not you)
4. **Move on** to the next task

### Parallel Agents: Independent Problems
When you have 2+ independent problems (different test files failing, different features to build):
- Dispatch one agent per problem domain
- Let them work concurrently
- Review and integrate when they return

### Good Agent Prompts
- **Focused** - One clear problem, not "fix everything"
- **Self-contained** - All context the agent needs, upfront
- **Constrained** - "Fix X, don't touch Y"
- **Output-specific** - "Return a summary of what you found and fixed"

### For Digital Alchemy
Subagent patterns are great for curriculum development at scale:
- One agent per lesson module
- One agent per code example
- Parallel agents for independent tutorial sections
- Review agents to check accuracy before publishing

### Red Flags
- Dispatching an agent with no constraints → it'll refactor your whole codebase
- Ignoring agent questions → they'll guess wrong
- Skipping review → bugs ship
- Running parallel agents on shared state → conflicts

---

## My Core Stack

| Tool | Purpose |
|------|---------|
| Claude Code | Primary development environment |
| Firebase | Auth, Firestore, hosting, functions |
| Google AI Studio | Gemini API, prompt testing |
| Antigravity | Rapid prototyping |
| Firecrawl | Web scraping, research |

## Project Context
When I'm working, assume:
- I may turn this into curriculum for Digital Alchemy
- My students are creative pros, NOT traditional devs
- Code should be readable and explainable
- Include comments that teach concepts

---

## Firecrawl Integration
**Triggers:** "Firecrawl", "scrape", "research [topic]"

### MCP Tools (Preferred)
| Tool | Use For |
|------|---------|
| `firecrawl_search` | Search web for sources |
| `firecrawl_scrape` | Single URL to markdown |
| `firecrawl_crawl` | Entire site with depth |
| `firecrawl_map` | Discover all URLs |
| `firecrawl_extract` | Structured data with AI |
| `firecrawl_batch_scrape` | Multiple URLs |

### Research Workflow
1. `firecrawl_search` → find sources
2. Filter for quality/recency
3. `firecrawl_scrape` top 3-5 sources
4. Synthesize into actionable summary

### Windows CLI Fallback
```powershell
& 'C:\Users\ulilj\Digital Alchemy Vault\tools\firecrawl-projects\firecrawl-cli\.venv\Scripts\firecrawl.exe' search "query"
& 'C:\Users\ulilj\Digital Alchemy Vault\tools\firecrawl-projects\firecrawl-cli\.venv\Scripts\firecrawl.exe' scrape "url"
```

---

## Firebase Patterns

### Always Include:
- Firestore security rules (never leave open)
- Environment variables for API keys
- Auth state checks before data operations
- Error handling with user-friendly messages

### Default Structure:
```
/src
  /components
  /lib (firebase config, utilities)
  /hooks (useAuth, useFirestore patterns)
```

---

## Security Checklist (Non-Negotiable)
Before ANY code is "done":
- [ ] API keys in environment variables, not hardcoded
- [ ] Auth required for sensitive operations
- [ ] Input validation on all user data
- [ ] Firestore rules locked down
- [ ] No secrets in client-side code

---

## Output Preferences
- File creation over code blocks when practical
- Working code first, then explain
- Error messages that help users fix issues
- Mobile-responsive by default for web UI

---

## Content Creation Mode
When I say "content mode" or "curriculum":
- Add more inline comments
- Break into smaller teachable chunks
- Include "why this matters" context
- Suggest exercise variations for students
