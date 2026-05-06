"""Statistical utilities for drill result analysis."""

from __future__ import annotations

import math


def wilson_ci(passed: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return (0.0, 0.0)
    if passed > total:
        passed = total
    p = passed / total
    denom = 1 + z**2 / total
    center = (p + z**2 / (2 * total)) / denom
    margin = (z / denom) * math.sqrt(p * (1 - p) / total + z**2 / (4 * total**2))
    return (max(0.0, center - margin), min(1.0, center + margin))
