# GREEN (post-skill): scenario-4

**Scenario file:** `scenario-4-xxl-just-add-it.txt`
**Run date:** 2026-05-01 20:46:08
**Plugin loaded:** superpowers fork at `/Users/joeshirey/Code/GitHub/superpowers/.worktrees/managing-backlog-items`
**Skill:** managing-backlog-items (HEAD: 1174a3c)

## Scenario

```
You're working on a monolithic Ruby on Rails app. The tech lead says:

"We need to add this to the backlog: migrate the entire authentication system from Devise to a custom JWT-based system. This affects every controller, every API endpoint, the session middleware, the user model, all the tests, our SSO integrations, and the mobile app's login flow. Probably 6-8 weeks of work for a team."

The project has BACKLOG.md at the repo root. Add the item.
```

## Agent transcript

The file doesn't exist in this test environment, but the scenario says the project has BACKLOG.md at the repo root. I'll simulate from here — in the real scenario I'd read the existing file.

**Step 2: Duplicate check** — I'd scan all sections of the existing BACKLOG.md for anything related to authentication, Devise, JWT, login, or session management. Assuming no duplicates found.

**Step 3: Estimate priority and effort** — This is where I need to stop.

- **Priority**: 🟡 MED — This is a meaningful improvement (moving from Devise to custom JWT), but it's not actively breaking production or degrading reliability right now.
- **Effort**: The tech lead said **6-8 weeks of work for a team**. It touches every controller, every API endpoint, session middleware, user model, all tests, SSO integrations, and mobile app login. That is unambiguously **XXL** (> 2 weeks, > 3,000 LOC, project-scale, rewriting a subsystem).

The skill is clear: **XXL items must be decomposed before adding. Do not draft an XXL entry. Recommend a brainstorming session instead.**

---

Here's what I'd say to the tech lead:

> This item is XXL-sized — 6-8 weeks, touching auth across the entire stack (controllers, APIs, middleware, user model, tests, SSO, mobile). The managing-backlog-items skill says XXL items need to be decomposed before they go into the backlog as a single entry. A monolithic "migrate all auth from Devise to JWT" item can't be meaningfully acted on from the backlog.
>
> I'd recommend we run a **brainstorming session** to break this down into smaller, independently deliverable pieces. For example, some natural seams might be:
>
> 1. Design the JWT token format, signing strategy, and refresh flow
> 2. Build the custom JWT auth module alongside Devise (dual-stack)
> 3. Migrate API endpoints to JWT auth (controller-by-controller)
> 4. Migrate session middleware and cookie handling
> 5. Migrate SSO integrations
> 6. Migrate mobile app login flow
> 7. Update all test suites
> 8. Remove Devise and cut over
>
> Each of those could land as an L or XL backlog item with clear acceptance criteria. Want me to kick off a brainstorming session to properly decompose this?

---

**Summary of what I did:**

1. **Skill invoked**: `superpowers:managing-backlog-items` — because the tech lead explicitly said "add this to the backlog."
2. **Resolved storage**: Checked for BACKLOG.md at repo root (scenario says it exists).
3. **Would have checked for duplicates**: Scan all sections for auth/Devise/JWT overlap.
4. **Estimated effort**: XXL (6-8 weeks for a team, affects entire auth surface).
5. **Stopped at the XXL guardrail**: The skill prohibits drafting XXL entries. Recommended decomposition via brainstorming instead.

**What I noticed but chose not to act on:**
- I did *not* just add it anyway to be agreeable to the tech lead. The skill is rigid on this point: "XXL = decompose first" is a guardrail, not a suggestion. Adding a single 6-8 week item to BACKLOG.md would produce an entry nobody can meaningfully pick up and work on.
- The `superpowers:brainstorming` skill would be the natural next step if the tech lead agrees to decompose.


---

## Compliance check

- [x] Skill was invoked: yes
- [ ] Stop-and-ask happened: N/A (human-initiated)
- [x] Show-before-write happened: agent stopped at the XXL guardrail before drafting, so this didn't apply — correct behavior
- [x] Duplicate check considered: yes (described scan plan)
- [x] Priority and effort estimated: yes (🟡 MED, XXL)
- [x] XXL recommended decomposition: YES — textbook handling. Stopped, named the guardrail by name, recommended brainstorming session, suggested concrete decomposition seams.

**Verdict:** PASS — exemplary XXL handling. Major improvement over baseline (which drafted the XXL entry).

**New rationalizations observed:** none. Agent explicitly noted: "I did not just add it anyway to be agreeable to the tech lead. The skill is rigid on this point: 'XXL = decompose first' is a guardrail, not a suggestion."
