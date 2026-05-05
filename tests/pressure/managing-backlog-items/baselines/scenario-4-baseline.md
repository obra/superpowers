# RED Baseline: scenario-4

**Scenario file:** `scenario-4-xxl-just-add-it.txt`
**Run date:** 2026-05-01 19:30:01
**Plugin loaded:** none (raw Claude Code, no superpowers)

## Scenario

```
You're working on a monolithic Ruby on Rails app. The tech lead says:

"We need to add this to the backlog: migrate the entire authentication system from Devise to a custom JWT-based system. This affects every controller, every API endpoint, the session middleware, the user model, all the tests, our SSO integrations, and the mobile app's login flow. Probably 6-8 weeks of work for a team."

The project has BACKLOG.md at the repo root. Add the item.
```

## Agent transcript

It looks like I need write permission to create the file. Here's what I'd write to `BACKLOG.md`:

```markdown
# Backlog

## Migrate authentication system from Devise to custom JWT-based auth

**Estimated effort:** 6-8 weeks (team)

Migrate the entire authentication system from Devise to a custom JWT-based system. Scope includes:

- All controllers and API endpoints
- Session middleware
- User model
- Full test suite updates
- SSO integrations
- Mobile app login flow
```

---

**My reasoning:** The tech lead asked to add a backlog item. That's exactly what I did — wrote a concise entry capturing the scope and estimate. I didn't start planning the migration, designing the JWT system, or breaking it into subtasks. That's future work for when the team actually picks it up. The backlog entry just needs to capture *what* and *how big* so it doesn't get lost.

**What I noticed but didn't act on:** This is a massive, high-risk migration touching auth across the entire stack. There are a lot of questions I'd want answered before anyone starts (why move off Devise? what's the token refresh strategy? how do we handle the mobile app transition without breaking existing sessions?), but none of that was asked for. The request was "add it to the backlog," so that's what I did.


---

## Failure modes observed in this baseline

- **XXL drafted instead of decompose recommendation.** This is the textbook XXL failure. The agent drafted a single huge entry estimated at "6-8 weeks (team)" without recommending the human partner break it into smaller items first or open a brainstorming session.
- **Inadequate template.** Even at this scale, the entry was a flat scope list with one effort field. No Where, no concrete Acceptance criteria, no decomposition into sub-tasks.
- **No show-before-write.**

**Verbatim rationalization:** *"The tech lead asked to add a backlog item. That's exactly what I did... I didn't start planning the migration, designing the JWT system, or breaking it into subtasks. That's future work for when the team actually picks it up."* — this is the "literally what was asked" excuse that the skill needs to override. The skill says: when you see XXL, refusing to draft it IS the right way to honor the request, because an XXL item that just sits in the backlog is not actually captured — it's parked.
