### Task 7: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: the spawn and lock paths (Tasks 5–6).
- Produces:
  ```go
  func (g *Game) UseHold() []Event   // HoldUsed, or GameOver if the incoming
                                     // piece cannot spawn; no events when !CanHold
  ```
  Rules (§9): one held piece; empty hold stores the active piece and spawns the
  next from the queue; hold may be used once per active piece; a piece returning
  from hold spawns at rotation 0 in the spawn position.

  `HoldUsed`'s `Event.Piece` is the **outgoing** piece — the one that went into
  storage, in the position it held when stored. Plan 3 reads it for the §45
  "CUBE ADJACENT OBJECT SECURED" case and for the quantum-storage animation; the
  incoming piece is simply the new `g.Active`.

- [ ] **Step 1: Write the failing tests in `internal/game/hold_test.go`**

```go
func TestFirstHoldStoresActiveAndSpawnsFromQueue(t *testing.T)
// g := New(7); active, upcoming := g.Active.Kind, g.Next[0]
// UseHold() -> one HoldUsed event, *g.Hold == active, g.Active.Kind == upcoming,
// g.Active == Spawn(upcoming), len(g.Next) == NextQueueLen, !g.CanHold

func TestSecondHoldBeforeLockIsBlocked(t *testing.T)
// UseHold() twice: the second returns no events and changes nothing

func TestHoldSwapsWithStoredPiece(t *testing.T)
// UseHold(); HardDrop() (locks, restoring CanHold); then UseHold() again
// -> the previously held kind becomes Active, the just-active kind becomes Hold

func TestHoldRestoredAfterLock(t *testing.T)
// UseHold(); !CanHold; HardDrop(); CanHold is true again

func TestHeldPieceReturnsAtSpawnRotation(t *testing.T)
// rotate the active piece twice, UseHold(), lock, UseHold()
// -> the returning piece has Rotation == 0 and the spawn X/Y

func TestHoldDoesNotConsumeNextQueueOnSwap(t *testing.T)
// on a swap (hold already occupied), g.Next is unchanged

func TestHoldResetsLockStateForTheNewPiece(t *testing.T)
// grounded active piece with LockAccumulator > 0: UseHold() leaves
// LockAccumulator == 0, LockResets == 0, Grounded == false

func TestHoldWhoseIncomingPieceCannotSpawnEndsTheGame(t *testing.T)
// fill the hidden spawn rows so the incoming kind does not Fit at spawn:
// UseHold() -> events end with GameOver, g.Over is true, and the board still
// has exactly the cells it had before (nothing committed on top)

func TestHoldAfterGameOverIsIgnored(t *testing.T)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Hold -v`
Expected: FAIL — `g.UseHold undefined`.

- [ ] **Step 3: Implement `UseHold` in `internal/game/game.go`**

Reuse the Task 8 spawn helper so the blocked-spawn path produces the same
`GameOver` behavior as a blocked spawn after a lock. Order: decide the incoming
kind, place the outgoing kind into `Hold`, then spawn.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with once-per-piece rule and blocked-spawn handling"
```
