package game

import (
	"testing"
	"time"
)

func TestNewPieceStartsWithFreshFallState(t *testing.T) {
	g := New(1)
	for g.SoftDrop() != nil {
	}
	// Bank most of the lock delay and several lock resets on the piece about to lock.
	g.Advance(400 * time.Millisecond)
	g.MoveLeft()
	g.Advance(400 * time.Millisecond)
	g.MoveRight()
	if evs := g.Advance(500 * time.Millisecond); eventWithKind(evs, PieceLocked) == nil {
		t.Fatalf("expected the grounded piece to lock, got %v", evs)
	}

	if g.GravityAccumulator != 0 {
		t.Errorf("GravityAccumulator = %v after spawning a new piece, want 0", g.GravityAccumulator)
	}
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v after spawning a new piece, want 0", g.LockAccumulator)
	}
	if g.LockResets != 0 {
		t.Errorf("LockResets = %d after spawning a new piece, want 0", g.LockResets)
	}

	// The new piece must fall its first row after a full interval, not almost immediately
	// because of gravity time banked by the piece that just locked.
	y := g.Active.Y
	g.Advance(100 * time.Millisecond)
	if g.Active.Y != y {
		t.Fatalf("Active.Y = %d after 100ms on a fresh piece, want unchanged %d (interval is %v)", g.Active.Y, y, g.Interval())
	}
}

func TestAdvanceBelowIntervalDoesNothing(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	evs := g.Advance(100 * time.Millisecond)
	if evs != nil {
		t.Fatalf("Advance(100ms) = %v, want no events", evs)
	}
	if g.Active.Y != y {
		t.Errorf("Active.Y = %d, want %d", g.Active.Y, y)
	}
}

func TestAdvanceAtIntervalDropsOneRow(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	evs := g.Advance(800 * time.Millisecond)
	if len(evs) != 1 || evs[0].Kind != PieceMoved {
		t.Fatalf("Advance(800ms) = %v, want one PieceMoved event", evs)
	}
	if g.Active.Y != y+1 {
		t.Errorf("Active.Y = %d, want %d", g.Active.Y, y+1)
	}
}

func TestAdvanceHugeDtIsBoundedAndLeavesPieceGrounded(t *testing.T) {
	g := New(1)
	start := time.Now()
	evs := g.Advance(20 * time.Second)
	elapsed := time.Since(start)
	if elapsed > 500*time.Millisecond {
		t.Fatalf("Advance(20s) took %v, want well under a second", elapsed)
	}
	if len(evs) > maxCatchUpSteps+3 {
		t.Fatalf("Advance(20s) emitted %d events, want at most %d", len(evs), maxCatchUpSteps+3)
	}
	if g.GravityAccumulator >= g.Interval() {
		t.Errorf("GravityAccumulator = %v, want < Interval() %v", g.GravityAccumulator, g.Interval())
	}
	locked := false
	for _, e := range evs {
		if e.Kind == PieceLocked {
			locked = true
		}
	}
	if !locked && !g.grounded() {
		t.Errorf("piece is neither locked nor resting on the floor after a huge dt")
	}
}

func TestGhostY(t *testing.T) {
	g := New(1)
	ghostY := g.GhostY()
	resting := g.Active
	resting.Y = ghostY
	if g.Board.Collides(resting) {
		t.Fatalf("GhostY() = %d collides with the board", ghostY)
	}
	below := resting
	below.Y++
	if !g.Board.Collides(below) {
		t.Fatalf("GhostY() = %d does not actually rest (one row further still fits)", ghostY)
	}

	g2 := New(1)
	g2.Active = SpawnPiece(KindT)
	g2.Board.Set(g2.Active.X, 15, CellFor(KindS))
	obstructed := g2.GhostY()
	if obstructed >= ghostY {
		t.Errorf("GhostY() with an obstruction = %d, want less than the unobstructed %d", obstructed, ghostY)
	}
	restingObstructed := g2.Active
	restingObstructed.Y = obstructed
	if g2.Board.Collides(restingObstructed) {
		t.Fatalf("obstructed GhostY() = %d collides with the board", obstructed)
	}
}

func TestSoftDropScoresOnePoint(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	evs := g.SoftDrop()
	if len(evs) != 1 || evs[0].Kind != PieceSoftDropped || evs[0].ScoreDelta != SoftDropPoints {
		t.Fatalf("SoftDrop() = %v", evs)
	}
	if g.Score != SoftDropPoints {
		t.Errorf("Score = %d, want %d", g.Score, SoftDropPoints)
	}
	if g.Active.Y != y+1 {
		t.Errorf("Active.Y = %d, want %d", g.Active.Y, y+1)
	}

	for g.SoftDrop() != nil {
	}
	scoreAtFloor := g.Score
	if evs := g.SoftDrop(); evs != nil {
		t.Fatalf("SoftDrop() at the floor = %v, want nil", evs)
	}
	if g.Score != scoreAtFloor {
		t.Errorf("Score changed on a blocked soft drop")
	}
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := New(1)
	for g.SoftDrop() != nil {
	}
	evs := g.Advance(499 * time.Millisecond)
	for _, e := range evs {
		if e.Kind == PieceLocked {
			t.Fatalf("PieceLocked emitted early: %v", evs)
		}
	}
	evs = g.Advance(1 * time.Millisecond)
	found := false
	for _, e := range evs {
		if e.Kind == PieceLocked {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected PieceLocked once the lock delay elapsed, got %v", evs)
	}
}

func TestMovementWhileGroundedResetsLockTimer(t *testing.T) {
	g := New(1)
	for g.SoftDrop() != nil {
	}
	g.Advance(400 * time.Millisecond)
	g.MoveLeft()
	evs := g.Advance(400 * time.Millisecond)
	for _, e := range evs {
		if e.Kind == PieceLocked {
			t.Fatalf("PieceLocked emitted despite lock timer reset: %v", evs)
		}
	}
}

func TestLockResetsAreCapped(t *testing.T) {
	g := New(1)
	for g.SoftDrop() != nil {
	}
	locked := false
	for i := 0; i < 20; i++ {
		evs := g.Advance(400 * time.Millisecond)
		for _, e := range evs {
			if e.Kind == PieceLocked {
				locked = true
			}
		}
		if locked {
			break
		}
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
	}
	if !locked {
		t.Fatalf("expected a PieceLocked event within 20 alternating reset attempts")
	}
	if g.LockResets > MaxLockResets {
		t.Errorf("LockResets = %d, want <= %d", g.LockResets, MaxLockResets)
	}
}
