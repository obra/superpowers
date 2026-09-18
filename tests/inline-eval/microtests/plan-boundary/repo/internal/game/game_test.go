package game

import "testing"

func TestNewGameInitialState(t *testing.T) {
	seed := int64(42)
	g := New(seed)
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("initial Score/Lines/Combo = %d/%d/%d, want 0/0/0", g.Score, g.Lines, g.Combo)
	}
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if len(g.Next) != NextCount {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
	if g.Hold != nil {
		t.Errorf("Hold = %v, want nil", g.Hold)
	}
	if !g.CanHold {
		t.Errorf("CanHold = false, want true")
	}
	if g.Over {
		t.Errorf("Over = true, want false")
	}
	if g.Seed != seed {
		t.Errorf("Seed = %d, want %d", g.Seed, seed)
	}
	if g.Active.Rotation != 0 || g.Active.Y != 0 {
		t.Errorf("Active = %+v, want Rotation 0, Y 0", g.Active)
	}
}

func TestMoveLeftAndRight(t *testing.T) {
	g := New(1)
	x := g.Active.X
	evs := g.MoveLeft()
	if len(evs) != 1 || evs[0].Kind != PieceMoved {
		t.Fatalf("MoveLeft() = %v, want one PieceMoved event", evs)
	}
	if g.Active.X != x-1 {
		t.Errorf("Active.X = %d, want %d", g.Active.X, x-1)
	}
	g.MoveRight()
	g.MoveRight()
	if g.Active.X != x+1 {
		t.Errorf("Active.X = %d, want %d", g.Active.X, x+1)
	}
}

func TestBlockedMoveEmitsNothing(t *testing.T) {
	g := New(1)
	for i := 0; i < 20; i++ {
		before := g.Active
		evs := g.MoveLeft()
		if evs == nil {
			if g.Active != before {
				t.Errorf("Active changed to %+v despite blocked move, want unchanged %+v", g.Active, before)
			}
			return
		}
	}
	t.Fatalf("MoveLeft never blocked after 20 attempts")
}

func TestRotationEmitsPieceRotated(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	evs := g.RotateCW()
	if len(evs) != 1 || evs[0].Kind != PieceRotated {
		t.Fatalf("RotateCW() = %v, want one PieceRotated event", evs)
	}
	if g.Active.Rotation != 1 {
		t.Errorf("Active.Rotation = %d, want 1", g.Active.Rotation)
	}

	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	g.RotateCCW()
	if g.Active.Rotation != 3 {
		t.Errorf("RotateCCW from rotation 0: Rotation = %d, want 3", g.Active.Rotation)
	}
}

func TestRotationWallKicks(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -1, Y: 5}
	evs := g.RotateCW()
	if evs == nil {
		t.Fatalf("RotateCW() = nil, want a successful kicked rotation")
	}
	for _, c := range g.Active.Cells() {
		if !g.Board.InBounds(c.X, c.Y) {
			t.Errorf("cell %v out of bounds after rotation", c)
		}
	}
}

func TestRotationFailsInTightPocket(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if x == 5 {
				continue
			}
			g.Board.Set(x, y, CellFor(KindT))
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 3, Y: 8}
	before := g.Active
	evs := g.RotateCW()
	if evs != nil {
		t.Fatalf("RotateCW() = %v, want nil in tight pocket", evs)
	}
	if g.Active != before {
		t.Errorf("Active = %+v, want unchanged %+v", g.Active, before)
	}
}

func TestRotationNeverEscapesTheCeiling(t *testing.T) {
	g := New(1)
	// Block every column but 5 for every row below the piece so every kick offset,
	// including the (0,-1)/(-1,-1)/(1,-1) trio, is actually tried and rejected right
	// at the ceiling, instead of succeeding trivially on the first (0,0) offset.
	for y := 1; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if x == 5 {
				continue
			}
			g.Board.Set(x, y, CellFor(KindT))
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 3, Y: 0}
	boardBefore := g.Board
	activeBefore := g.Active

	evs := g.RotateCW()

	if evs != nil {
		for _, c := range g.Active.Cells() {
			if c.Y < 0 {
				t.Errorf("cell %v has Y < 0 after rotation", c)
			}
		}
		if g.Board.Collides(g.Active) {
			t.Errorf("RotateCW() accepted a colliding position: %+v", g.Active)
		}
		return
	}
	if g.Active != activeBefore {
		t.Errorf("Active changed to %+v despite a rejected rotation, want unchanged %+v", g.Active, activeBefore)
	}
	if g.Board != boardBefore {
		t.Errorf("Board mutated by RotateCW")
	}
}
