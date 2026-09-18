package game

import (
	"testing"
	"time"
)

func TestLineScoreTable(t *testing.T) {
	cases := []struct {
		lines, level, want int
	}{
		{0, 1, 0}, {1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {2, 7, 2100}, {3, 7, 3500}, {4, 7, 5600},
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d,%d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

func TestComboBonus(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 5, 0}, {1, 5, 0}, {2, 5, 250}, {3, 2, 200},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelFor(t *testing.T) {
	cases := []struct {
		lines, want int
	}{
		{0, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}

func TestDropIntervalCurveAndFloor(t *testing.T) {
	if got, want := DropInterval(1), 800*time.Millisecond; got != want {
		t.Errorf("DropInterval(1) = %v, want %v", got, want)
	}
	if got, want := DropInterval(2), 688*time.Millisecond; got != want {
		t.Errorf("DropInterval(2) = %v, want %v", got, want)
	}
	if got, want := DropInterval(3), 592*time.Millisecond; got != want {
		t.Errorf("DropInterval(3) = %v, want %v", got, want)
	}
	prev := DropInterval(1)
	for level := 2; level <= 19; level++ {
		cur := DropInterval(level)
		if cur >= prev {
			t.Errorf("DropInterval(%d) = %v, not strictly less than DropInterval(%d) = %v", level, cur, level-1, prev)
		}
		prev = cur
	}
	if got := DropInterval(19); got != MinInterval {
		t.Errorf("DropInterval(19) = %v, want MinInterval %v", got, MinInterval)
	}
	if got := DropInterval(30); got != MinInterval {
		t.Errorf("DropInterval(30) = %v, want MinInterval %v", got, MinInterval)
	}
}
