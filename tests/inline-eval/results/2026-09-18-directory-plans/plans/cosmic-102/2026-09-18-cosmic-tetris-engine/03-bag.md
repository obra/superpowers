### Task 3: 7-bag randomizer and the next queue

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` (Task 1).
- Produces:
  ```go
  type Bag struct {
      rng       *rand.Rand
      remaining []PieceKind
  }
  func NewBag(rng *rand.Rand) *Bag
  func (b *Bag) Next() PieceKind   // refills and shuffles when empty
  ```
  `NextQueueLen = 5` — the number of upcoming pieces the engine keeps (§6).

- [ ] **Step 1: Write the failing tests in `internal/game/bag_test.go`**

```go
func TestEachBagContainsAllSevenKindsExactlyOnce(t *testing.T) {
    b := NewBag(rand.New(rand.NewSource(1)))
    for bagIndex := 0; bagIndex < 20; bagIndex++ {
        counts := map[PieceKind]int{}
        for i := 0; i < 7; i++ { counts[b.Next()]++ }
        // assert len(counts) == 7 and every count == 1
    }
}

func TestSeededGenerationIsReproducible(t *testing.T)
// two bags from rand.NewSource(8675309) produce identical 70-kind sequences

func TestDifferentSeedsDiverge(t *testing.T)
// seeds 1 and 2 produce different 70-kind sequences (not a shuffle no-op)

func TestBagShufflesWithinSeed(t *testing.T)
// over the first 10 bags from seed 42, at least two bags differ in order
// (guards against "shuffle" that returns AllKinds unchanged)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Bag -v`
Expected: build failure — `undefined: NewBag`.

- [ ] **Step 3: Implement `internal/game/bag.go`**

Refill copies `AllKinds` into `remaining` and shuffles it with `b.rng.Shuffle`.
`Next` pops from the end of `remaining`, reusing the slice's capacity so play
does not allocate.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag randomizer"
```
