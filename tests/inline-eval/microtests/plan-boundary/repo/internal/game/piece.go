package game

type PieceKind int

const (
	KindI PieceKind = iota
	KindJ
	KindL
	KindO
	KindS
	KindT
	KindZ
)

const KindCount = 7

var kindNames = [KindCount]string{"I", "J", "L", "O", "S", "T", "Z"}

func (k PieceKind) String() string {
	return kindNames[k]
}

func (k PieceKind) Letter() byte {
	return kindNames[k][0]
}

type Point struct{ X, Y int }

type Piece struct {
	Kind     PieceKind
	Rotation int
	X, Y     int
}

func (p Piece) Cells() [4]Point {
	rel := rotationCells(p.Kind, p.Rotation)
	var out [4]Point
	for i, pt := range rel {
		out[i] = Point{X: pt.X + p.X, Y: pt.Y + p.Y}
	}
	return out
}

func (p Piece) BoxSize() int {
	return boxSizeFor(p.Kind)
}

func boxSizeFor(k PieceKind) int {
	switch k {
	case KindI:
		return 4
	case KindO:
		return 2
	default:
		return 3
	}
}

func SpawnPiece(k PieceKind) Piece {
	size := boxSizeFor(k)
	return Piece{Kind: k, Rotation: 0, X: (10 - size) / 2, Y: 0}
}

var spawnGrids = map[PieceKind][]string{
	KindI: {"....", "XXXX", "....", "...."},
	KindJ: {"X..", "XXX", "..."},
	KindL: {"..X", "XXX", "..."},
	KindO: {"XX", "XX"},
	KindS: {".XX", "XX.", "..."},
	KindT: {".X.", "XXX", "..."},
	KindZ: {"XX.", ".XX", "..."},
}

var rotationTable [KindCount][4][4]Point

func init() {
	for k := PieceKind(0); k < KindCount; k++ {
		grid := spawnGrids[k]
		for r := 0; r < 4; r++ {
			rotationTable[k][r] = extractCells(grid)
			grid = rotateCW(grid)
		}
	}
}

// rotationCells returns the box-relative cells for a kind at a rotation,
// before the piece's board position is added.
func rotationCells(k PieceKind, r int) [4]Point {
	return rotationTable[k][((r%4)+4)%4]
}

func extractCells(grid []string) [4]Point {
	var cells [4]Point
	i := 0
	for y, row := range grid {
		for x, ch := range row {
			if ch == 'X' {
				cells[i] = Point{X: x, Y: y}
				i++
			}
		}
	}
	return cells
}

// rotateCW rotates a square grid of glyphs 90 degrees clockwise within its own box.
func rotateCW(grid []string) []string {
	n := len(grid)
	out := make([]string, n)
	for i := 0; i < n; i++ {
		row := make([]byte, n)
		for j := 0; j < n; j++ {
			row[j] = grid[n-1-j][i]
		}
		out[i] = string(row)
	}
	return out
}
