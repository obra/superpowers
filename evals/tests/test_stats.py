"""Tests for Wilson score confidence interval."""

from __future__ import annotations

from drill.stats import wilson_ci


class TestWilsonCI:
    def test_all_pass(self) -> None:
        lo, hi = wilson_ci(10, 10)
        assert lo > 0.69
        assert hi == 1.0 or hi > 0.99

    def test_all_fail(self) -> None:
        lo, hi = wilson_ci(0, 10)
        assert lo < 0.01 or lo == 0.0
        assert hi < 0.31

    def test_half_pass(self) -> None:
        lo, hi = wilson_ci(5, 10)
        assert 0.18 < lo < 0.25
        assert 0.75 < hi < 0.82

    def test_zero_total(self) -> None:
        lo, hi = wilson_ci(0, 0)
        assert lo == 0.0
        assert hi == 0.0

    def test_single_pass(self) -> None:
        lo, hi = wilson_ci(1, 1)
        assert lo > 0.0
        assert hi <= 1.0

    def test_single_fail(self) -> None:
        lo, hi = wilson_ci(0, 1)
        assert lo == 0.0 or lo >= 0.0
        assert hi < 1.0

    def test_large_sample(self) -> None:
        lo, hi = wilson_ci(80, 100)
        assert 0.70 < lo < 0.75
        assert 0.85 < hi < 0.90

    def test_passed_greater_than_total_clamped(self) -> None:
        lo, hi = wilson_ci(12, 10)
        assert lo > 0.0
        assert hi <= 1.0

    def test_returns_tuple_of_floats(self) -> None:
        result = wilson_ci(5, 10)
        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], float)
        assert isinstance(result[1], float)
