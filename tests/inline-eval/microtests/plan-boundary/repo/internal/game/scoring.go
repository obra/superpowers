package game

import (
	"math"
	"time"
)

const (
	SoftDropPoints = 1
	HardDropPoints = 2
)

func LineScore(lines, level int) int {
	var base int
	switch lines {
	case 1:
		base = 100
	case 2:
		base = 300
	case 3:
		base = 500
	case 4:
		base = 800
	}
	return base * level
}

func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}

func LevelFor(lines int) int {
	return lines/LinesPerLevel + 1
}

func DropInterval(level int) time.Duration {
	ms := float64(BaseInterval/time.Millisecond) * math.Pow(IntervalFactor, float64(level-1))
	d := time.Duration(math.Round(ms)) * time.Millisecond
	if d < MinInterval {
		return MinInterval
	}
	return d
}
