package game

import "strings"

const (
	Width       = 10
	Height      = 22
	VisibleRows = 20
	HiddenRows  = 2
)

type Cell uint8

const CellEmpty Cell = 0

func CellFor(k PieceKind) Cell {
	return Cell(k) + 1
}

func (c Cell) Empty() bool {
	return c == CellEmpty
}

func (c Cell) Kind() PieceKind {
	if c.Empty() {
		panic("game: Kind() called on empty cell")
	}
	return PieceKind(c - 1)
}

type Board struct {
	Cells [Height][Width]Cell
}

func (b *Board) At(x, y int) Cell {
	return b.Cells[y][x]
}

func (b *Board) Set(x, y int, c Cell) {
	b.Cells[y][x] = c
}

func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < Width && y >= 0 && y < Height
}

func (b *Board) Occupied(x, y int) bool {
	if !b.InBounds(x, y) {
		return true
	}
	return !b.At(x, y).Empty()
}

func (b *Board) Collides(p Piece) bool {
	for _, c := range p.Cells() {
		if b.Occupied(c.X, c.Y) {
			return true
		}
	}
	return false
}

func (b *Board) Commit(p Piece) {
	cell := CellFor(p.Kind)
	for _, c := range p.Cells() {
		b.Set(c.X, c.Y, cell)
	}
}

func (b *Board) CompleteRows() []int {
	var rows []int
	for y := 0; y < Height; y++ {
		full := true
		for x := 0; x < Width; x++ {
			if b.At(x, y).Empty() {
				full = false
				break
			}
		}
		if full {
			rows = append(rows, y)
		}
	}
	return rows
}

func (b *Board) ClearRows(rows []int) {
	remove := make(map[int]bool, len(rows))
	for _, r := range rows {
		remove[r] = true
	}
	var next [Height][Width]Cell
	writeY := Height - 1
	for y := Height - 1; y >= 0; y-- {
		if remove[y] {
			continue
		}
		next[writeY] = b.Cells[y]
		writeY--
	}
	b.Cells = next
}

func (b *Board) String() string {
	var sb strings.Builder
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			c := b.At(x, y)
			if c.Empty() {
				sb.WriteByte('.')
			} else {
				sb.WriteByte(c.Kind().Letter())
			}
		}
		sb.WriteByte('\n')
	}
	return sb.String()
}
