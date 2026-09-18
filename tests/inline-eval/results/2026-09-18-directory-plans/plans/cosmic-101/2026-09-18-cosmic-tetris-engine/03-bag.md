### Task 3: Seven-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds()` (Task 1).
- Produces:
```go
type Bag struct {
    rng   *rand.Rand
    queue []PieceKind   // remaining pieces of the current bag
}
func NewBag(rng *rand.Rand) *Bag   // starts empty; refills on first Next
func (b *Bag) Next() PieceKind     // refills with a shuffled copy of AllKinds() when empty
```

The `*rand.Rand` is supplied by the caller — `Bag` never creates one. Task 6 passes `Game.rng` in, which is how §49.6's "game RNG drives the 7-bag, nothing else" holds.

- [ ] **Step 1: Write the failing test**

`internal/game/bag_test.go`:

```go
func TestEachBagHoldsAllSevenOnce(t *testing.T)
// b := NewBag(rand.New(rand.NewSource(1)))
// draw 21 pieces; each consecutive group of 7 contains every kind exactly once

func TestSeededBagIsReproducible(t *testing.T)
// two bags from rand.NewSource(8675309) produce identical first 50 draws

func TestDifferentSeedsDiffer(t *testing.T)
// bags from seeds 1 and 2 differ somewhere in their first 14 draws
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestEachBag -v`
Expected: FAIL — `undefined: NewBag`.

- [ ] **Step 3: Implement `internal/game/bag.go`**

Refill by copying `AllKinds()` into the queue and shuffling with `b.rng.Shuffle`. Draw from the front.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```
