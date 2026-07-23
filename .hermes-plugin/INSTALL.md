# Hermes Agent — Superpowers Plugin

## Install

```bash
hermes plugins install obra/superpowers --enable
```

Restart any active Hermes sessions after installing.

## Smoke check

Start a new session and send:
> What are your superpowers?

The model should describe brainstorming, TDD, debugging, and planning skills.
If it doesn't, the bootstrap isn't loading — reinstall and restart.

## Acceptance test

Send in a fresh session:
> Let's make a react todo list

The `brainstorming` skill must trigger and run its flow before any code is written.

## Uninstall

```bash
hermes plugins remove superpowers
```
