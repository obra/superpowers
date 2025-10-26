#!/usr/bin/env python3
"""
Easing Functions - Timing functions for smooth animations.

Provides various easing functions for natural motion and timing.
All functions take a value t (0.0 to 1.0) and return eased value (0.0 to 1.0).
"""

import math


def linear(t: float) -> float:
    """Linear interpolation (no easing)."""
    return t


def ease_in_quad(t: float) -> float:
    """Quadratic ease-in (slow start, accelerating)."""
    return t * t


def ease_out_quad(t: float) -> float:
    """Quadratic ease-out (fast start, decelerating)."""
    return t * (2 - t)


def ease_in_out_quad(t: float) -> float:
    """Quadratic ease-in-out (slow start and end)."""
    if t < 0.5:
        return 2 * t * t
    return -1 + (4 - 2 * t) * t


def ease_in_cubic(t: float) -> float:
    """Cubic ease-in (slow start)."""
    return t * t * t


def ease_out_cubic(t: float) -> float:
    """Cubic ease-out (fast start)."""
    return (t - 1) * (t - 1) * (t - 1) + 1


def ease_in_out_cubic(t: float) -> float:
    """Cubic ease-in-out."""
    if t < 0.5:
        return 4 * t * t * t
    return (t - 1) * (2 * t - 2) * (2 * t - 2) + 1


def ease_in_bounce(t: float) -> float:
    """Bounce ease-in (bouncy start)."""
    return 1 - ease_out_bounce(1 - t)


def ease_out_bounce(t: float) -> float:
    """Bounce ease-out (bouncy end)."""
    if t < 1 / 2.75:
        return 7.5625 * t * t
    elif t < 2 / 2.75:
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    elif t < 2.5 / 2.75:
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    else:
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375


def ease_in_out_bounce(t: float) -> float:
    """Bounce ease-in-out."""
    if t < 0.5:
        return ease_in_bounce(t * 2) * 0.5
    return ease_out_bounce(t * 2 - 1) * 0.5 + 0.5


def ease_in_elastic(t: float) -> float:
    """Elastic ease-in (spring effect)."""
    if t == 0 or t == 1:
        return t
    return -math.pow(2, 10 * (t - 1)) * math.sin((t - 1.1) * 5 * math.pi)


def ease_out_elastic(t: float) -> float:
    """Elastic ease-out (spring effect)."""
    if t == 0 or t == 1:
        return t
    return math.pow(2, -10 * t) * math.sin((t - 0.1) * 5 * math.pi) + 1


def ease_in_out_elastic(t: float) -> float:
    """Elastic ease-in-out."""
    if t == 0 or t == 1:
        return t
    t = t * 2 - 1
    if t < 0:
        return -0.5 * math.pow(2, 10 * t) * math.sin((t - 0.1) * 5 * math.pi)
    return math.pow(2, -10 * t) * math.sin((t - 0.1) * 5 * math.pi) * 0.5 + 1


# Convenience mapping
EASING_FUNCTIONS = {
    'linear': linear,
    'ease_in': ease_in_quad,
    'ease_out': ease_out_quad,
    'ease_in_out': ease_in_out_quad,
    'bounce_in': ease_in_bounce,
    'bounce_out': ease_out_bounce,
    'bounce': ease_in_out_bounce,
    'elastic_in': ease_in_elastic,
    'elastic_out': ease_out_elastic,
    'elastic': ease_in_out_elastic,
}


def get_easing(name: str = 'linear'):
    """Get easing function by name."""
    return EASING_FUNCTIONS.get(name, linear)


def interpolate(start: float, end: float, t: float, easing: str = 'linear') -> float:
    """
    Interpolate between two values with easing.

    Args:
        start: Start value
        end: End value
        t: Progress from 0.0 to 1.0
        easing: Name of easing function

    Returns:
        Interpolated value
    """
    ease_func = get_easing(easing)
    eased_t = ease_func(t)
    return start + (end - start) * eased_t


def ease_back_in(t: float) -> float:
    """Back ease-in (slight overshoot backward before forward motion)."""
    c1 = 1.70158
    c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t


def ease_back_out(t: float) -> float:
    """Back ease-out (overshoot forward then settle back)."""
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)


def ease_back_in_out(t: float) -> float:
    """Back ease-in-out (overshoot at both ends)."""
    c1 = 1.70158
    c2 = c1 * 1.525
    if t < 0.5:
        return (pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    return (pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2


def apply_squash_stretch(base_scale: tuple[float, float], intensity: float,
                         direction: str = 'vertical') -> tuple[float, float]:
    """
    Calculate squash and stretch scales for more dynamic animation.

    Args:
        base_scale: (width_scale, height_scale) base scales
        intensity: Squash/stretch intensity (0.0-1.0)
        direction: 'vertical', 'horizontal', or 'both'

    Returns:
        (width_scale, height_scale) with squash/stretch applied
    """
    width_scale, height_scale = base_scale

    if direction == 'vertical':
        # Compress vertically, expand horizontally (preserve volume)
        height_scale *= (1 - intensity * 0.5)
        width_scale *= (1 + intensity * 0.5)
    elif direction == 'horizontal':
        # Compress horizontally, expand vertically
        width_scale *= (1 - intensity * 0.5)
        height_scale *= (1 + intensity * 0.5)
    elif direction == 'both':
        # General squash (both dimensions)
        width_scale *= (1 - intensity * 0.3)
        height_scale *= (1 - intensity * 0.3)

    return (width_scale, height_scale)


def calculate_arc_motion(start: tuple[float, float], end: tuple[float, float],
                        height: float, t: float) -> tuple[float, float]:
    """
    Calculate position along a parabolic arc (natural motion path).

    Args:
        start: (x, y) starting position
        end: (x, y) ending position
        height: Arc height at midpoint (positive = upward)
        t: Progress (0.0-1.0)

    Returns:
        (x, y) position along arc
    """
    x1, y1 = start
    x2, y2 = end

    # Linear interpolation for x
    x = x1 + (x2 - x1) * t

    # Parabolic interpolation for y
    # y = start + progress * (end - start) + arc_offset
    # Arc offset peaks at t=0.5
    arc_offset = 4 * height * t * (1 - t)
    y = y1 + (y2 - y1) * t - arc_offset

    return (x, y)


# Add new easing functions to the convenience mapping
EASING_FUNCTIONS.update({
    'back_in': ease_back_in,
    'back_out': ease_back_out,
    'back_in_out': ease_back_in_out,
    'anticipate': ease_back_in,     # Alias
    'overshoot': ease_back_out,     # Alias
})