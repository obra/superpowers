### Task 9: Four-line banner, level-up card, combo escalation

**Files:**
- Create: `internal/fx/banner.go`
- Create: `internal/flavor/messages.go`
- Modify: `internal/render/fxdraw.go` (add `DrawBanners`)
- Modify: `internal/render/render.go` (banners after global FX, before mission control)
- Test: `internal/fx/banner_test.go`
- Test: `internal/flavor/messages_test.go`
- Test: `internal/render/banner_test.go`

**Interfaces:**
- Consumes: `World`, `TriggerHyperdrive`, `EmitShockwave`, `EmitBurst`,
  `FlashBorder` (Tasks 1–8).
- Produces:
  ```go
  // flavor — pure tables plus seeded pickers; imports only math/rand
  func TetrisBanner(rng *rand.Rand) string      // the four §20 lines
  func LevelSubtitle(rng *rand.Rand) string     // the three §22 subtitles
  func ComboLine(combo int) string              // §21, combo >= 5
  func MissionControl(rng *rand.Rand) string    // §27 table (used in Task 10)

  // fx
  type Banner struct {
      Text     string
      Subtitle string
      Progress float64   // 0..1 through its life
      Kind     BannerKind
  }
  type BannerKind int
  const (BannerTetris BannerKind = iota; BannerLevel; BannerCombo)
  func (w *World) Banners() []Banner
  func (w *World) HUDPulse() float64   // 0..1; non-zero from combo 4 (§21)
  func (w *World) StarDensityBoost() float64   // 0..1, four-line clears (§20)

  // render
  func DrawBanners(c *Canvas, l Layout, w *fx.World, opt Options)
  ```
  Pinned copy. Four-line banner text, chosen at random from §20:
  `✦ EVENT HORIZON ✦`, `QUADRUPLE COSMIC INCIDENT`,
  `FOUR ROWS HAVE LEFT THE CHAT`, `SPACE-TIME HAS FILED A COMPLAINT`.
  Level card (§22): text `GRAVITY ANOMALY DETECTED`, second line
  `LEVEL 08` (two digits), subtitle one of `GRAVITY TAX INCREASED`,
  `LOCAL PHYSICS UPDATED WITHOUT CONSENT`,
  `PLEASE SECURE ALL LOOSE TETROMINOES`. Combo lines (§21):
  `COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`,
  `COMBO 6 // STRUCTURAL REALITY FAILURE`,
  `COMBO 7 // NASA DENIES EVERYTHING`, and for 8+ reuse the highest.

  Escalation ladder (§21): combo 2 → small sparks (`EmitBurst` of 8);
  combo 3 → meteor particles (12, with downward bias); combo 4 → `HUDPulse`
  becomes non-zero; combo 5+ → a combo banner, a shockwave, and hyperdrive.

  Four-line clear fires everything at once (§20): hyperdrive, a larger shake
  (the Task 6 pattern run twice), a rapid border gradient (`FlashBorder(1.0)`),
  a particle eruption (40), a HUD flash, `StarDensityBoost`, and the banner for
  `BannerLife` (700ms). It must not block input (§20) — the app keeps handling
  keys, which Task 13 verifies end to end.

  Banners are drawn centered **above** the board box when the layout has the
  room, and over the board's upper rows otherwise, never over its lowest 10 rows
  (§44: never obscure the active piece's likely position).

- [ ] **Step 1: Write the failing tests in `internal/flavor/messages_test.go`**

```go
func TestTetrisBannerReturnsOnlySpecLines(t *testing.T)
// 200 draws from seed 1: every result is one of the four §20 strings, and all
// four appear at least once

func TestLevelSubtitleReturnsOnlySpecLines(t *testing.T)

func TestComboLineByCombo(t *testing.T)
// 5,6,7 map to their §21 lines; 8 and 20 return the combo-7 line;
// 4 and below return ""

func TestPickersAreSeedDeterministic(t *testing.T)
```

- [ ] **Step 2: Write the failing tests in `internal/fx/banner_test.go`**

```go
func TestFourLineClearRaisesEverything(t *testing.T)   // §20
// Observe(LinesCleared{Count:4, Rows:[18,19,20,21]}):
//   a BannerTetris banner exists with one of the four texts
//   HyperdriveActive()
//   BorderFlash() == 1
//   ParticleCount() grew by >= 40
//   StarDensityBoost() > 0
//   exactly one Shockwave

func TestBannerExpiresAfterSevenHundredMilliseconds(t *testing.T)
// live at 699ms, gone at 701ms

func TestLevelCardOnLevelChange(t *testing.T)   // §22
// Observe(LevelChanged{Count:8}): a BannerLevel with "GRAVITY ANOMALY DETECTED",
// "LEVEL 08", and a §22 subtitle; gone after LevelCardLife

func TestLevelCardDoesNotPauseAnything(t *testing.T)
// stars and particles keep advancing while the card is live

func TestComboEscalationLadder(t *testing.T)   // §21
// ComboChanged{Count:2} -> ~8 new particles, no banner
// Count:3 -> ~12 new particles with downward bias
// Count:4 -> HUDPulse() > 0
// Count:5 -> a BannerCombo with the §21 combo-5 line, a shockwave, hyperdrive

func TestComboResetClearsThePulse(t *testing.T)
// ComboChanged{Count:0} -> HUDPulse() returns to 0

func TestSingleClearDoesNotBanner(t *testing.T)
// Count:1 -> no banner, no hyperdrive, BorderFlash() == 0.4

func TestBannersAreBoundedInNumber(t *testing.T)
// 50 four-line clears in one frame: at most 3 banners live

func TestDisabledWorldHasNoBanners(t *testing.T)
```

- [ ] **Step 3: Write the failing render tests in `internal/render/banner_test.go`**

```go
func TestBannerIsCenteredAndInsideTheTerminal(t *testing.T)
// at 40x24, 56x27, 80x30: every banner line fits and the frame keeps its
// exact line count and width

func TestBannerNeverCoversTheLowerBoard(t *testing.T)   // §44
// a live banner at 40x24: no banner glyph appears in the board's lowest 10 rows

func TestLevelCardRendersItsBox(t *testing.T)
// contains "GRAVITY ANOMALY DETECTED" and "LEVEL 08" inside a bordered box

func TestHUDPulseBrightensStatsWithoutMovingThem(t *testing.T)
// pulse 0 vs 1: the stat glyph positions are identical, the paint differs

func TestASCIIBannerBordersAreASCII(t *testing.T)
```

- [ ] **Step 4: Run the three test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/flavor/ ./internal/render/ -run 'Banner|Combo|Level|HUDPulse|Tetris' -v`
Expected: FAIL — `undefined: flavor.TetrisBanner`.

- [ ] **Step 5: Implement `flavor/messages.go`, `fx/banner.go`, and `DrawBanners`**

Flavor is tables plus `rng.Intn`. The banner list is a small fixed-capacity
slice; a fourth banner replaces the oldest.

- [ ] **Step 6: Run the tests and get the reaction (§43)**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: set up and land a four-line clear. The required product reaction is
"LOL WHAT THE FUCK" (§43). If it is merely nice, raise the particle count and the
border gradient speed until it is not.

- [ ] **Step 7: Commit**

```bash
git add internal/flavor/ internal/fx/banner.go internal/fx/banner_test.go internal/render/
git commit -m "feat(fx): four-line spectacle, level-up card, combo escalation"
```
