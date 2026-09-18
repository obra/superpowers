package game

import (
	"strings"
	"testing"
)

func TestOccupiedTreatsOutOfBoundsAsSolid(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{-1, 5, true},
		{10, 5, true},
		{5, 22, true},
		{5, -1, true},
		{5, 5, false},
	}
	for _, c := range cases {
		if got := b.Occupied(c.x, c.y); got != c.want {
			t.Errorf("Occupied(%d,%d) = %v, want %v", c.x, c.y, got, c.want)
		}
	}
}

func TestCollidesWithWallsAndFloor(t *testing.T) {
	var b Board
	cases := []struct {
		p    Piece
		want bool
	}{
		{Piece{Kind: KindO, Rotation: 0, X: -1, Y: 0}, true},
		{Piece{Kind: KindO, Rotation: 0, X: 9, Y: 0}, true},
		{Piece{Kind: KindO, Rotation: 0, X: 0, Y: 21}, true},
		{Piece{Kind: KindO, Rotation: 0, X: 0, Y: 20}, false},
	}
	for _, c := range cases {
		if got := b.Collides(c.p); got != c.want {
			t.Errorf("Collides(%+v) = %v, want %v", c.p, got, c.want)
		}
	}
}

func TestCollidesWithLockedCell(t *testing.T) {
	var b Board
	b.Set(4, 10, CellFor(KindT))
	if got := b.Collides(Piece{Kind: KindO, Rotation: 0, X: 4, Y: 9}); !got {
		t.Errorf("expected collision against locked cell")
	}
	if got := b.Collides(Piece{Kind: KindO, Rotation: 0, X: 0, Y: 9}); got {
		t.Errorf("expected no collision away from locked cell")
	}
}

func TestCommitWritesKindCells(t *testing.T) {
	var b Board
	b.Commit(Piece{Kind: KindO, Rotation: 0, X: 4, Y: 20})
	want := CellFor(KindO)
	for _, pt := range [][2]int{{4, 20}, {5, 20}, {4, 21}, {5, 21}} {
		if got := b.At(pt[0], pt[1]); got != want {
			t.Errorf("At(%d,%d) = %v, want %v", pt[0], pt[1], got, want)
		}
	}
}

func TestCompleteRowsFindsAllFullRows(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 19, CellFor(KindT))
		b.Set(x, 21, CellFor(KindT))
	}
	for x := 0; x < Width-1; x++ {
		b.Set(x, 20, CellFor(KindT))
	}
	got := b.CompleteRows()
	want := []int{19, 21}
	if len(got) != len(want) {
		t.Fatalf("CompleteRows() = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("CompleteRows() = %v, want %v", got, want)
		}
	}
}

func TestClearRowsCollapsesAbove(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 21, CellFor(KindT))
	}
	b.Set(0, 20, CellFor(KindS))
	b.ClearRows([]int{21})
	if got, want := b.At(0, 21), CellFor(KindS); got != want {
		t.Errorf("At(0,21) = %v, want %v (lone cell should fall)", got, want)
	}
	if got := b.At(0, 20); !got.Empty() {
		t.Errorf("At(0,20) = %v, want empty", got)
	}
	for x := 0; x < Width; x++ {
		if got := b.At(x, 0); !got.Empty() {
			t.Errorf("At(%d,0) = %v, want empty", x, got)
		}
	}
}

func TestClearRowsHandlesHiddenRows(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 0, CellFor(KindT))
		b.Set(x, 21, CellFor(KindT))
	}
	b.ClearRows([]int{0, 21})
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if got := b.At(x, y); !got.Empty() {
				t.Fatalf("At(%d,%d) = %v, want empty board after clearing", x, y, got)
			}
		}
	}
}

func TestBoardStringShape(t *testing.T) {
	var b Board
	s := strings.TrimRight(b.String(), "\n")
	lines := strings.Split(s, "\n")
	if len(lines) != Height {
		t.Fatalf("String() has %d lines, want %d", len(lines), Height)
	}
	for _, line := range lines {
		if line != strings.Repeat(".", Width) {
			t.Errorf("empty row = %q, want all '.'", line)
		}
	}
	b.Set(0, 0, CellFor(KindT))
	s = strings.TrimRight(b.String(), "\n")
	lines = strings.Split(s, "\n")
	if lines[0][0] != 'T' {
		t.Errorf("filled cell rendered %q, want 'T'", lines[0][0])
	}
}
