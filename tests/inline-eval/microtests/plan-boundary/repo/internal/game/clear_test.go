package game

import "testing"

func eventWithKind(evs []Event, kind EventKind) *Event {
	for i := range evs {
		if evs[i].Kind == kind {
			return &evs[i]
		}
	}
	return nil
}

func TestHardDropScoresTwoPerCell(t *testing.T) {
	g := New(1)
	startY := g.Active.Y
	evs := g.HardDrop()
	if len(evs) == 0 || evs[0].Kind != PieceHardDropped {
		t.Fatalf("HardDrop() = %v, want first event PieceHardDropped", evs)
	}
	wantDistance := evs[0].Piece.Y - startY
	if evs[0].Distance != wantDistance {
		t.Errorf("Distance = %d, want %d", evs[0].Distance, wantDistance)
	}
	if evs[0].ScoreDelta != 2*evs[0].Distance {
		t.Errorf("ScoreDelta = %d, want %d", evs[0].ScoreDelta, 2*evs[0].Distance)
	}
	if eventWithKind(evs, PieceLocked) == nil {
		t.Errorf("no PieceLocked event in %v", evs)
	}
}

func TestHardDropOfAGroundedPieceStillLocks(t *testing.T) {
	g := New(1)
	for g.SoftDrop() != nil {
	}
	evs := g.HardDrop()
	if len(evs) == 0 || evs[0].Kind != PieceHardDropped || evs[0].Distance != 0 {
		t.Fatalf("HardDrop() = %v, want first event PieceHardDropped{Distance:0}", evs)
	}
	if eventWithKind(evs, PieceLocked) == nil {
		t.Errorf("no PieceLocked event in %v", evs)
	}
}

func TestSingleLineClearScoresAndCollapses(t *testing.T) {
	g := New(1)
	for x := 0; x < 8; x++ {
		g.Board.Set(x, 21, CellFor(KindT))
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 8, Y: 0}
	evs := g.HardDrop()
	lc := eventWithKind(evs, LinesCleared)
	if lc == nil {
		t.Fatalf("no LinesCleared event in %v", evs)
	}
	if lc.Count != 1 {
		t.Errorf("Count = %d, want 1", lc.Count)
	}
	if len(lc.Rows) != 1 || lc.Rows[0] != 21 {
		t.Errorf("Rows = %v, want [21]", lc.Rows)
	}
	if len(lc.Cells) != 1 {
		t.Fatalf("len(Cells) = %d, want 1", len(lc.Cells))
	}
	for x := 0; x < 8; x++ {
		if lc.Cells[0][x].Empty() {
			t.Errorf("pre-clear Cells[0][%d] empty, want filled", x)
		}
	}
	if want := 100 * g.Level; lc.ScoreDelta != want {
		t.Errorf("ScoreDelta = %d, want %d", lc.ScoreDelta, want)
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if !g.Board.At(0, 21).Empty() {
		t.Errorf("row 21 not empty after clear")
	}
}

func TestFourLineClearScores800TimesLevel(t *testing.T) {
	g := New(1)
	for y := 18; y <= 21; y++ {
		for x := 0; x < 9; x++ {
			g.Board.Set(x, y, CellFor(KindT))
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 7, Y: 0}
	evs := g.HardDrop()
	lc := eventWithKind(evs, LinesCleared)
	if lc == nil {
		t.Fatalf("no LinesCleared event in %v", evs)
	}
	if lc.Count != 4 {
		t.Errorf("Count = %d, want 4", lc.Count)
	}
	if want := 800 * g.Level; lc.ScoreDelta != want {
		t.Errorf("ScoreDelta = %d, want %d (800*level, no combo bonus at combo 1)", lc.ScoreDelta, want)
	}
}

func TestComboAccumulatesAndResets(t *testing.T) {
	g := New(1)
	level := g.Level

	clearOneRow := func() []Event {
		g.Board = Board{}
		for x := 0; x < 8; x++ {
			g.Board.Set(x, 21, CellFor(KindT))
		}
		g.Active = Piece{Kind: KindO, Rotation: 0, X: 8, Y: 0}
		return g.HardDrop()
	}
	dropWithoutClearing := func() []Event {
		g.Board = Board{}
		g.Active = Piece{Kind: KindO, Rotation: 0, X: 0, Y: 0}
		return g.HardDrop()
	}

	evs := clearOneRow()
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1 after first clear", g.Combo)
	}
	if cc := eventWithKind(evs, ComboChanged); cc == nil || cc.Count != 1 {
		t.Errorf("ComboChanged = %v, want Count 1", cc)
	}
	lc := eventWithKind(evs, LinesCleared)
	if lc == nil || lc.ScoreDelta != LineScore(1, level) {
		t.Errorf("first clear ScoreDelta = %v, want %d (no combo bonus)", lc, LineScore(1, level))
	}

	evs = clearOneRow()
	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2 after second consecutive clear", g.Combo)
	}
	lc = eventWithKind(evs, LinesCleared)
	want := LineScore(1, level) + ComboBonus(2, level)
	if lc == nil || lc.ScoreDelta != want {
		t.Errorf("second clear ScoreDelta = %v, want %d", lc, want)
	}
	if got, want := ComboBonus(2, level), 50*1*level; got != want {
		t.Errorf("ComboBonus(2,level) = %d, want %d", got, want)
	}

	evs = dropWithoutClearing()
	if g.Combo != 0 {
		t.Errorf("Combo = %d, want 0 after non-clearing placement", g.Combo)
	}
	if cc := eventWithKind(evs, ComboChanged); cc == nil || cc.Count != 0 {
		t.Errorf("ComboChanged = %v, want Count 0", cc)
	}

	evs = dropWithoutClearing()
	if cc := eventWithKind(evs, ComboChanged); cc != nil {
		t.Errorf("unexpected ComboChanged event: %v", evs)
	}
}

func TestLevelIncreasesEveryTenLines(t *testing.T) {
	g := New(1)
	var last []Event
	for i := 0; i < 10; i++ {
		g.Board = Board{}
		for x := 0; x < 8; x++ {
			g.Board.Set(x, 21, CellFor(KindT))
		}
		g.Active = Piece{Kind: KindO, Rotation: 0, X: 8, Y: 0}
		last = g.HardDrop()
	}
	if g.Lines != 10 {
		t.Fatalf("Lines = %d, want 10", g.Lines)
	}
	if g.Level != 2 {
		t.Fatalf("Level = %d, want 2", g.Level)
	}
	count := 0
	for _, e := range last {
		if e.Kind == LevelChanged {
			count++
			if e.Count != 2 {
				t.Errorf("LevelChanged.Count = %d, want 2", e.Count)
			}
		}
	}
	if count != 1 {
		t.Errorf("LevelChanged emitted %d times on final placement, want 1", count)
	}
	if g.Interval() != DropInterval(2) {
		t.Errorf("Interval() = %v, want %v", g.Interval(), DropInterval(2))
	}
}

func TestClearIncludingHiddenRowKeepsBoardIntact(t *testing.T) {
	g := New(1)
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 1, CellFor(KindT))
		g.Board.Set(x, 21, CellFor(KindT))
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 0, Y: 5}
	evs := g.HardDrop()
	lc := eventWithKind(evs, LinesCleared)
	if lc == nil {
		t.Fatalf("no LinesCleared event in %v", evs)
	}
	if lc.Count != 2 {
		t.Errorf("Count = %d, want 2", lc.Count)
	}
	if len(g.Board.Cells) != Height {
		t.Errorf("board has %d rows, want %d", len(g.Board.Cells), Height)
	}
	if rows := g.Board.CompleteRows(); len(rows) != 0 {
		t.Errorf("CompleteRows() after clear = %v, want none", rows)
	}
}
