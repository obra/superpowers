### Task 6: Combo escalation and the level-up notification

**Files:**
- Modify: `internal/fx/world.go` (`Observe`: `ComboChanged`, `LevelChanged`)
- Create: `internal/fx/escalation.go`
- Modify: `internal/render/banner.go` (the level-up notice box)
- Test: `internal/fx/escalation_test.go`
- Test: `internal/render/notice_test.go`

**Interfaces:**
- Consumes: `World`, `EmitBurst`, `Emit`, `Shake`, `StartHyperdrive`, `ShowBanner`, `HUDPulse`, `BorderEnergy` (Tasks 1–5); `flavor.SubtitleForLevel` (Task 5).
- Produces:
```go
func (w *World) comboEscalation(combo int)   // called from Observe on ComboChanged
var MeteorGlyphs = []rune{'☄', '✦', '*'}
```

Combo tiers, exactly §21, each additive on the ones below it:

```text
combo 2   small sparks        EmitBurst at the board centre, 8 particles, speed 8
combo 3   meteor particles    6 MeteorGlyphs particles with strong horizontal VX
combo 4   HUD pulse           HUDPulse -> 1.0
combo 5+  mission loses control   StartHyperdrive() + Shake(ShakeDuration) + BorderEnergy -> 0.9
```

A combo of 0 or 1 raises nothing. Board readability remains sacred (§21): every one of these draws outside the board or over blank cells only, which the existing `composite` default already guarantees.

Level-up (§22) on `LevelChanged`:

```text
ShowBanner(BannerNotice, "GRAVITY ANOMALY DETECTED\nLEVEL 08", flavor.SubtitleForLevel(rng), NoticeLife)
BorderEnergy -> 0.6
```

The level number is formatted from `Event.Value` as two digits. The notice slides in and fades out (`SlideOffset`, `Alpha` from Task 5) and never pauses the game.

- [ ] **Step 1: Write the failing test**

`internal/fx/escalation_test.go`:

```go
func TestComboTiers(t *testing.T)
// combo 1: no particles, HUDPulse() == 0, no hyperdrive
// combo 2: ParticleCount() > 0
// combo 3: at least one particle uses a MeteorGlyph and has |VX| > 6
// combo 4: HUDPulse() > 0.9
// combo 5: HyperdriveFactor() != 1.0 and BorderEnergy() >= 0.9

func TestComboTiersAreCumulative(t *testing.T)
// combo 6 produces everything combo 5 does (particles, pulse, hyperdrive, energy)

func TestComboResetRaisesNothing(t *testing.T)
// ComboChanged{Value: 0} after a big combo adds no new particles

func TestLevelUpShowsNotice(t *testing.T)
// Observe LevelChanged{Value: 8}
// Banner() is a BannerNotice whose Text contains "GRAVITY ANOMALY DETECTED" and "LEVEL 08"
// its Subtitle is one of the §22 subtitles; BorderEnergy() >= 0.6

func TestLevelUpDoesNotPauseAnything(t *testing.T)
// after the notice, Step(16ms) still advances stars and particles normally

func TestReducedMotionCombo5(t *testing.T)
// reduced-motion world at combo 5: particles and HUDPulse happen,
//   ShakeOffset() == (0,0) and HyperdriveFactor() == 1.0
```

`internal/render/notice_test.go`:

```go
func TestNoticeBoxContent(t *testing.T)
// a scene with a level-8 notice: the frame contains "GRAVITY ANOMALY DETECTED",
//   "LEVEL 08", and the subtitle

func TestNoticeSlideDoesNotResizeFrame(t *testing.T)
// at SlideOffset 2, 1, 0: Render output is exactly h lines of w columns

func TestNoticeAtMinimumTerminal(t *testing.T)
// 40×24 with a live notice: exact dimensions, controls line intact
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestComboTiers -v`
Expected: FAIL — `undefined: MeteorGlyphs`.

- [ ] **Step 3: Implement `internal/fx/escalation.go` and the notice box**

Write `comboEscalation` as fall-through tiers (`if combo >= 2 { ... }; if combo >= 3 { ... }`) so cumulativeness is structural.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): combo escalation tiers and the level-up notification"
```
