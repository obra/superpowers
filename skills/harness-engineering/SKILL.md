---
name: harness-engineering
description: Use when you need deterministic verification harnesses with clear evidence artifacts and one canonical gate command.
---

# Harness Engineering

## When to Use
Use before broad rollout when you need reliable, repeatable verification instead of ad-hoc checks.

## Core Contract
1. Stabilize inputs (fixed fixtures/env/time).
2. Stabilize outputs (predictable artifact path and JSON shape).
3. Keep one canonical gate command.
4. Separate mutating update tasks from read-only check tasks.

## Failure Taxonomy
- CONFIG_ERROR
- ENV_ERROR
- CHECK_FAIL
- NON_DETERMINISM
- INTERNAL_ERROR

## Boundaries
This skill defines harness process mechanics, not domain business assertions.
