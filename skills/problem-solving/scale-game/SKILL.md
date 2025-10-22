---
name: Scale Game
description: Test at extremes (1000x bigger/smaller, instant/year-long) to expose fundamental truths hidden at normal scales
when_to_use: when uncertain about scalability, edge cases unclear, or validating architecture for production volumes
version: 1.1.0
---

# Scale Game

## Overview

Test your approach at extreme scales to find what breaks and what surprisingly survives.

**Core principle:** Extremes expose fundamental truths hidden at normal scales.

## Quick Reference

| Scale Dimension | Test At Extremes | What It Reveals |
|-----------------|------------------|-----------------|
| Volume | 1 item vs 1B items | Algorithmic complexity limits |
| Speed | Instant vs 1 year | Async requirements, caching needs |
| Users | 1 user vs 1B users | Concurrency issues, resource limits |
| Duration | Milliseconds vs years | Memory leaks, state growth |
| Failure rate | Never fails vs always fails | Error handling adequacy |

## Process

1. **Pick dimension** - What could vary extremely?
2. **Test minimum** - What if this was 1000x smaller/faster/fewer?
3. **Test maximum** - What if this was 1000x bigger/slower/more?
4. **Note what breaks** - Where do limits appear?
5. **Note what survives** - What's fundamentally sound?

## Examples

### Example 1: Error Handling
**Normal scale:** "Handle errors when they occur" works fine
**At 1B scale:** Error volume overwhelms logging, crashes system
**Reveals:** Need to make errors impossible (type systems) or expect them (chaos engineering)

### Example 2: Synchronous APIs
**Normal scale:** Direct function calls work
**At global scale:** Network latency makes synchronous calls unusable
**Reveals:** Async/messaging becomes survival requirement, not optimization

### Example 3: In-Memory State
**Normal duration:** Works for hours/days
**At years:** Memory grows unbounded, eventual crash
**Reveals:** Need persistence or periodic cleanup, can't rely on memory

## Red Flags You Need This

- "It works in dev" (but will it work in production?)
- No idea where limits are
- "Should scale fine" (without testing)
- Surprised by production behavior

## Remember

- Extremes reveal fundamentals
- What works at one scale fails at another
- Test both directions (bigger AND smaller)
- Use insights to validate architecture early
