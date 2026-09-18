package game

import "math/rand"

type Bag struct {
	rng   *rand.Rand
	queue []PieceKind
}

func NewBag(rng *rand.Rand) *Bag {
	return &Bag{rng: rng}
}

func (b *Bag) Next() PieceKind {
	if len(b.queue) == 0 {
		b.refill()
	}
	k := b.queue[0]
	b.queue = b.queue[1:]
	return k
}

func (b *Bag) refill() {
	b.queue = make([]PieceKind, KindCount)
	for k := PieceKind(0); k < KindCount; k++ {
		b.queue[k] = k
	}
	b.rng.Shuffle(len(b.queue), func(i, j int) {
		b.queue[i], b.queue[j] = b.queue[j], b.queue[i]
	})
}
