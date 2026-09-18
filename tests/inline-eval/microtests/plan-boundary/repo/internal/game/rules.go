package game

import "time"

const (
	LockDelay      = 500 * time.Millisecond
	MaxLockResets  = 15
	BaseInterval   = 800 * time.Millisecond
	MinInterval    = 60 * time.Millisecond
	IntervalFactor = 0.86
	LinesPerLevel  = 10
)

var KickOffsets = [8]Point{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
