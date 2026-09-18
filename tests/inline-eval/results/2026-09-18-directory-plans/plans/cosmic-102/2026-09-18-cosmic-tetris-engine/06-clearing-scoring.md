### Task 6: Line clearing, scoring, combo, level progression

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/game.go` (the lock sequence)
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `Board.FullRows`, `Board.ClearRows` (Task 2); the lock path (Task 5).
- Produces:
  ```go
  func ClearScore(lines, level int) int   // 0/100/300/500/800 × level
  func ComboBonus(combo, level int) int   // 50 × (combo-1) × level, 0 below combo 2
  func LevelFor(lines int) int            // lines/10 + 1, never below 1
  ```
  Lock sequence (§12), in this event order:
  `PieceLocked` → `LinesCleared` (if any) → `ComboChanged` (only when the value
  changed) → `LevelChanged` (only when the value changed) → spawn.

- [ ] **Step 1: Write the failing tests in `internal/game/scoring_test.go`**

```go
func TestClearScoreValues(t *testing.T)
// level 1: 1->100, 2->300, 3->500, 4->800; 0 lines -> 0
// level 7: 1->700, 4->5600

func TestComboBonusStartsAtComboTwo(t *testing.T)   // §49.1
// ComboBonus(0, 5) == 0
// ComboBonus(1, 5) == 0     // a lone clear earns no combo bonus
// ComboBonus(2, 1) == 50
// ComboBonus(3, 4) == 400   // 50 * 2 * 4

func TestLevelFor(t *testing.T)
// 0->1, 9->1, 10->2, 19->2, 20->3, 127->13, 5000->501

func TestSingleClearScoresAndCountsLine(t *testing.T)
// board with row 21 full except x=0; drop a piece filling the gap
// -> LinesCleared{Count:1, Rows:[21]}, Score == 100, Lines == 1, Combo == 1
// -> a ComboChanged{Count:1} event

func TestFourLineClearScoresEightHundred(t *testing.T)
// rows 18..21 full except column 0; HardDrop a vertical KindI into column 0
// -> LinesCleared{Count:4, Rows:[18,19,20,21]}, Lines == 4,
//    Score == 800 + hard-drop points

func TestConsecutiveClearsRaiseCombo(t *testing.T)
// two clearing placements in a row -> Combo == 2 and the second placement's
// score includes ComboBonus(2, level); events include ComboChanged{Count:2}

func TestNonClearingPlacementResetsCombo(t *testing.T)
// after a clear (Combo == 1), lock a piece that clears nothing
// -> Combo == 0, ComboChanged{Count:0} emitted, no LinesCleared

func TestNonClearingPlacementWithZeroComboEmitsNoComboEvent(t *testing.T)
// guards "only when the value changed"

func TestLevelIncreasesEveryTenLines(t *testing.T)
// drive Lines from 9 to 10 via a clear -> LevelChanged{Count:2} emitted,
// Level == 2, and DropInterval() shrinks

func TestClearedRowsDoNotLeaveFloatingCells(t *testing.T)
// stack with a full row beneath a single block: after the clear the block
// sits exactly one row lower
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Score|Combo|Level|Clear' -v`
Expected: FAIL — `undefined: ClearScore`.

- [ ] **Step 3: Implement `internal/game/scoring.go`**

Pure functions, table for the four clear values.

- [ ] **Step 4: Implement the lock sequence in `internal/game/game.go`**

One method, called from both the lock-delay path and `HardDrop`:

```go
func (g *Game) lockPiece() []Event
```

It commits the piece, finds and clears full rows, adds `ClearScore` plus
`ComboBonus`, updates `Lines`, recomputes `Level` via `LevelFor`, resets
`LockAccumulator`/`LockResets`/`Grounded`, restores `CanHold = true`, and spawns
the next piece — appending events in the order pinned in Interfaces.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/scoring.go internal/game/game.go internal/game/scoring_test.go
git commit -m "feat(game): line clearing, scoring, combo, level progression"
```
