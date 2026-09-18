### Task 5: Piece trails and quantum storage

**Files:**
- Create: `internal/fx/trails.go`
- Modify: `internal/render/fxdraw.go` (add `DrawBoardFX`)
- Modify: `internal/render/render.go` (composite board-local FX after the active piece)
- Test: `internal/fx/trails_test.go`
- Test: `internal/render/boardfx_test.go`

**Interfaces:**
- Consumes: `World`, `Snapshot`, `TrailLife`, `HoldFlashLife` (Task 1);
  `CellOrigin` (plan 2 Task 3).
- Produces:
  ```go
  // fx
  type Trail struct {
      X, Y  int              // board cell coords
      Age   float64          // 0..1 through TrailLife
      Kind  game.PieceKind
  }
  func (w *World) Trails() []Trail

  type HoldFlash struct {
      Progress float64        // 0..1 through HoldFlashLife
      Outgoing game.PieceKind
      Incoming game.PieceKind
  }
  func (w *World) HoldFlash() (HoldFlash, bool)

  // render
  func DrawBoardFX(c *Canvas, l Layout, w *fx.World, opt Options)
  ```
  Pinned: on `PieceMoved` or `PieceRotated` (gravity steps emit `PieceMoved` too),
  the piece's **previous** cells become trails with `TrailLife` (140ms, §17). The
  engine's `Event.Piece` carries the post-change piece, so the previous cells come
  from the `ActiveCells` of the snapshot `fx` observed last frame — `World` keeps
  that copy for exactly this purpose. `HoldFlash.Outgoing` is the `HoldUsed`
  event's `Event.Piece.Kind`; `Incoming` is the new snapshot's `ActiveKind`. Trail glyph by age:
  `< 0.34` → `▓▓`, `< 0.67` → `▒▒`, else `░░` [ASCII `##`, `++`, `..`], painted
  in the piece's own color, faint. A hard drop's stronger vertical trail is
  Task 6. On `HoldUsed`, start a `HoldFlash` lasting `HoldFlashLife` (120ms, §9):
  the outgoing piece compresses, streaks sideways, and disappears while the
  incoming one flashes in. Gameplay never waits for it (§9).

- [ ] **Step 1: Write the failing tests in `internal/fx/trails_test.go`**

```go
func TestMovementLeavesTrailsAtTheOldCells(t *testing.T)
// Observe(nil, snapshot A) to prime the previous cells, then
// Observe([]Event{PieceMoved}, snapshot B one column right)
// -> four Trails at snapshot A's cells, with the piece's Kind

func TestFirstObserveLeavesNoTrails(t *testing.T)
// with no previous snapshot, a PieceMoved event produces no trails
// (nothing to trail from — and no zero-value cells at (0,0))

func TestTrailsExpireWithinTrailLife(t *testing.T)
// Advance(TrailLife + 1ms) -> Trails() empty

func TestTrailAgeProgresses(t *testing.T)
// at 35ms Age ≈ 0.25, at 70ms ≈ 0.5, at 105ms ≈ 0.75 (±0.05)

func TestTrailsAccumulateAcrossSuccessiveMoves(t *testing.T)
// three moves within 20ms of each other -> 12 trails, all live

func TestRotationAlsoLeavesTrails(t *testing.T)

func TestTrailsNeverCoverCurrentActiveCells(t *testing.T)   // §44
// no Trail shares a cell with the snapshot's ActiveCells

func TestHoldFlashStartsAndExpires(t *testing.T)
// Observe(HoldUsed): HoldFlash present with Progress 0 and both kinds set;
// after Advance(HoldFlashLife) it is absent

func TestHoldFlashDoesNotDelayAnything(t *testing.T)
// while a HoldFlash is live, Trails/Particles/Stars still advance normally

func TestDisabledWorldHasNoTrails(t *testing.T)
```

- [ ] **Step 2: Write the failing render tests in `internal/render/boardfx_test.go`**

```go
func TestTrailGlyphsByAge(t *testing.T)
// three trails with Age .1/.5/.9 render ▓▓ / ▒▒ / ░░ at their CellOrigin

func TestASCIITrailGlyphs(t *testing.T)   // ## / ++ / ..

func TestTrailsNeverOverwriteLockedOrActiveCells(t *testing.T)   // §44
// place a trail on a cell that is locked, and another on an active cell:
// both cells still show their block glyph after DrawBoardFX

func TestBoardFXStaysInsideTheBoardBox(t *testing.T)
// a trail at every board coordinate: nothing is written outside the border

func TestBoardFXClipsOnTooSmallLayout(t *testing.T)
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Trail|Hold|BoardFX' -v`
Expected: FAIL — `undefined: Trails`.

- [ ] **Step 4: Implement `trails.go` and `DrawBoardFX`**

Trails live in a reused slice compacted each `Advance`, same pattern as
particles. `DrawBoardFX` runs after `DrawBoard` in `Render` and skips any cell
occupied by a locked block or the active piece, which is what makes §44's
"never obscure the active piece" structural rather than incidental.

- [ ] **Step 5: Run the tests and look at it**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: moving a piece sideways leaves a short ion smear that vanishes in about
a seventh of a second; `c` produces a brief sideways streak.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/trails.go internal/fx/trails_test.go internal/render/
git commit -m "feat(fx): ion trails and quantum-storage hold flash"
```
