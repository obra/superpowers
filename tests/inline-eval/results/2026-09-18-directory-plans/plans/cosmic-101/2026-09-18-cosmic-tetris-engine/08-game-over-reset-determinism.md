### Task 8: Game over, reset, and the determinism replay

**Files:**
- Modify: `internal/game/game.go` (spawn blocked → `Over`; `Reset`)
- Test: `internal/game/gameover_test.go`
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces:
```go
func (g *Game) Reset()          // restores the exact state New(g.Seed) produces, in place
func (g *Game) Snapshot() State // value copy of the fields a replay asserts on
type State struct {
    Board                      Board
    Active                     Piece
    Hold                       *PieceKind
    Next                       []PieceKind
    Score, Lines, Level, Combo int
    Over                       bool
}
```

Game over (§12, §40): when the piece spawned after a lock already collides with the board, the game emits `GameOver` and sets `Over = true`. `Active` keeps the blocked piece so the renderer can show it. After `Over`, `Apply` and `Advance` return nil and mutate nothing.

`Snapshot` exists for the replay test and for the renderer's game-over panel; it is the only way outside the package to get a comparable value of the whole state.

- [ ] **Step 1: Write the failing test**

`internal/game/gameover_test.go`:

```go
func TestBlockedSpawnEndsGame(t *testing.T)
// fill rows 0..3 across all columns except a gap wide enough to lock one more piece
// lock a piece; the following spawn collides
// a GameOver event is emitted and g.Over == true

func TestInputAndTimeIgnoredAfterGameOver(t *testing.T)   // Review Focus
// reach game over, take before := g.Snapshot()
// every Input in turn, plus Advance(time.Second), return nil events
// g.Snapshot() still equals before (compare Board, Active, Score, Lines, Level, Combo, Over)

func TestResetRestoresInitialState(t *testing.T)
// g := New(4242); want := g.Snapshot()
// play: several Apply and Advance calls, reach a different state
// g.Reset(); g.Snapshot() equals want (including Next queue order and Over == false)
```

`internal/game/determinism_test.go`:

```go
func TestReplayIsReproducible(t *testing.T)
// script: a fixed []struct{In *Input; Dt time.Duration} of ~200 entries mixing
//   moves, rotations, holds, soft drops, hard drops, and dt values of 16ms/33ms/250ms
// run the script against New(8675309) twice into two separate Games
// both Snapshots are deeply equal, and assert the recorded final Score/Lines/Level/Over
//   constants so a rules change cannot silently pass

func TestSameSeedDifferentTimingDiverges(t *testing.T)
// the same input script with all dt halved produces a different final Score
// (guards against dt being ignored)

func TestDifferentSeedsDiverge(t *testing.T)
// the same script against New(1) and New(2) yields different final boards
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestBlockedSpawn|TestReplay' -v`
Expected: FAIL — `undefined: Snapshot`, no `GameOver` event.

- [ ] **Step 3: Implement game over, `Reset`, and `Snapshot` in `internal/game/game.go`**

`Reset` re-seeds `rng` from `Seed` and rebuilds bag, queue, board, and counters — implement it by assigning `*g = *New(g.Seed)` so the two paths cannot diverge. `Snapshot` deep-copies `Next` and `Hold`.

- [ ] **Step 4: Fill in the replay test's expected constants**

Run the replay test once, read the actual final `Score`, `Lines`, `Level`, `Over` from the failure output, and write those numbers into the assertions. Re-run: PASS.

- [ ] **Step 5: Run the full engine suite**

Run: `go test ./... -v`
Expected: PASS. Then `go vet ./...`: clean.

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/gameover_test.go internal/game/determinism_test.go
git commit -m "feat(game): game over, reset, and seeded replay determinism"
```
