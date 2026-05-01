# spec-driven-slicing

A rigid skill for executing one slice at a time from prompt-pack-style spec-driven builds.

## When to use

You have:
- A directory of specs + numbered slice files (e.g. `S00_*.md`, `S01_*.md`).
- A master prompt that explains build order.
- Acceptance criteria for each slice.

You want:
- One slice executed end-to-end: read spec → tests → implement → report → STOP.
- Hard gates against scope creep, skipped tests, and slice merging.

## When NOT to use

- The pack hasn't been designed yet. Use `brainstorming` first.
- The slice has no spec. Use `writing-plans` first.
- You want to drive the whole pack autonomously without human gates between slices. This skill enforces one-slice-per-invocation by design.

## Quick start

1. `cd` into a directory containing a pack (or a parent of one).
2. Invoke this skill: tell Claude "use spec-driven-slicing" or "run slice S00".
3. The skill walks up the tree to find the pack, picks a slice, states acceptance criteria, asks for confirmation, implements, runs tests, writes a Slice Implementation Report at `<your-repo>/progress/slice-reports/<slice-stem>.md`, and STOPS.
4. Re-invoke for the next slice.

## What's bundled

- `SKILL.md` — the skill definition.

## Worked example (external)

The skill was developed against the AO Runtime prompt pack — a 22-slice spec-driven bundle for a local-first agent orchestrator. The pack is not bundled here due to licensing constraints; see `SKILL.md` § "Worked example" for how to point the skill at any pack you obtain or write yourself.

## Smoke test

See the "Smoke test (manual)" section in `SKILL.md`. Five steps; ~5 minutes.

## Designed by

Brainstormed and specced under `obra/superpowers` style: rigid skill, deterministic picker, hard gates.
