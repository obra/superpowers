#!/usr/bin/env python3
"""
Color Palettes - Professional, harmonious color schemes for GIFs.

Using consistent, well-designed color palettes makes GIFs look professional
and polished instead of random and amateurish.
"""

from typing import Optional
import colorsys


# Professional color palettes - hand-picked for GIF compression and visual appeal

VIBRANT = {
    'primary': (255, 68, 68),      # Bright red
    'secondary': (255, 168, 0),     # Bright orange
    'accent': (0, 168, 255),        # Bright blue
    'success': (68, 255, 68),       # Bright green
    'background': (240, 248, 255),  # Alice blue
    'text': (30, 30, 30),           # Almost black
    'text_light': (255, 255, 255),  # White
}

PASTEL = {
    'primary': (255, 179, 186),     # Pastel pink
    'secondary': (255, 223, 186),   # Pastel peach
    'accent': (186, 225, 255),      # Pastel blue
    'success': (186, 255, 201),     # Pastel green
    'background': (255, 250, 240),  # Floral white
    'text': (80, 80, 80),           # Dark gray
    'text_light': (255, 255, 255),  # White
}

DARK = {
    'primary': (255, 100, 100),     # Muted red
    'secondary': (100, 200, 255),   # Muted blue
    'accent': (255, 200, 100),      # Muted gold
    'success': (100, 255, 150),     # Muted green
    'background': (30, 30, 35),     # Almost black
    'text': (220, 220, 220),        # Light gray
    'text_light': (255, 255, 255),  # White
}

NEON = {
    'primary': (255, 16, 240),      # Neon pink
    'secondary': (0, 255, 255),     # Cyan
    'accent': (255, 255, 0),        # Yellow
    'success': (57, 255, 20),       # Neon green
    'background': (20, 20, 30),     # Dark blue-black
    'text': (255, 255, 255),        # White
    'text_light': (255, 255, 255),  # White
}

PROFESSIONAL = {
    'primary': (0, 122, 255),       # System blue
    'secondary': (88, 86, 214),     # System purple
    'accent': (255, 149, 0),        # System orange
    'success': (52, 199, 89),       # System green
    'background': (255, 255, 255),  # White
    'text': (0, 0, 0),              # Black
    'text_light': (255, 255, 255),  # White
}

WARM = {
    'primary': (255, 107, 107),     # Coral red
    'secondary': (255, 159, 64),    # Orange
    'accent': (255, 218, 121),      # Yellow
    'success': (106, 176, 76),      # Olive green
    'background': (255, 246, 229),  # Warm white
    'text': (51, 51, 51),           # Charcoal
    'text_light': (255, 255, 255),  # White
}

COOL = {
    'primary': (107, 185, 240),     # Sky blue
    'secondary': (130, 202, 157),   # Mint
    'accent': (162, 155, 254),      # Lavender
    'success': (86, 217, 150),      # Aqua green
    'background': (240, 248, 255),  # Alice blue
    'text': (45, 55, 72),           # Dark slate
    'text_light': (255, 255, 255),  # White
}

MONOCHROME = {
    'primary': (80, 80, 80),        # Dark gray
    'secondary': (130, 130, 130),   # Medium gray
    'accent': (180, 180, 180),      # Light gray
    'success': (100, 100, 100),     # Gray
    'background': (245, 245, 245),  # Off-white
    'text': (30, 30, 30),           # Almost black
    'text_light': (255, 255, 255),  # White
}

# Map of palette names
PALETTES = {
    'vibrant': VIBRANT,
    'pastel': PASTEL,
    'dark': DARK,
    'neon': NEON,
    'professional': PROFESSIONAL,
    'warm': WARM,
    'cool': COOL,
    'monochrome': MONOCHROME,
}


def get_palette(name: str = 'vibrant') -> dict:
    """
    Get a color palette by name.

    Args:
        name: Palette name (vibrant, pastel, dark, neon, professional, warm, cool, monochrome)

    Returns:
        Dictionary of color roles to RGB tuples
    """
    return PALETTES.get(name.lower(), VIBRANT)


def get_text_color_for_background(bg_color: tuple[int, int, int]) -> tuple[int, int, int]:
    """
    Get the best text color (black or white) for a given background.

    Uses luminance calculation to ensure readability.

    Args:
        bg_color: Background RGB color

    Returns:
        Text color (black or white) that contrasts well
    """
    # Calculate relative luminance
    r, g, b = bg_color
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    # Return black for light backgrounds, white for dark
    return (0, 0, 0) if luminance > 0.5 else (255, 255, 255)


def get_complementary_color(color: tuple[int, int, int]) -> tuple[int, int, int]:
    """
    Get the complementary (opposite) color on the color wheel.

    Args:
        color: RGB color tuple

    Returns:
        Complementary RGB color
    """
    # Convert to HSV
    r, g, b = [x / 255.0 for x in color]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)

    # Rotate hue by 180 degrees (0.5 in 0-1 scale)
    h_comp = (h + 0.5) % 1.0

    # Convert back to RGB
    r_comp, g_comp, b_comp = colorsys.hsv_to_rgb(h_comp, s, v)
    return (int(r_comp * 255), int(g_comp * 255), int(b_comp * 255))


def lighten_color(color: tuple[int, int, int], amount: float = 0.3) -> tuple[int, int, int]:
    """
    Lighten a color by a given amount.

    Args:
        color: RGB color tuple
        amount: Amount to lighten (0.0-1.0)

    Returns:
        Lightened RGB color
    """
    r, g, b = color
    r = min(255, int(r + (255 - r) * amount))
    g = min(255, int(g + (255 - g) * amount))
    b = min(255, int(b + (255 - b) * amount))
    return (r, g, b)


def darken_color(color: tuple[int, int, int], amount: float = 0.3) -> tuple[int, int, int]:
    """
    Darken a color by a given amount.

    Args:
        color: RGB color tuple
        amount: Amount to darken (0.0-1.0)

    Returns:
        Darkened RGB color
    """
    r, g, b = color
    r = max(0, int(r * (1 - amount)))
    g = max(0, int(g * (1 - amount)))
    b = max(0, int(b * (1 - amount)))
    return (r, g, b)


def blend_colors(color1: tuple[int, int, int], color2: tuple[int, int, int],
                 ratio: float = 0.5) -> tuple[int, int, int]:
    """
    Blend two colors together.

    Args:
        color1: First RGB color
        color2: Second RGB color
        ratio: Blend ratio (0.0 = all color1, 1.0 = all color2)

    Returns:
        Blended RGB color
    """
    r1, g1, b1 = color1
    r2, g2, b2 = color2

    r = int(r1 * (1 - ratio) + r2 * ratio)
    g = int(g1 * (1 - ratio) + g2 * ratio)
    b = int(b1 * (1 - ratio) + b2 * ratio)

    return (r, g, b)


def create_gradient_colors(start_color: tuple[int, int, int],
                           end_color: tuple[int, int, int],
                           steps: int) -> list[tuple[int, int, int]]:
    """
    Create a gradient of colors between two colors.

    Args:
        start_color: Starting RGB color
        end_color: Ending RGB color
        steps: Number of gradient steps

    Returns:
        List of RGB colors forming gradient
    """
    colors = []
    for i in range(steps):
        ratio = i / (steps - 1) if steps > 1 else 0
        colors.append(blend_colors(start_color, end_color, ratio))
    return colors


# Impact/emphasis colors that work well across palettes
IMPACT_COLORS = {
    'flash': (255, 255, 240),       # Bright flash (cream)
    'explosion': (255, 150, 0),     # Orange explosion
    'electricity': (100, 200, 255),  # Electric blue
    'fire': (255, 100, 0),          # Fire orange-red
    'success': (50, 255, 100),      # Success green
    'error': (255, 50, 50),         # Error red
    'warning': (255, 200, 0),       # Warning yellow
    'magic': (200, 100, 255),       # Magic purple
}


def get_impact_color(effect_type: str = 'flash') -> tuple[int, int, int]:
    """
    Get a color for impact/emphasis effects.

    Args:
        effect_type: Type of effect (flash, explosion, electricity, etc.)

    Returns:
        RGB color for effect
    """
    return IMPACT_COLORS.get(effect_type, IMPACT_COLORS['flash'])


# Emoji-safe palettes (work well at 128x128 with 32-64 colors)
EMOJI_PALETTES = {
    'simple': [
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
        (255, 100, 100),  # Red
        (100, 255, 100),  # Green
        (100, 100, 255),  # Blue
        (255, 255, 100),  # Yellow
    ],
    'vibrant_emoji': [
        (255, 255, 255),  # White
        (30, 30, 30),     # Black
        (255, 68, 68),    # Red
        (68, 255, 68),    # Green
        (68, 68, 255),    # Blue
        (255, 200, 68),   # Gold
        (255, 68, 200),   # Pink
        (68, 255, 200),   # Cyan
    ]
}


def get_emoji_palette(name: str = 'simple') -> list[tuple[int, int, int]]:
    """
    Get a limited color palette optimized for emoji GIFs (<64KB).

    Args:
        name: Palette name (simple, vibrant_emoji)

    Returns:
        List of RGB colors (6-8 colors)
    """
    return EMOJI_PALETTES.get(name, EMOJI_PALETTES['simple'])