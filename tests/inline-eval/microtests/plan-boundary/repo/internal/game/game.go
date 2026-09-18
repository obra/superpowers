package game

import (
	"math/rand"
	"time"
)

const NextCount = 5

type Game struct {
	Board   Board
	Active  Piece
	Hold    *PieceKind
	CanHold bool
	Next    []PieceKind
	Bag     *Bag

	Score, Lines, Level, Combo int

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration
	LockResets         int
	Over               bool

	Seed int64
	rng  *rand.Rand
}

func New(seed int64) *Game {
	rng := rand.New(rand.NewSource(seed))
	g := &Game{
		Seed:    seed,
		rng:     rng,
		Bag:     NewBag(rng),
		CanHold: true,
		Level:   LevelFor(0),
	}
	g.Next = make([]PieceKind, NextCount)
	for i := range g.Next {
		g.Next[i] = g.Bag.Next()
	}
	g.spawn()
	return g
}

func (g *Game) spawn() []Event {
	kind := g.Next[0]
	copy(g.Next, g.Next[1:])
	g.Next[len(g.Next)-1] = g.Bag.Next()
	g.Active = SpawnPiece(kind)
	g.resetFallState()
	if g.Board.Collides(g.Active) {
		g.Over = true
		return []Event{{Kind: GameOver}}
	}
	return nil
}

// resetFallState gives a newly active piece a fresh gravity and lock budget,
// independent of whatever the previous piece had banked.
func (g *Game) resetFallState() {
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
}

func (g *Game) tryMove(dx, dy int) bool {
	candidate := g.Active
	candidate.X += dx
	candidate.Y += dy
	if g.Board.Collides(candidate) {
		return false
	}
	g.Active = candidate
	return true
}

func (g *Game) grounded() bool {
	p := g.Active
	p.Y++
	return g.Board.Collides(p)
}

func (g *Game) noteGroundedReset() {
	if g.grounded() && g.LockResets < MaxLockResets {
		g.LockAccumulator = 0
		g.LockResets++
	}
}

func (g *Game) MoveLeft() []Event {
	if g.Over {
		return nil
	}
	if !g.tryMove(-1, 0) {
		return nil
	}
	g.noteGroundedReset()
	return []Event{{Kind: PieceMoved, Piece: g.Active}}
}

func (g *Game) MoveRight() []Event {
	if g.Over {
		return nil
	}
	if !g.tryMove(1, 0) {
		return nil
	}
	g.noteGroundedReset()
	return []Event{{Kind: PieceMoved, Piece: g.Active}}
}

func (g *Game) rotate(delta int) []Event {
	if g.Over {
		return nil
	}
	candidate := g.Active
	candidate.Rotation = ((candidate.Rotation+delta)%4 + 4) % 4
	for _, k := range KickOffsets {
		p := candidate
		p.X += k.X
		p.Y += k.Y
		if !g.Board.Collides(p) {
			g.Active = p
			g.noteGroundedReset()
			return []Event{{Kind: PieceRotated, Piece: g.Active}}
		}
	}
	return nil
}

func (g *Game) RotateCW() []Event {
	return g.rotate(1)
}

func (g *Game) RotateCCW() []Event {
	return g.rotate(-1)
}

const maxCatchUpSteps = 20

func (g *Game) Interval() time.Duration {
	return DropInterval(g.Level)
}

func (g *Game) Advance(dt time.Duration) []Event {
	if g.Over {
		return nil
	}
	var evs []Event
	interval := g.Interval()
	g.GravityAccumulator += dt
	for steps := 0; g.GravityAccumulator >= interval; steps++ {
		if steps >= maxCatchUpSteps {
			g.GravityAccumulator = 0
			break
		}
		g.GravityAccumulator -= interval
		if !g.tryMove(0, 1) {
			g.GravityAccumulator = 0
			break
		}
		evs = append(evs, Event{Kind: PieceMoved, Piece: g.Active})
		g.LockAccumulator, g.LockResets = 0, 0
	}
	if g.grounded() {
		g.LockAccumulator += dt
		if g.LockAccumulator >= LockDelay {
			evs = append(evs, g.lock()...)
		}
	} else {
		g.LockAccumulator = 0
	}
	return evs
}

func (g *Game) SoftDrop() []Event {
	if g.Over {
		return nil
	}
	if !g.tryMove(0, 1) {
		return nil
	}
	g.Score += SoftDropPoints
	return []Event{{Kind: PieceSoftDropped, ScoreDelta: SoftDropPoints, Distance: 1, Piece: g.Active}}
}

func (g *Game) HoldPiece() []Event {
	if g.Over || !g.CanHold {
		return nil
	}
	activeKind := g.Active.Kind
	if g.Hold == nil {
		h := activeKind
		g.Hold = &h
		evs := []Event{{Kind: HoldUsed, Piece: g.Active}}
		g.CanHold = false
		return append(evs, g.spawn()...)
	}
	heldKind := *g.Hold
	incoming := SpawnPiece(heldKind)
	if g.Board.Collides(incoming) {
		g.Over = true
		return []Event{{Kind: GameOver}}
	}
	h := activeKind
	g.Hold = &h
	g.Active = incoming
	g.resetFallState()
	g.CanHold = false
	return []Event{{Kind: HoldUsed, Piece: g.Active}}
}

func (g *Game) GhostY() int {
	y := g.Active.Y
	for {
		candidate := g.Active
		candidate.Y = y + 1
		if g.Board.Collides(candidate) {
			return y
		}
		y++
	}
}

func (g *Game) HardDrop() []Event {
	if g.Over {
		return nil
	}
	startY := g.Active.Y
	g.Active.Y = g.GhostY()
	distance := g.Active.Y - startY
	evs := []Event{{Kind: PieceHardDropped, Piece: g.Active, Distance: distance, ScoreDelta: HardDropPoints * distance}}
	g.Score += HardDropPoints * distance
	evs = append(evs, g.lock()...)
	return evs
}

func (g *Game) lock() []Event {
	g.Board.Commit(g.Active)
	evs := []Event{{Kind: PieceLocked, Piece: g.Active}}

	prevCombo, prevLevel := g.Combo, g.Level

	rows := g.Board.CompleteRows()
	if len(rows) > 0 {
		cellsBefore := make([][]Cell, len(rows))
		for i, r := range rows {
			row := make([]Cell, Width)
			for x := 0; x < Width; x++ {
				row[x] = g.Board.At(x, r)
			}
			cellsBefore[i] = row
		}
		g.Combo++
		scoreDelta := LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)
		evs = append(evs, Event{
			Kind:       LinesCleared,
			Rows:       rows,
			Cells:      cellsBefore,
			Count:      len(rows),
			ScoreDelta: scoreDelta,
		})
		g.Board.ClearRows(rows)
		g.Score += scoreDelta
		g.Lines += len(rows)
	} else {
		g.Combo = 0
	}

	if g.Combo != prevCombo {
		evs = append(evs, Event{Kind: ComboChanged, Count: g.Combo})
	}

	g.Level = LevelFor(g.Lines)
	if g.Level != prevLevel {
		evs = append(evs, Event{Kind: LevelChanged, Count: g.Level})
	}

	evs = append(evs, g.spawn()...)
	g.CanHold = true
	return evs
}
