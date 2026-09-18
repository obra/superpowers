### Task 9: Determinism replay test and engine clock audit

**Files:**
- Test: `internal/game/replay_test.go`
- Test: `internal/game/clock_test.go`

**Interfaces:**
- Consumes: the whole engine API.
- Produces: nothing new. This task proves §35 and §49.2 hold.

- [ ] **Step 1: Write the failing replay test in `internal/game/replay_test.go`**

A canned `(input, dt)` stream, replayed twice:

```go
type step struct {
    input string        // "", "L", "R", "CW", "CCW", "SOFT", "HARD", "HOLD"
    dt    time.Duration // applied via Advance after the input
}

func script() []step   // ~400 deterministic steps, generated from a fixed
                       // pattern (not a clock, not an unseeded rand):
                       // rand.New(rand.NewSource(31337)) choosing among the
                       // inputs and among dts of 16ms/33ms/250ms

func run(seed int64, steps []step) *Game   // applies each step in order

func TestReplayIsReproducible(t *testing.T)
// a := run(8675309, script()); b := run(8675309, script())
// assert deep equality of Board, Active, Hold, CanHold, Next, Score, Lines,
// Level, Combo, both accumulators, LockResets, Over

func TestReplayDiffersAcrossSeeds(t *testing.T)
// run(1, script()) and run(2, script()) differ in Board or Score
// (guards against a replay test that would pass on a frozen engine)

func TestReplayFinalStateIsPinned(t *testing.T)
// record the final Score, Lines, Level, Over and the count of filled cells
// from the first green run as literals in the test, so a future change to
// piece order or scoring fails loudly

func TestEventsAreReproducible(t *testing.T)
// collect every event from both runs; assert identical Kind/Count/Rows sequences
```

- [ ] **Step 2: Write the clock audit test in `internal/game/clock_test.go`**

```go
func TestEngineNeverReadsTheClock(t *testing.T)
// walk the .go files in this package (excluding _test.go) and assert none
// contains "time.Now" or "time.Since" — §49.2
```

- [ ] **Step 3: Run both tests**

Run: `go test ./internal/game/ -run 'Replay|Events|Clock' -v`
Expected: the replay tests fail first on the unpinned literals in
`TestReplayFinalStateIsPinned` (placeholder values); fill in the observed values
once the other three replay tests and the clock audit pass.

- [ ] **Step 4: Run the whole engine suite with the race detector and vet**

Run: `go vet ./... && go test ./internal/game/ -race -count=2 -v`
Expected: PASS. `-count=2` catches state leaking through package-level
variables (the rotation table must stay read-only).

- [ ] **Step 5: Commit**

```bash
git add internal/game/replay_test.go internal/game/clock_test.go
git commit -m "test(game): deterministic replay and clock-free engine audit"
```

- [ ] **Step 6: Confirm the Phase 1 gate (§42)**

Run: `go test ./... -cover`
Expected: all `internal/game` tests pass. Note the coverage number in the commit
message of the next plan's first task; the engine should be comfortably above
90% since it has no I/O. Do not start plan 2 until this is green.
