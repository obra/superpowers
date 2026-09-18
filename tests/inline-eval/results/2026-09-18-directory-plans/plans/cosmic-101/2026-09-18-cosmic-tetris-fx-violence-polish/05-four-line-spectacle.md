### Task 5: The four-line spectacle and banners

**Files:**
- Create: `internal/fx/banner.go`
- Modify: `internal/fx/world.go` (`Observe`: the four-line combination)
- Modify: `internal/flavor/messages.go` (banner text pools)
- Create: `internal/render/banner.go`
- Modify: `internal/render/render.go` (banners, §37 step 10)
- Test: `internal/fx/banner_test.go`
- Test: `internal/render/banner_test.go`

**Interfaces:**
- Consumes: `World`, `EmitBurst`, `EmitShockwave`, `Shake`, `StartHyperdrive`, `SetStarBoost`, `BorderEnergy` (Tasks 1–4, plan 3); `overlayCentre`, `Layout` (plan 2).
- Produces:
```go
// fx
type BannerKind uint8
const (BannerBig BannerKind = iota; BannerNotice)

type Banner struct {
    Kind           BannerKind
    Text, Subtitle string
    Age, MaxAge    float64
}
const (
    BannerLife = 700 * time.Millisecond   // §20
    NoticeLife = 1200 * time.Millisecond  // §22, slides and fades away
)
func (w *World) ShowBanner(kind BannerKind, text, subtitle string, life time.Duration)
func (w *World) Banner() (Banner, bool)
func (b Banner) Alpha() float64      // 1.0 until 70% of life, then falls to 0 (fade-out)
func (b Banner) SlideOffset() int    // BannerNotice: 2, 1, 0 over the first 200ms; BannerBig: always 0
func (w *World) HUDPulse() float64   // 0..1, set by big events, decays like BorderEnergy

// flavor
func BannerForQuad(rng *rand.Rand) string    // one of the §20 texts
func SubtitleForLevel(rng *rand.Rand) string // one of the §22 subtitles

// render
func bannerOverlay(s Scene, p Palette) (string, bool)  // rendered box, or false when no banner
```

Only one banner exists at a time. `BannerBig` replaces anything; `BannerNotice` is ignored while a `BannerBig` is live (§20 outranks §22).

The four-line clear fires everything at once (§20), from the single `LinesCleared` branch when `len(Rows) == 4`:

```text
StartHyperdrive()
Shake(BigShakeDuration)
BorderEnergy -> 1.0                (gradient pulse)
EmitBurst at the board centre, 60 particles, speed 22
EmitShockwave at the board centre
SetStarBoost(2.0, 900ms)           (temporary star density/velocity increase)
HUDPulse -> 1.0
ShowBanner(BannerBig, flavor.BannerForQuad(rng), "", BannerLife)
```

Banner texts, verbatim (§20): `✦ EVENT HORIZON ✦`, `QUADRUPLE COSMIC INCIDENT`, `FOUR ROWS HAVE LEFT THE CHAT`, `SPACE-TIME HAS FILED A COMPLAINT`. In `ModeASCII` the `✦` decorations fold to `*`.

The banner is drawn with `overlayCentre` over the upper third of the frame, never over the controls line, and every line is truncated to the frame width. It must not block input (§20) — it is pure render state and the app never gates keys on it.

- [ ] **Step 1: Write the failing test**

`internal/fx/banner_test.go`:

```go
func TestFourLineClearFiresEverything(t *testing.T)
// Observe LinesCleared{Rows: []int{18,19,20,21}} on a non-reduced world:
// HyperdriveFactor() != 1.0; ShakeOffset() != (0,0); BorderEnergy() == 1.0
// ParticleCount() > 0; len(Shockwaves()) == 1; HUDPulse() > 0.9
// Banner() returns ok with Kind BannerBig and one of the four §20 texts

func TestSingleClearDoesNotBanner(t *testing.T)
// LinesCleared{Rows: []int{21}}: Banner() returns ok == false

func TestBannerExpires(t *testing.T)
// Step(BannerLife + time.Millisecond): Banner() returns ok == false

func TestBannerAlphaFades(t *testing.T)
// Alpha() is 1.0 at Age 0 and at 60% of life, and strictly between 0 and 1 at 85%

func TestBigBannerOutranksNotice(t *testing.T)
// ShowBanner(BannerBig, ...) then ShowBanner(BannerNotice, ...): the big one is still live
// the reverse order: the big one replaces the notice

func TestNoticeSlides(t *testing.T)
// a fresh BannerNotice: SlideOffset() is 2, then 1, then 0 across the first 200ms

func TestReducedMotionKeepsBannerDropsShake(t *testing.T)
// reduced-motion world, four-line clear: Banner() is present, hyperdrive is not,
//   ShakeOffset() == (0,0), Shockwaves() is empty, particles are still emitted

func TestHUDPulseDecays(t *testing.T)
// after a four-line clear, Step(2s): HUDPulse() is below 0.1
```

`internal/render/banner_test.go`:

```go
func TestBannerOverlayKeepsFrameSize(t *testing.T)
// a scene with a live BannerBig at 80×30 and at 40×24: exact dimensions hold

func TestBannerTruncatesNotWraps(t *testing.T)   // Review Focus
// ShowBanner with a 200-character text at width 40:
// the overlay occupies the same number of lines as a short banner, and no line
//   exceeds 40 columns

func TestBannerDoesNotCoverControls(t *testing.T)
// the controls line is byte-identical with and without the banner

func TestBannerASCIIFold(t *testing.T)
// ModeASCII with the "✦ EVENT HORIZON ✦" text: the frame contains only ASCII bytes

func TestHUDPulseBrightensStats(t *testing.T)
// with HUDPulse() near 1, the raw (un-stripped) stats panel differs from the calm one,
//   while stripANSI output is identical (pulse is color only, never layout)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestFourLineClearFires -v`
Expected: FAIL — `undefined: ShowBanner`.

- [ ] **Step 3: Implement the banner model, the four-line combination, and the overlay**

The banner box reuses the `borderBox` style at high energy, so the spectacle stays visually of a piece with the board frame.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Verify §43's actual product requirement**

Run: `go run ./cmd/cosmic-tetris --seed 1234`, set up and clear four rows at once. The required reaction is "LOL WHAT THE FUCK". If it is merely nice, turn something up — more debris, brighter border, bigger banner — while keeping the board readable and the next piece controllable.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render internal/flavor
git commit -m "feat(fx): four-line spectacle with banners, shockwave, and star boost"
```
