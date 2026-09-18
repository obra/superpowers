### Task 7: Hold slot

**Files:**
- Modify: `internal/game/game.go` (the `InputHold` branch of `Apply`)
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Game`, `Apply`, `Input`, `Event` (Task 6); `Spawn` (Task 1).
- Produces: no new exported names. `Apply(InputHold)` now returns a `HoldUsed` event carrying the outgoing piece in `Event.Piece`.

Rules (§9): swap `Active` with `*Hold`; if `Hold` is empty, store `Active.Kind` and spawn from the `Next` queue; the incoming piece enters at `Spawn(kind)` — spawn rotation, spawn position. `CanHold` is false from the moment a hold happens until the next piece locks and spawns. A hold attempt with `CanHold == false` returns no events and changes nothing.

- [ ] **Step 1: Write the failing test**

`internal/game/hold_test.go`:

```go
func TestFirstHoldStoresAndSpawnsNext(t *testing.T)
// fresh game; first := g.Active.Kind; upcoming := g.Next[0]
// evs := g.Apply(InputHold)
// one HoldUsed event with Piece.Kind == first
// *g.Hold == first; g.Active == Spawn(upcoming); len(g.Next) == NextCount; CanHold == false

func TestSecondHoldBlockedBeforeLock(t *testing.T)
// after one hold, Apply(InputHold) returns no events; Hold and Active unchanged

func TestHoldAllowedAgainAfterLock(t *testing.T)
// hold, then Apply(InputHardDrop) to lock and spawn
// CanHold == true; Apply(InputHold) now swaps

func TestHoldSwapResetsRotationAndPosition(t *testing.T)
// hold a piece, move and rotate the new active piece, lock, then hold again
// the piece coming out of the hold slot equals Spawn(itsKind) exactly

func TestHoldDoesNotConsumeExtraBagPieces(t *testing.T)
// record g.Next; the swap case (hold already occupied) leaves g.Next byte-identical
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestFirstHold -v`
Expected: FAIL — no `HoldUsed` event returned.

- [ ] **Step 3: Implement the `InputHold` branch in `internal/game/game.go`**

Reuse the same queue-refill helper the lock pipeline uses, so the empty-hold case cannot drift from spawn behaviour.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold slot with once-per-piece rule"
```
