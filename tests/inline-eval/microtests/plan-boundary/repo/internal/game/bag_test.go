package game

import (
	"math"
	"math/rand"
	"testing"
)

func drawKinds(b *Bag, n int) []PieceKind {
	out := make([]PieceKind, n)
	for i := range out {
		out[i] = b.Next()
	}
	return out
}

func assertAllSevenExactlyOnce(t *testing.T, kinds []PieceKind) {
	t.Helper()
	if len(kinds) != KindCount {
		t.Fatalf("got %d kinds, want %d", len(kinds), KindCount)
	}
	counts := map[PieceKind]int{}
	for _, k := range kinds {
		counts[k]++
	}
	for k := PieceKind(0); k < KindCount; k++ {
		if counts[k] != 1 {
			t.Errorf("kind %v appears %d times, want 1", k, counts[k])
		}
	}
}

func TestEachBagContainsAllSevenExactlyOnce(t *testing.T) {
	b := NewBag(rand.New(rand.NewSource(1)))
	drawn := drawKinds(b, 14)
	assertAllSevenExactlyOnce(t, drawn[0:7])
	assertAllSevenExactlyOnce(t, drawn[7:14])
}

func TestSeededBagIsReproducible(t *testing.T) {
	a := NewBag(rand.New(rand.NewSource(8675309)))
	b := NewBag(rand.New(rand.NewSource(8675309)))
	seqA := drawKinds(a, 30)
	seqB := drawKinds(b, 30)
	for i := range seqA {
		if seqA[i] != seqB[i] {
			t.Fatalf("sequences diverge at index %d: %v != %v", i, seqA[i], seqB[i])
		}
	}
}

func TestBagWorksWithZeroAndNegativeSeeds(t *testing.T) {
	for _, seed := range []int64{0, -1, math.MinInt64} {
		b := NewBag(rand.New(rand.NewSource(seed)))
		assertAllSevenExactlyOnce(t, drawKinds(b, 7))
	}
}
