### Task 4: Movement, wall kicks, landing, gravity curve

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `Board`, `Board.Collides` (Task 2), `Piece`, `Piece.Rotated` (Task 1).
- Produces:
```go
// KickOffsets are tried in order; the first non-colliding placement wins (§7).
var KickOffsets = [8][2]int{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}

func TryMove(b *Board, p Piece, dx, dy int) (Piece, bool)   // false leaves p untouched
func TryRotate(b *Board, p Piece, cw bool) (Piece, bool)     // applies KickOffsets in order
func Landing(b *Board, p Piece) Piece                        // p dropped until one more row would collide
func DropDistance(b *Board, p Piece) int                     // Landing(b,p).Y - p.Y
func GravityInterval(level int) time.Duration                // 800ms * 0.86^(level-1), floor 60ms
```

- [ ] **Step 1: Write the failing test**

`internal/game/rules_test.go`:

```go
func TestTryMoveBlockedAtWall(t *testing.T)
// Piece{Kind: KindO, X: 0, Y: 5}: TryMove(dx=-1) returns ok==false and the original piece
// TryMove(dx=+1) returns ok==true with X==1

func TestTryRotateUsesFirstValidKick(t *testing.T)
// KindI at X=-1 (its rotation-1 column would sit off-board at the left):
// TryRotate(cw) succeeds and the returned piece's cells are all within [0,Width)

func TestTryRotateFailsWhenNoKickFits(t *testing.T)
// fill the whole board except the four cells a vertical KindI occupies
// TryRotate on that piece returns ok==false and the piece unchanged

func TestLandingRestsOnStack(t *testing.T)
// fill row 21; Landing(KindO at X=4,Y=0).Y is the row where its lower cells sit at y==20
// DropDistance matches that delta

func TestLandingOnEmptyBoard(t *testing.T)
// KindI spawned: Landing puts its cells in row 21

func TestGravityIntervalCurve(t *testing.T)
// GravityInterval(1) == 800*time.Millisecond
// GravityInterval(2) is within 1ms of 688ms
// GravityInterval(5) < GravityInterval(4)

func TestGravityIntervalFloor(t *testing.T)   // Review Focus
// GravityInterval(99) == 60*time.Millisecond
// GravityInterval(1000) == 60*time.Millisecond  (no zero, no negative)
// GravityInterval(0) == 800*time.Millisecond    (defensive: treat <1 as level 1)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestTryMove|TestGravityInterval' -v`
Expected: FAIL — `undefined: TryMove`.

- [ ] **Step 3: Implement `internal/game/rules.go`**

`GravityInterval` computes in `float64` milliseconds with `math.Pow(0.86, level-1)`, then clamps and converts. `TryRotate` rotates first, then walks `KickOffsets` applying each as a translation to the rotated piece.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): movement, wall kicks, landing, gravity curve"
```
