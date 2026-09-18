package game

import (
	"testing"
	"time"
)

func TestFirstHoldStoresAndSpawnsNext(t *testing.T) {
	g := New(1)
	kind := g.Active.Kind
	next := g.Next[0]
	evs := g.HoldPiece()
	if len(evs) == 0 || evs[0].Kind != HoldUsed {
		t.Fatalf("HoldPiece() = %v, want first event HoldUsed", evs)
	}
	if g.Hold == nil || *g.Hold != kind {
		t.Fatalf("Hold = %v, want %v", g.Hold, kind)
	}
	if g.Active.Kind != next {
		t.Errorf("Active.Kind = %v, want %v", g.Active.Kind, next)
	}
	if want := SpawnPiece(next); g.Active != want {
		t.Errorf("Active = %+v, want %+v", g.Active, want)
	}
	if g.CanHold {
		t.Errorf("CanHold = true, want false")
	}
}

func TestSecondHoldIsBlocked(t *testing.T) {
	g := New(1)
	g.HoldPiece()
	before := *g
	evs := g.HoldPiece()
	if evs != nil {
		t.Fatalf("second HoldPiece() = %v, want nil", evs)
	}
	if g.Active != before.Active || *g.Hold != *before.Hold || g.CanHold != before.CanHold {
		t.Errorf("state changed on blocked hold")
	}
}

func TestHoldSwapsAndKeepsSpawnRotation(t *testing.T) {
	g := New(1)
	firstKind := g.Active.Kind
	g.HoldPiece()
	g.HardDrop()
	g.RotateCW()
	g.RotateCW()
	evs := g.HoldPiece()
	if eventWithKind(evs, HoldUsed) == nil {
		t.Fatalf("no HoldUsed event in %v", evs)
	}
	want := SpawnPiece(firstKind)
	if g.Active != want {
		t.Errorf("Active = %+v, want %+v", g.Active, want)
	}
}

func TestHoldAvailableAgainAfterLock(t *testing.T) {
	g := New(1)
	g.HoldPiece()
	if g.CanHold {
		t.Fatalf("CanHold = true after HoldPiece, want false")
	}
	g.HardDrop()
	if !g.CanHold {
		t.Errorf("CanHold = false after lock, want true")
	}
}

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	g.Active.Y = 10 // keep the current piece clear of the rows about to be blocked
	// Every spawn geometry lies within columns 3-6; block that band in both hidden
	// rows without completing any full row (which would auto-clear before spawn).
	for _, y := range []int{0, 1} {
		for x := 3; x <= 6; x++ {
			g.Board.Set(x, y, CellFor(KindT))
		}
	}
	evs := g.HardDrop()
	if eventWithKind(evs, GameOver) == nil {
		t.Fatalf("no GameOver event in %v", evs)
	}
	if !g.Over {
		t.Fatalf("Over = false, want true")
	}
	if evs := g.Advance(1 * time.Second); evs != nil {
		t.Errorf("Advance() after game over = %v, want nil", evs)
	}
}

func TestHoldIntoBlockedSpawnEndsTheGameCleanly(t *testing.T) {
	g := New(1)
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 0, CellFor(KindT))
		g.Board.Set(x, 1, CellFor(KindT))
	}
	boardBefore := g.Board.String()
	evs := g.HoldPiece()
	if eventWithKind(evs, GameOver) == nil {
		t.Fatalf("no GameOver event in %v", evs)
	}
	if !g.Over {
		t.Errorf("Over = false, want true")
	}
	if g.Board.String() != boardBefore {
		t.Errorf("board changed after blocked hold-spawn")
	}
}

func TestHoldSwapIntoBlockedSpawnEndsTheGameCleanly(t *testing.T) {
	g := New(1)
	firstKind := g.Active.Kind
	g.HoldPiece() // Hold now holds firstKind; the empty-hold branch, not the swap branch.
	g.HardDrop()  // lock, restoring CanHold, so the next HoldPiece takes the swap branch.

	// Block every cell the incoming (held) piece's spawn would occupy, in both hidden rows.
	incoming := SpawnPiece(firstKind)
	size := incoming.BoxSize()
	for y := 0; y < HiddenRows; y++ {
		for x := incoming.X; x < incoming.X+size; x++ {
			g.Board.Set(x, y, CellFor(KindZ))
		}
	}

	boardBefore := g.Board.String()
	holdBefore := *g.Hold
	activeBefore := g.Active

	evs := g.HoldPiece()

	if eventWithKind(evs, GameOver) == nil {
		t.Fatalf("no GameOver event in %v", evs)
	}
	if !g.Over {
		t.Errorf("Over = false, want true")
	}
	if g.Board.String() != boardBefore {
		t.Errorf("board changed after a blocked hold swap")
	}
	if *g.Hold != holdBefore {
		t.Errorf("Hold changed after a blocked hold swap: %v, want unchanged %v", *g.Hold, holdBefore)
	}
	if g.Active != activeBefore {
		t.Errorf("Active changed after a blocked hold swap: %+v, want unchanged %+v", g.Active, activeBefore)
	}
}
