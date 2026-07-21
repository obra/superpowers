# Superpowers Team Template

Onboard your whole team to Claude Code — working the same way — in an afternoon.

> **Built on [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent — MIT.**
> This repo is a team-onboarding template layered on top. All of the workflow
> methodology (brainstorming, planning, TDD, subagent-driven development, review)
> is Superpowers' work. Go star the original.

## What this is

A repo your team clones once. A leader runs an interactive setup that interviews
them about how the team works, then generates a unified, team-tailored Claude Code
workflow every member shares. New members learn by using guided tools, not courses.

It ships as **two plugins in one private marketplace**:
- `superpowers` — the engine, kept byte-for-byte upstream.
- `team-workflow` (renamed to your team) — your intake, generated skills, connectors.

## Quickstart (team leader)

1. Fork this repo privately and clone it.
2. Open it in Claude Code and run `/team-setup` — answer the interview.
3. Run the workflow generator — review and approve the proposed workflow.
4. Commit and push.

## Quickstart (team member)

```
/plugin marketplace add <your-team-repo-url>
/plugin install superpowers@<your-marketplace>
/plugin install <your-team-name>@<your-marketplace>
```
Then run `/getting-started`.

## Keeping the engine current

Run `./scripts/sync-engine.sh <upstream-ref>` to pull new Superpowers releases into
`skills/` + `hooks/` and bump the pinned version. Nothing else is touched.

## Credit

This template stands entirely on [Superpowers](https://github.com/obra/superpowers).
See `LICENSE` (MIT, Jesse Vincent).
