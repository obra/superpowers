### Task 1: Module skeleton, piece kinds, and rotation tables

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  type PieceKind int
  const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
  var AllKinds = [7]PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}
  func (k PieceKind) String() string          // "I", "J", "L", "O", "S", "T", "Z"
  func (k PieceKind) BoxSize() int            // I:4, O:2, rest:3

  type Piece struct {
      Kind     PieceKind
      Rotation int   // 0..3
      X, Y     int   // board coords of the piece box's top-left corner
  }
  func Offsets(k PieceKind, rotation int) [4][2]int  // {dx,dy} within the box
  func (p Piece) Cells() [4][2]int                   // absolute {x,y} board cells
  func Spawn(k PieceKind) Piece                      // rotation 0, Y=0, X=(10-BoxSize())/2
  ```

- [ ] **Step 1: Create `go.mod`**

```
module cosmic-tetris

go 1.26
```

- [ ] **Step 2: Write the failing tests in `internal/game/piece_test.go`**

Rotation-0 offsets are the pinned data (y grows down):

```go
func TestOffsetsRotationZero(t *testing.T) {
    want := map[PieceKind][4][2]int{
        KindI: {{0, 1}, {1, 1}, {2, 1}, {3, 1}},
        KindJ: {{0, 0}, {0, 1}, {1, 1}, {2, 1}},
        KindL: {{2, 0}, {0, 1}, {1, 1}, {2, 1}},
        KindO: {{0, 0}, {1, 0}, {0, 1}, {1, 1}},
        KindS: {{1, 0}, {2, 0}, {0, 1}, {1, 1}},
        KindT: {{1, 0}, {0, 1}, {1, 1}, {2, 1}},
        KindZ: {{0, 0}, {1, 0}, {1, 1}, {2, 1}},
    }
    // assert Offsets(k, 0) equals want[k] as a set (order-insensitive compare helper)
}
```

Plus these cases:

```go
func TestOffsetsAllRotationsHaveFourDistinctCellsInBox(t *testing.T)
// for every kind, every rotation 0..3: exactly 4 cells, no duplicates,
// each 0 <= dx,dy < k.BoxSize()

func TestIPieceRotationOneIsVertical(t *testing.T)
// Offsets(KindI,1) == {{2,0},{2,1},{2,2},{2,3}} as a set

func TestOPieceIdenticalThroughRotation(t *testing.T)
// Offsets(KindO,r) equal for r = 0,1,2,3   (§6)

func TestRotationFourIsIdentity(t *testing.T)
// for every kind: Offsets(k, 0) == Offsets(k, 4 % 4) and Offsets(k, r)
// is defined for r outside 0..3 by wrapping (Offsets(k,-1) == Offsets(k,3))

func TestSpawnPositions(t *testing.T)
// Spawn(KindI)  -> Piece{KindI, 0, 3, 0}
// Spawn(KindT)  -> Piece{KindT, 0, 3, 0}
// Spawn(KindO)  -> Piece{KindO, 0, 4, 0}

func TestCellsAreOffsetsPlusPosition(t *testing.T)
// Piece{KindT, 0, 4, 5}.Cells() == {{5,5},{4,6},{5,6},{6,6}} as a set
// every spawned piece's cells lie in rows 0..1 (the hidden rows, §5)
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Offsets|Piece|Spawn|Cells' -v`
Expected: build failure — `undefined: PieceKind`, `undefined: Offsets`.

- [ ] **Step 4: Implement `internal/game/piece.go`**

Store only the rotation-0 offsets as literal data. Derive rotations 1–3 in an
`init()` by repeatedly applying a clockwise box rotation and caching all
`7 × 4` results in a package-level table, so `Offsets` is a lookup:

```go
// rotate one offset clockwise inside an n×n box
func rotateCW(dx, dy, n int) (int, int) { return n - 1 - dy, dx }
```

`Offsets` normalizes its rotation argument with a floor-mod so negatives wrap.
`KindO` returns its rotation-0 offsets for every rotation.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add go.mod internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): piece kinds, rotation tables, and spawn positions"
```
