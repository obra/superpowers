# CLAUDE.md Integration — Deep Reference

Prompt Forge has a two-way relationship with CLAUDE.md. This reference covers how to read from it, what to write back, how to propose updates, and how to evolve it over time.

## Table of Contents
1. Reading — How CLAUDE.md shapes prompts
2. Writing back — What to capture
3. Proposing updates — Be specific
4. The evolution flywheel
5. CLAUDE.md vs prompt-forge-context.md
6. CLAUDE.md structure best practices
7. The Self-Learning Loop (Hermes-inspired)

---

## 1. Reading — How CLAUDE.md shapes prompts

Always read CLAUDE.md first — before the context file, before code analysis. It's the developer's brain dump about the project.

**Use it to:**
- Know which patterns Claude Code should follow (and which to avoid)
- Know test/lint/build commands without checking package.json
- Understand architecture decisions that aren't obvious from code
- Respect constraints: "never use class components," "always SSR"
- Include relevant rules in the refined prompt: "Follow the error handling convention from CLAUDE.md"

**Watch for drift:** If CLAUDE.md says "use service classes" but half the routes call Prisma directly, note the inconsistency. Either CLAUDE.md needs updating or the codebase has drift. Surface it: "CLAUDE.md says to use service classes, but I see some routes calling Prisma directly. Should I write the prompt to follow the service pattern, or is that convention outdated?"

**Watch for gaps:** If CLAUDE.md exists but is sparse (just test commands, nothing about architecture), that's a signal to propose additions after delivering the prompt.

**If no CLAUDE.md exists:** Mention it. After delivering the prompt, offer to create a starter CLAUDE.md based on what you learned during grounding. This is a high-value first-session action.

---

## 2. Writing back — What to capture

Every Prompt Forge session surfaces project knowledge. Capture it before it evaporates.

### Patterns discovered during code analysis

If you read 3 route files to understand the pattern, that pattern belongs in CLAUDE.md.

```markdown
## Route pattern
Router → Zod validation → authenticateRequest middleware → Service call → JSON response
Errors: ZodError → 400, auth → 401, not found → 404, else → 500
Reference implementation: src/routes/orders.ts
```

### Conventions confirmed during questions

When the developer confirms something ("yeah we always use Zod"), that was in their head but not documented.

```markdown
## Validation
- Always use Zod schemas for request validation
- Schema defined at top of route file, named [action]Schema (e.g., createOrderSchema)
- Parse with schema.parse(req.body) inside try/catch
```

### Gotchas and anti-patterns from grounding

Inconsistencies, missing coverage, tech debt — warn future sessions.

```markdown
## Known issues
- loginUser() in auth-service.ts has inconsistent error handling (returns null
  for missing user, throws for wrong password). DO NOT replicate this pattern.
  All service methods should throw on failure.
- getUserProfile() makes 3 sequential DB calls. Use Promise.all for parallel queries.
- No test coverage for auth or user routes (only orders have tests)
```

### Decisions made during this session

Architectural choices with reasoning help future sessions understand *why*.

```markdown
## Architecture decisions
- Payments: Using Stripe Checkout (hosted page), not Elements. Chosen for
  faster implementation and PCI compliance handled by Stripe.
- Caching: Redis with 5-minute TTL for user profiles. Falls back to DB
  if Redis is down (cache is optional, not required).
```

### Stack knowledge from web research

Version-specific gotchas that future sessions need to know.

```markdown
## Stack notes
- Prisma 5.x: Use `$transaction` for multi-model writes, not sequential creates
- Express 4.18: Stripe webhooks need raw body — use express.raw() middleware
  on the webhook endpoint BEFORE express.json()
- jsonwebtoken 9.x: verify() throws JsonWebTokenError, TokenExpiredError,
  NotBeforeError — handle each distinctly
```

### Commands and verification

If you assembled these during grounding, make sure they're documented.

```markdown
## Commands
- Test: `npm test` (Jest with coverage)
- Lint: `npm run lint` (ESLint)
- Typecheck: `npm run typecheck` (tsc --noEmit)
- Dev: `npm run dev` (tsx watch, hot reload)
```

---

## 3. Proposing updates — Be specific

Never say "you should update your CLAUDE.md." Propose the exact text.

### Bad proposal
> "You might want to add your error handling conventions to CLAUDE.md."

The developer is tired. This requires them to figure out what to write and where to put it. They won't do it.

### Good proposal
> "Want me to add this to your CLAUDE.md? I'd put it after the Commands section:"
> ```markdown
> ## Error handling
> - All service methods throw errors for failure cases (never return null)
> - Route handlers catch errors and return { error: string } format
> - ZodError → 400, auth errors → 401, not found → 404, everything else → 500
> ```

The developer says "yeah" or "nah" or "change X." Zero effort.

### Even better — batch proposals
After a session that surfaced multiple learnings, batch them:

> "I learned a few things about your project during this session. Want me to add these to CLAUDE.md?"
>
> 1. **Route pattern** — the Router → Zod → middleware → service → response flow
> 2. **Error handling convention** — throw on failure, never return null
> 3. **Known issue** — loginUser() inconsistency to not replicate
>
> I can add all three, or pick and choose.

---

## 4. The evolution flywheel

CLAUDE.md gets better with every Prompt Forge interaction. This creates a compound effect:

**Session 1:** No CLAUDE.md exists. Prompt Forge does full grounding, discovers route pattern, service pattern, test setup, a bug, and missing test coverage. Delivers the prompt. Proposes a starter CLAUDE.md with patterns, commands, and known issues.

**Session 2:** CLAUDE.md has the basics. Prompt Forge reads it, skips re-discovering the route pattern, goes straight to task-specific analysis. Discovers the project uses a specific auth middleware pattern. Proposes adding auth conventions to CLAUDE.md.

**Session 3:** CLAUDE.md has patterns + auth conventions. Prompt Forge reads them, produces a more precise prompt that explicitly says "follow the auth pattern documented in CLAUDE.md." Discovers the project's deployment convention during a migration prompt. Proposes adding it.

**Session N:** CLAUDE.md is comprehensive. Prompt Forge reads it and immediately knows architecture, conventions, gotchas, decisions, commands, and anti-patterns. Grounding takes seconds instead of minutes. Every prompt references CLAUDE.md conventions. Every Claude Code session benefits from accumulated project knowledge.

**The key insight:** Each session teaches CLAUDE.md something new. The cost is a 10-second "want me to add this?" at the end. The payoff compounds forever.

---

## 5. CLAUDE.md vs prompt-forge-context.md

These files serve different purposes. Don't conflate them.

| | CLAUDE.md | .claude/prompt-forge-context.md |
|---|---|---|
| **Audience** | Claude Code (all tools, all sessions) | Prompt Forge (this skill only) |
| **Contains** | Conventions, decisions, rules, commands, anti-patterns | File paths, structure map, patterns catalog, coverage gaps |
| **Tone** | Instructions: "Always do X, never do Y" | Reference data: "auth files live at src/middleware/" |
| **Evolves by** | Developer edits + Prompt Forge proposals | Auto-generated, auto-updated by Prompt Forge |
| **Persists** | Always — it's the project's brain | Can be regenerated anytime from the code |
| **Read by** | Claude Code, GSD, Superpowers, and Prompt Forge | Only Prompt Forge |

**Overlap is OK** for development knowledge — test commands might be in both. If they conflict, CLAUDE.md wins.

**Rule of thumb:** If it helps Claude Code write better code during a regular dev session (no Prompt Forge involved) → CLAUDE.md. If it only helps Prompt Forge write better prompts → context file. If you're unsure, it's probably context file.

**Hard boundary — NEVER put in CLAUDE.md:**
- Prompt style preferences ("developer prefers short prompts")
- Prompt Forge workflow notes ("always include intent breakdowns")
- Developer personality observations ("prefers simple over architecturally correct")
- Prompt pattern feedback ("bug fix prompts work best with error paths")

These go in the context file under `## Prompt Forge notes`. CLAUDE.md must stay clean for development.

### CLAUDE.md health check

Prompt Forge should actively prevent CLAUDE.md bloat. Before proposing additions:

1. **Is this already inferable from the code?** If every route file already uses Zod, Claude Code will figure that out. Don't add "use Zod for validation." DO add "Zod schemas go at the top of route files, named `[action]Schema`" — that's a convention Claude can't infer.

2. **Is this development knowledge or prompt-engine knowledge?** Apply the test: would this help a Claude Code session where the developer is coding directly with no Prompt Forge? If not, it goes in the context file.

3. **Is CLAUDE.md getting long?** If it's approaching 150 lines, propose consolidation — merge related entries, move edge-case rules to `.claude/rules/`, remove entries that are now obvious from the code.

4. **Does this contradict an existing entry?** Update the existing one, don't add a new one.

---

## 6. CLAUDE.md structure best practices

From Anthropic's own teams and documentation:

### Keep it under 150 lines of meaningful instructions
Claude Code's system prompt uses ~50 of the ~200 instruction slots that models reliably follow. CLAUDE.md shouldn't crowd that space. Focus on what Claude can't infer from reading the code.

### Don't duplicate what's obvious from the code
If every route file uses Zod, Claude will figure that out. But if there's a *specific* way you use Zod (schemas at the top of the file, named with a convention), that's worth documenting.

### Explain why, not just what
"Never use class components" is OK. "Never use class components — we migrated to hooks in Q3 and class components break our testing setup" is better. Claude uses the *why* to make judgment calls.

### Use sections
Organize by concern:
```
## Commands
## Architecture
## Conventions
## Error handling
## Testing
## Known issues
## Decisions
```

### Use .claude/rules/ for overflow
If CLAUDE.md is getting too long, split rules into `.claude/rules/` files that load on demand. Keep the most critical rules in CLAUDE.md itself. Wrap non-negotiable rules in `<critical>` tags.

### Update, don't accumulate
If a convention changes, update the existing entry — don't add a new one that contradicts it. Prompt Forge should check for contradictions when proposing additions.

---

## 7. The Self-Learning Loop (Hermes-inspired)

Hermes Agent's core insight: an agent that writes reusable skill documents after solving hard problems, and improves those documents during use, gets smarter with every session. Prompt Forge applies this same loop through CLAUDE.md and the context file.

### How the loop works

```
┌─────────────────────────────────────────────────┐
│                 Developer types                  │
│              a tired, vague prompt               │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           READ: CLAUDE.md + context file         │
│    (accumulated knowledge from all past sessions)│
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         GROUND: read code + web research         │
│     (task-specific, guided by existing context)  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│     COLLABORATE: questions + lenses + alternatives│
│       (surface what fatigue makes you forget)    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          PRODUCE: refined, grounded prompt       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              REFLECT: what did I learn?          │
│                                                  │
│  • New patterns discovered?         → CLAUDE.md  │
│  • Conventions confirmed?           → CLAUDE.md  │
│  • Gotchas / tech debt found?       → CLAUDE.md  │
│  • Decisions made + reasoning?      → CLAUDE.md  │
│  • Stack knowledge from research?   → CLAUDE.md  │
│  • New files / structure changes?   → context file│
│  • Developer preferences observed?  → context file│
│  • Prompt style feedback?           → context file│
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         PERSIST: propose additions to CLAUDE.md  │
│                 auto-update context file          │
│                                                  │
│    Next session reads these → better grounding   │
│    → smarter questions → more precise prompts    │
└─────────────────────────────────────────────────┘
```

### What makes this different from simple "save notes"

**It's not just remembering — it's refining.** Each session doesn't just add to CLAUDE.md. It:

1. **Validates existing content** — Is what's in CLAUDE.md still accurate? Did the codebase drift?
2. **Consolidates** — If 3 sessions each discovered a piece of the error handling convention, propose merging them into one clean section.
3. **Promotes implicit to explicit** — Things the developer "just knows" but never wrote down get documented when they surface in questions.
4. **Captures meta-patterns** — Not just "what the code does" but "how the developer thinks." Do they prefer simple solutions? Do they always want tests? These go in the **context file** (Prompt Forge notes), not CLAUDE.md — they shape prompts, not development.

### The Prompt Forge notes section

Add a `## Prompt Forge notes` section to the context file (not CLAUDE.md — this is skill-internal). This tracks meta-learnings about how to prompt for this specific project:

```markdown
## Prompt Forge notes
<!-- Auto-maintained by Prompt Forge. Tracks what works for this project. -->

### Developer preferences
- Prefers short prompts for simple tasks (no intent breakdown)
- Always wants tests included, even when not asked
- Pushes back on adding new dependencies — prefers using existing tools
- Likes when alternatives are proposed — doesn't just want the first idea

### Prompt patterns that work well
- Bug fixes: include the exact error path + a reproduction step
- Features: always reference an existing implementation as a pattern
- This project's routes need explicit middleware chain in the prompt

### Common adjustments the developer makes
- Often removes the "constraints" section for small tasks → keep it minimal
- Always adds "don't create new files" to refactor prompts → include by default
- Prefers Superpowers format over raw Claude Code for features
```

This section is the self-improvement mechanism. It captures *how* to prompt for this specific developer on this specific project — and it gets refined over time.

### Periodic maintenance nudges

Like Hermes Agent's periodic evaluation, Prompt Forge should occasionally nudge maintenance:

**After ~5 sessions:** "Your CLAUDE.md has grown to [N] lines across our sessions. Want me to review it for duplicates or outdated entries?"

**When contradictions are found:** "CLAUDE.md says 'use callbacks for async' but the last 3 prompts we wrote used async/await. Want me to update that section?"

**When context file is stale:** "The context file maps 3 route files, but I see 5 now. Want me to refresh it?"

**When CLAUDE.md doesn't exist yet:** "This project doesn't have a CLAUDE.md yet. Based on what I've learned so far, I can create a starter version with [patterns, commands, conventions]. Want me to draft it?"

These nudges should feel natural — part of the collaboration, not a chore.
