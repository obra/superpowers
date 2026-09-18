package game

import "testing"

func TestKindStrings(t *testing.T) {
	cases := []struct {
		k    PieceKind
		want string
	}{
		{KindI, "I"}, {KindJ, "J"}, {KindL, "L"}, {KindO, "O"},
		{KindS, "S"}, {KindT, "T"}, {KindZ, "Z"},
	}
	for _, c := range cases {
		if got := c.k.String(); got != c.want {
			t.Errorf("%v.String() = %q, want %q", c.k, got, c.want)
		}
		if got := c.k.Letter(); got != c.want[0] {
			t.Errorf("%v.Letter() = %q, want %q", c.k, got, c.want[0])
		}
	}
}

func uniquePoints(pts [4]Point) map[Point]bool {
	set := map[Point]bool{}
	for _, p := range pts {
		set[p] = true
	}
	return set
}

func TestEveryRotationHasFourCells(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		for r := 0; r < 4; r++ {
			cells := Piece{Kind: k, Rotation: r}.Cells()
			if got := len(uniquePoints(cells)); got != 4 {
				t.Errorf("kind %v rotation %d: %d unique cells, want 4", k, r, got)
			}
		}
	}
}

func sameCellSet(a, b [4]Point) bool {
	sa, sb := uniquePoints(a), uniquePoints(b)
	if len(sa) != len(sb) {
		return false
	}
	for p := range sa {
		if !sb[p] {
			return false
		}
	}
	return true
}

func TestFourRotationsReturnToStart(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		start := rotationCells(k, 0)
		grid := spawnGrids[k]
		for i := 0; i < 4; i++ {
			grid = rotateCW(grid)
		}
		got := extractCells(grid)
		if !sameCellSet(got, start) {
			t.Errorf("kind %v: cells after 4 rotations = %v, want %v", k, got, start)
		}
	}
}

func TestIPieceRotationZeroAndOne(t *testing.T) {
	want0 := [4]Point{{0, 1}, {1, 1}, {2, 1}, {3, 1}}
	if got := (Piece{Kind: KindI, Rotation: 0, X: 0, Y: 0}).Cells(); got != want0 {
		t.Errorf("I rotation 0 cells = %v, want %v", got, want0)
	}
	want1 := [4]Point{{2, 0}, {2, 1}, {2, 2}, {2, 3}}
	if got := (Piece{Kind: KindI, Rotation: 1, X: 0, Y: 0}).Cells(); got != want1 {
		t.Errorf("I rotation 1 cells = %v, want %v", got, want1)
	}
}

func TestOPieceIdenticalThroughRotation(t *testing.T) {
	want := [4]Point{{0, 0}, {1, 0}, {0, 1}, {1, 1}}
	for r := 0; r < 4; r++ {
		got := (Piece{Kind: KindO, Rotation: r, X: 0, Y: 0}).Cells()
		if !sameCellSet(got, want) {
			t.Errorf("O rotation %d cells = %v, want set %v", r, got, want)
		}
	}
}

func TestSpawnPositions(t *testing.T) {
	if got, want := SpawnPiece(KindI), (Piece{Kind: KindI, Rotation: 0, X: 3, Y: 0}); got != want {
		t.Errorf("SpawnPiece(KindI) = %+v, want %+v", got, want)
	}
	if got, want := SpawnPiece(KindO), (Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0}); got != want {
		t.Errorf("SpawnPiece(KindO) = %+v, want %+v", got, want)
	}
	if got, want := SpawnPiece(KindT), (Piece{Kind: KindT, Rotation: 0, X: 3, Y: 0}); got != want {
		t.Errorf("SpawnPiece(KindT) = %+v, want %+v", got, want)
	}
}

func TestSpawnCellsStayInHiddenRows(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		for _, c := range SpawnPiece(k).Cells() {
			if c.Y >= 2 {
				t.Errorf("kind %v: spawn cell %v has Y >= 2", k, c)
			}
			if c.X < 0 || c.X >= 10 {
				t.Errorf("kind %v: spawn cell %v has X out of [0,10)", k, c)
			}
		}
	}
}
