package game

import (
	"os"
	"strings"
	"testing"
	"time"
)

type replayStep struct {
	key string
	dt  time.Duration
}

// setupReplayBoard pre-fills all but the last column of the bottom row, so the
// first vertical I piece the script encounters (rotated and pushed against the
// right wall, which lands it in exactly that last column) completes the row.
// Applying this identically before both replay runs keeps the setup itself
// deterministic; it just guarantees the script's key presses land somewhere that
// exercises LinesCleared/ComboChanged/LevelChanged/ClearRows instead of leaving
// that to chance.
func setupReplayBoard(g *Game) {
	for x := 0; x < Width-1; x++ {
		g.Board.Set(x, Height-1, CellFor(KindO))
	}
}

// buildReplayScript records a fixed key sequence by planning against a throwaway
// Game on the same seed (with the same setupReplayBoard applied). The first I
// piece encountered is rotated vertical and driven into the one open column,
// clearing the bottom row early; every other piece is simply moved out of the
// way on the left so the game keeps running. Rotation, hold and soft drop are
// mixed in periodically for input coverage. The resulting key list is fixed
// once built: both replay runs execute the same recorded steps.
func buildReplayScript() []replayStep {
	dts := []time.Duration{7 * time.Millisecond, 16 * time.Millisecond, 250 * time.Millisecond, 900 * time.Millisecond}
	plan := New(8675309)
	setupReplayBoard(plan)
	var keys []string
	clearedYet := false
	for step := 0; len(keys) < 200 && !plan.Over; step++ {
		if !clearedYet && plan.Active.Kind == KindI {
			keys = append(keys, "rotateCW")
			plan.RotateCW()
			for i := 0; i < Width; i++ {
				keys = append(keys, "right")
				plan.MoveRight()
			}
			keys = append(keys, "hard")
			plan.HardDrop()
			clearedYet = true
			continue
		}
		for i := 0; i < Width; i++ {
			keys = append(keys, "left")
			plan.MoveLeft()
		}
		if step%5 == 2 {
			keys = append(keys, "rotateCW")
			plan.RotateCW()
		}
		if step%7 == 3 {
			keys = append(keys, "hold")
			plan.HoldPiece()
		}
		if step%4 == 1 {
			keys = append(keys, "soft", "soft")
			plan.SoftDrop()
			plan.SoftDrop()
		}
		keys = append(keys, "hard")
		plan.HardDrop()
	}
	if len(keys) > 200 {
		keys = keys[:200]
	}
	script := make([]replayStep, len(keys))
	for i, k := range keys {
		script[i] = replayStep{key: k, dt: dts[i%len(dts)]}
	}
	return script
}

func runReplayScript(g *Game, script []replayStep) {
	for _, s := range script {
		switch s.key {
		case "left":
			g.MoveLeft()
		case "right":
			g.MoveRight()
		case "rotateCW":
			g.RotateCW()
		case "rotateCCW":
			g.RotateCCW()
		case "soft":
			g.SoftDrop()
		case "hold":
			g.HoldPiece()
		case "hard":
			g.HardDrop()
		}
		g.Advance(s.dt)
	}
}

func TestReplayIsReproducible(t *testing.T) {
	script := buildReplayScript()
	a := New(8675309)
	setupReplayBoard(a)
	runReplayScript(a, script)
	b := New(8675309)
	setupReplayBoard(b)
	runReplayScript(b, script)

	if a.Score != b.Score || a.Lines != b.Lines || a.Level != b.Level || a.Combo != b.Combo || a.Over != b.Over {
		t.Fatalf("state diverged: a={Score:%d Lines:%d Level:%d Combo:%d Over:%v} b={Score:%d Lines:%d Level:%d Combo:%d Over:%v}",
			a.Score, a.Lines, a.Level, a.Combo, a.Over, b.Score, b.Lines, b.Level, b.Combo, b.Over)
	}
	if len(a.Next) != len(b.Next) {
		t.Fatalf("Next length diverged: %d vs %d", len(a.Next), len(b.Next))
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("Next diverged at %d: %v vs %v", i, a.Next[i], b.Next[i])
		}
	}
	if (a.Hold == nil) != (b.Hold == nil) {
		t.Fatalf("Hold nilness diverged: %v vs %v", a.Hold, b.Hold)
	}
	if a.Hold != nil && *a.Hold != *b.Hold {
		t.Fatalf("Hold diverged: %v vs %v", *a.Hold, *b.Hold)
	}
	if a.Board.String() != b.Board.String() {
		t.Fatalf("Board diverged:\n%s\nvs\n%s", a.Board.String(), b.Board.String())
	}
	if a.Lines == 0 {
		t.Fatalf("script cleared 0 lines before topping out; it never exercises LinesCleared/ComboChanged/LevelChanged/ClearRows")
	}
}

func TestDifferentSeedsDiverge(t *testing.T) {
	script := buildReplayScript()
	a := New(1)
	setupReplayBoard(a)
	runReplayScript(a, script)
	b := New(2)
	setupReplayBoard(b)
	runReplayScript(b, script)
	if a.Board.String() == b.Board.String() {
		t.Fatalf("boards from different seeds matched")
	}
}

func TestEngineNeverReadsTheClock(t *testing.T) {
	entries, err := os.ReadDir(".")
	if err != nil {
		t.Fatalf("ReadDir(.): %v", err)
	}
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
			continue
		}
		data, err := os.ReadFile(name)
		if err != nil {
			t.Fatalf("ReadFile(%s): %v", name, err)
		}
		if strings.Contains(string(data), "time.Now(") {
			t.Errorf("%s calls time.Now(), the engine must never read the clock", name)
		}
	}
}
