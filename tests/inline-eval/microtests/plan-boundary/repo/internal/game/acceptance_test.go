package game

import (
	"math/rand"
	"testing"
	"time"
)

func TestLongRandomSessionStaysConsistent(t *testing.T) {
	for seed := int64(1); seed <= 20; seed++ {
		g := New(seed)
		localRng := rand.New(rand.NewSource(seed + 1_000_000))
		everOver := false

		for i := 0; i < 5000; i++ {
			wasOver := g.Over
			if wasOver {
				everOver = true
			}

			var evs []Event
			switch localRng.Intn(7) {
			case 0:
				evs = g.MoveLeft()
			case 1:
				evs = g.MoveRight()
			case 2:
				evs = g.RotateCW()
			case 3:
				evs = g.RotateCCW()
			case 4:
				evs = g.SoftDrop()
			case 5:
				evs = g.HardDrop()
			case 6:
				evs = g.HoldPiece()
			}
			if wasOver && evs != nil {
				t.Fatalf("seed %d step %d: action produced events after game over: %v", seed, i, evs)
			}

			advEvs := g.Advance(16 * time.Millisecond)
			if wasOver && advEvs != nil {
				t.Fatalf("seed %d step %d: Advance produced events after game over: %v", seed, i, advEvs)
			}

			for _, c := range g.Active.Cells() {
				if !g.Board.InBounds(c.X, c.Y) {
					t.Fatalf("seed %d step %d: active cell %v out of bounds", seed, i, c)
				}
			}
			if rows := g.Board.CompleteRows(); len(rows) != 0 {
				t.Fatalf("seed %d step %d: board has uncleared complete rows %v", seed, i, rows)
			}
			if len(g.Next) != NextCount {
				t.Fatalf("seed %d step %d: len(Next) = %d, want %d", seed, i, len(g.Next), NextCount)
			}
			if g.Score < 0 || g.Lines < 0 || g.Level < 0 || g.Combo < 0 {
				t.Fatalf("seed %d step %d: negative stat Score=%d Lines=%d Level=%d Combo=%d",
					seed, i, g.Score, g.Lines, g.Level, g.Combo)
			}
			if g.Level != LevelFor(g.Lines) {
				t.Fatalf("seed %d step %d: Level=%d, want LevelFor(Lines)=%d", seed, i, g.Level, LevelFor(g.Lines))
			}

		}

		if !everOver {
			t.Fatalf("seed %d: game did not end within 5000 steps", seed)
		}
	}
}
