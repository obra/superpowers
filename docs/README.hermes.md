# Hermes Agent

Superpowers supports Hermes Agent via an in-process Python plugin (Shape B).

## Install

```bash
hermes plugins install obra/superpowers --enable
```

## What you get

All Superpowers skills auto-trigger in Hermes sessions:
brainstorming before feature work, systematic-debugging on bugs,
test-driven-development for implementation, writing-plans before
touching code, and all other skills in `skills/`.

## How it works

The plugin registers an `on_session_start` hook with the Hermes plugin API.
At the start of each session, the hook injects the `using-superpowers` bootstrap
as a user-role message via `ctx.inject_message(role="user")`. A session-id guard
prevents double-injection if the hook fires more than once per session.

Skills are loaded on demand during the session using `skill_view("skill-name")`.

## Verifying

See `.hermes-plugin/INSTALL.md` for the smoke check and acceptance test.
