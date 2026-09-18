package game

type EventKind int

const (
	PieceMoved EventKind = iota
	PieceRotated
	PieceSoftDropped
	PieceHardDropped
	PieceLocked
	HoldUsed
	LinesCleared
	ComboChanged
	LevelChanged
	GameOver
)

var eventKindNames = [...]string{
	"PieceMoved",
	"PieceRotated",
	"PieceSoftDropped",
	"PieceHardDropped",
	"PieceLocked",
	"HoldUsed",
	"LinesCleared",
	"ComboChanged",
	"LevelChanged",
	"GameOver",
}

func (k EventKind) String() string {
	return eventKindNames[k]
}

type Event struct {
	Kind       EventKind
	Piece      Piece
	Rows       []int
	Cells      [][]Cell
	Count      int
	Distance   int
	ScoreDelta int
}
