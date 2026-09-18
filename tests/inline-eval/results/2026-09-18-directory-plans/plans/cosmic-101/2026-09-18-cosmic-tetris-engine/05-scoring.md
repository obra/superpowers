### Task 5: Scoring and level progression

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
```go
func LineScore(lines, level int) int   // 0,100,300,500,800 × level for lines 0..4
func ComboBonus(combo, level int) int  // 50 * (combo-1) * level, never negative
func LevelFor(lines int) int           // lines/10 + 1
func SoftDropPoints(cells int) int     // 1 per cell
func HardDropPoints(cells int) int     // 2 per cell
```

- [ ] **Step 1: Write the failing test**

`internal/game/scoring_test.go`:

```go
func TestLineScoreValues(t *testing.T)
// level 1: 0,100,300,500,800 for 0..4 lines
// level 7: 4 lines == 5600; 1 line == 700

func TestComboBonus(t *testing.T)
// ComboBonus(0, 5) == 0
// ComboBonus(1, 5) == 0     // a lone clear earns no combo bonus (§49.1)
// ComboBonus(2, 5) == 250
// ComboBonus(4, 3) == 450

func TestLevelFor(t *testing.T)
// 0 lines -> 1; 9 -> 1; 10 -> 2; 19 -> 2; 20 -> 3; 127 -> 13

func TestDropPoints(t *testing.T)
// SoftDropPoints(3) == 3; HardDropPoints(3) == 6; both 0 for 0 cells
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestLineScore|TestComboBonus' -v`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Implement `internal/game/scoring.go`**

Base values from a `[5]int{0, 100, 300, 500, 800}` table indexed by line count; clamp the index.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): line, combo, drop scoring and level progression"
```
