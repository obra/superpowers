### Task 8: Game over and restart

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: the lock sequence (Task 6).
- Produces:
  ```go
  func (g *Game) Restart()   // same Seed, fresh state
  ```
  Internal spawn helper shared by the lock path and `UseHold`:
  ```go
  func (g *Game) spawn(k PieceKind) []Event   // GameOver when the piece cannot fit
  ```
  Once `g.Over` is true, `Advance`, the movement methods, `SoftDrop`,
  `HardDrop`, and `UseHold` all return no events and change nothing.

- [ ] **Step 1: Write the failing tests in `internal/game/gameover_test.go`**

```go
func TestBlockedSpawnEndsTheGame(t *testing.T)
// stack the board so a lock leaves the spawn rows occupied:
// the locking Advance/HardDrop returns ... PieceLocked, [LinesCleared], GameOver
// and g.Over is true

func TestGameOverEmittedExactlyOnce(t *testing.T)
// after Over, further Advance(1s) calls return no events

func TestInputIgnoredAfterGameOver(t *testing.T)
// MoveLeft, MoveRight, RotateCW, RotateCCW, SoftDrop, HardDrop, UseHold
// each return no events and leave Score/Board/Active untouched

func TestGameOverPreservesFinalStats(t *testing.T)
// Score, Lines, Level readable and unchanged after Over

func TestRestartResetsStateWithSameSeed(t *testing.T)
// play a while, Restart(): Score/Lines/Combo == 0, Level == 1, !Over,
// Hold == nil, CanHold, board empty, Seed unchanged, and the piece sequence
// matches a fresh New(seed) — Active and Next are identical

func TestRestartFromMidGameIsIdenticalToFreshGame(t *testing.T)
// deep-compare New(4242) against a played-then-Restart()ed game of seed 4242
// (compare Board, Active, Next, Hold, all counters, and both accumulators)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'GameOver|Restart|Blocked' -v`
Expected: FAIL — `g.Restart undefined`.

- [ ] **Step 3: Implement `spawn`, `Restart`, and the `Over` guards in `internal/game/game.go`**

`Restart` rebuilds the game in place from `Seed` (assign `*g = *New(g.Seed)`) so
there is exactly one construction path and no field can be forgotten. Add the
`if g.Over { return nil }` guard at the top of every public mutator.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gameover_test.go
git commit -m "feat(game): game over on blocked spawn and seed-stable restart"
```
