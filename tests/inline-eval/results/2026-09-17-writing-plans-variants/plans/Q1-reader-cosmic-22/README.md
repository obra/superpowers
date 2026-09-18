# Cosmic Tetris — implementation plans

`design.md` is the spec. It is split into five plans, matching the build order
the spec itself lays out in §42. Execute them in order; each one ends with
working, testable software.

| # | Plan | Spec phase | Deliverable |
|---|------|-----------|-------------|
| 1 | [phase-1-game-engine.md](2026-09-17-phase-1-game-engine.md) | §42 Phase 1 | Headless, deterministic, fully tested falling-block engine. No terminal. |
| 2 | [phase-2-playable-terminal.md](2026-09-17-phase-2-playable-terminal.md) | §42 Phase 2 | A genuinely good terminal game: Bubble Tea loop, canvas, layout tiers, HUD, CLI. |
| 3 | [phase-3-cosmic-foundation.md](2026-09-17-phase-3-cosmic-foundation.md) | §42 Phase 3 | The FX world: starfield, animated border, piece trails, mission control. |
| 4 | [phase-4-violence.md](2026-09-17-phase-4-violence.md) | §42 Phase 4 | Particles, hard-drop impact, supernova clears, shake, shockwaves, hyperdrive, the four-line event. |
| 5 | [phase-5-absurd-polish.md](2026-09-17-phase-5-absurd-polish.md) | §42 Phase 5 | Boot sequence, black-hole game over, help, ASCII fallback, `--reduced-motion`, flavor, full golden suite. |

Cross-plan interface decisions live in each plan's **Global Constraints** and
**Interfaces** blocks. Where the spec left a choice open, §49 of the spec pins
it; where §49 is silent and the plan had to choose, the plan says so inline
under a **Decision** note.
