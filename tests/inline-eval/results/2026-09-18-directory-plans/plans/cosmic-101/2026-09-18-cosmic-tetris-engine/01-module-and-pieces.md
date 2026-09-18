### Task 1: Module scaffold and tetromino geometry

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
```go
type PieceKind uint8
const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
func (k PieceKind) String() string   // "I","J","L","O","S","T","Z"
func (k PieceKind) BoxSize() int     // I:4  O:2  rest:3
func AllKinds() [7]PieceKind         // I,J,L,O,S,T,Z in that order

type Piece struct { Kind PieceKind; Rotation int; X, Y int }
func Spawn(k PieceKind) Piece         // Rotation 0; X=3 except KindO X=4; Y=0
func (p Piece) Cells() [4][2]int      // absolute board coords {x,y}, sorted ascending by (y,x)
func (p Piece) Rotated(cw bool) Piece // Rotation wraps 0..3; X,Y unchanged
```

Rotation-0 cell offsets inside the kind's box, `{x,y}` with `y` downward:

```text
I (4×4): (0,1) (1,1) (2,1) (3,1)
J (3×3): (0,0) (0,1) (1,1) (2,1)
L (3×3): (2,0) (0,1) (1,1) (2,1)
O (2×2): (0,0) (1,0) (0,1) (1,1)
S (3×3): (1,0) (2,0) (0,1) (1,1)
T (3×3): (1,0) (0,1) (1,1) (2,1)
Z (3×3): (0,0) (1,0) (1,1) (2,1)
```

Rotations 1–3 are the rotation-0 offsets turned clockwise inside the box: `(x,y) → (N-1-y, x)` where `N = BoxSize()`. `Cells()` adds `p.X, p.Y` to the rotated offsets. `KindO` is a 2×2 box, so all four of its rotations produce the same cells.

- [ ] **Step 1: Initialize the module**

Run: `go mod init cosmic-tetris` in the repo root, then confirm `go.mod` declares `go 1.26` (edit the line if `go mod init` wrote a different version).

- [ ] **Step 2: Write the failing test**

`internal/game/piece_test.go`:

```go
func TestSpawnPositions(t *testing.T)
// Spawn(KindT) == Piece{Kind: KindT, Rotation: 0, X: 3, Y: 0}
// Spawn(KindO).X == 4
// every kind: all Spawn(k).Cells() have y <= 1  (piece starts in the hidden rows)

func TestTRotations(t *testing.T)
// Piece{Kind: KindT, X: 0, Y: 0} at each rotation, Cells() equals exactly:
//   rot 0: {{1,0},{0,1},{1,1},{2,1}}
//   rot 1: {{1,0},{1,1},{2,1},{1,2}}
//   rot 2: {{0,1},{1,1},{2,1},{1,2}}
//   rot 3: {{1,0},{0,1},{1,1},{1,2}}

func TestIRotationIsVerticalAt1(t *testing.T)
// Piece{Kind: KindI, X: 0, Y: 0}.Rotated(true).Cells() == {{2,0},{2,1},{2,2},{2,3}}

func TestORotationInvariant(t *testing.T)
// all four rotations of KindO at X=0,Y=0 produce identical Cells()

func TestRotatedWraps(t *testing.T)
// Piece{Rotation: 3}.Rotated(true).Rotation == 0
// Piece{Rotation: 0}.Rotated(false).Rotation == 3

func TestCellsAreSorted(t *testing.T)
// for every kind and rotation, Cells() is non-decreasing in (y,x)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestSpawn|TestT Rotations' -v`
Expected: build failure — `undefined: Spawn`, `undefined: KindT`.

- [ ] **Step 4: Implement `internal/game/piece.go`**

Store the rotation-0 offsets as a `[7][4][2]int` table keyed by kind; compute rotations with the `(x,y) → (N-1-y, x)` rule rather than storing 28 tables.

- [ ] **Step 5: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS, all six tests.

- [ ] **Step 6: Commit**

```bash
git add go.mod internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, rotations, and spawn geometry"
```
