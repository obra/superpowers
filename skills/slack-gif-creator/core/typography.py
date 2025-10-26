#!/usr/bin/env python3
"""
Typography System - Professional text rendering with outlines, shadows, and effects.

This module provides high-quality text rendering that looks crisp and professional
in GIFs, with outlines for readability and effects for visual impact.
"""

from PIL import Image, ImageDraw, ImageFont
from typing import Optional


# Typography scale - proportional sizing system
TYPOGRAPHY_SCALE = {
    'h1': 60,      # Large headers
    'h2': 48,      # Medium headers
    'h3': 36,      # Small headers
    'title': 50,   # Title text
    'body': 28,    # Body text
    'small': 20,   # Small text
    'tiny': 16,    # Tiny text
}


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """
    Get a font with fallback support.

    Args:
        size: Font size in pixels
        bold: Use bold variant if available

    Returns:
        ImageFont object
    """
    # Try multiple font paths for cross-platform support
    font_paths = [
        # macOS fonts
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SF-Pro.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        # Linux fonts
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        # Windows fonts
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
    ]

    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size)
        except:
            continue

    # Ultimate fallback
    return ImageFont.load_default()


def draw_text_with_outline(
    frame: Image.Image,
    text: str,
    position: tuple[int, int],
    font_size: int = 40,
    text_color: tuple[int, int, int] = (255, 255, 255),
    outline_color: tuple[int, int, int] = (0, 0, 0),
    outline_width: int = 3,
    centered: bool = False,
    bold: bool = True
) -> Image.Image:
    """
    Draw text with outline for maximum readability.

    This is THE most important function for professional-looking text in GIFs.
    The outline ensures text is readable on any background.

    Args:
        frame: PIL Image to draw on
        text: Text to draw
        position: (x, y) position
        font_size: Font size in pixels
        text_color: RGB color for text fill
        outline_color: RGB color for outline
        outline_width: Width of outline in pixels (2-4 recommended)
        centered: If True, center text at position
        bold: Use bold font variant

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    font = get_font(font_size, bold=bold)

    # Calculate position for centering
    if centered:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = position[0] - text_width // 2
        y = position[1] - text_height // 2
        position = (x, y)

    # Draw outline by drawing text multiple times offset in all directions
    x, y = position
    for offset_x in range(-outline_width, outline_width + 1):
        for offset_y in range(-outline_width, outline_width + 1):
            if offset_x != 0 or offset_y != 0:
                draw.text((x + offset_x, y + offset_y), text, fill=outline_color, font=font)

    # Draw main text on top
    draw.text(position, text, fill=text_color, font=font)

    return frame


def draw_text_with_shadow(
    frame: Image.Image,
    text: str,
    position: tuple[int, int],
    font_size: int = 40,
    text_color: tuple[int, int, int] = (255, 255, 255),
    shadow_color: tuple[int, int, int] = (0, 0, 0),
    shadow_offset: tuple[int, int] = (3, 3),
    centered: bool = False,
    bold: bool = True
) -> Image.Image:
    """
    Draw text with drop shadow for depth.

    Args:
        frame: PIL Image to draw on
        text: Text to draw
        position: (x, y) position
        font_size: Font size in pixels
        text_color: RGB color for text
        shadow_color: RGB color for shadow
        shadow_offset: (x, y) offset for shadow
        centered: If True, center text at position
        bold: Use bold font variant

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    font = get_font(font_size, bold=bold)

    # Calculate position for centering
    if centered:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = position[0] - text_width // 2
        y = position[1] - text_height // 2
        position = (x, y)

    # Draw shadow
    shadow_pos = (position[0] + shadow_offset[0], position[1] + shadow_offset[1])
    draw.text(shadow_pos, text, fill=shadow_color, font=font)

    # Draw main text
    draw.text(position, text, fill=text_color, font=font)

    return frame


def draw_text_with_glow(
    frame: Image.Image,
    text: str,
    position: tuple[int, int],
    font_size: int = 40,
    text_color: tuple[int, int, int] = (255, 255, 255),
    glow_color: tuple[int, int, int] = (255, 200, 0),
    glow_radius: int = 5,
    centered: bool = False,
    bold: bool = True
) -> Image.Image:
    """
    Draw text with glow effect for emphasis.

    Args:
        frame: PIL Image to draw on
        text: Text to draw
        position: (x, y) position
        font_size: Font size in pixels
        text_color: RGB color for text
        glow_color: RGB color for glow
        glow_radius: Radius of glow effect
        centered: If True, center text at position
        bold: Use bold font variant

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    font = get_font(font_size, bold=bold)

    # Calculate position for centering
    if centered:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = position[0] - text_width // 2
        y = position[1] - text_height // 2
        position = (x, y)

    # Draw glow layers with decreasing opacity (simulated with same color at different offsets)
    x, y = position
    for radius in range(glow_radius, 0, -1):
        for offset_x in range(-radius, radius + 1):
            for offset_y in range(-radius, radius + 1):
                if offset_x != 0 or offset_y != 0:
                    draw.text((x + offset_x, y + offset_y), text, fill=glow_color, font=font)

    # Draw main text
    draw.text(position, text, fill=text_color, font=font)

    return frame


def draw_text_in_box(
    frame: Image.Image,
    text: str,
    position: tuple[int, int],
    font_size: int = 40,
    text_color: tuple[int, int, int] = (255, 255, 255),
    box_color: tuple[int, int, int] = (0, 0, 0),
    box_alpha: float = 0.7,
    padding: int = 10,
    centered: bool = True,
    bold: bool = True
) -> Image.Image:
    """
    Draw text in a semi-transparent box for guaranteed readability.

    Args:
        frame: PIL Image to draw on
        text: Text to draw
        position: (x, y) position
        font_size: Font size in pixels
        text_color: RGB color for text
        box_color: RGB color for background box
        box_alpha: Opacity of box (0.0-1.0)
        padding: Padding around text in pixels
        centered: If True, center at position
        bold: Use bold font variant

    Returns:
        Modified frame
    """
    # Create a separate layer for the box with alpha
    overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw = ImageDraw.Draw(frame)

    font = get_font(font_size, bold=bold)

    # Get text dimensions
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate box position
    if centered:
        box_x = position[0] - (text_width + padding * 2) // 2
        box_y = position[1] - (text_height + padding * 2) // 2
        text_x = position[0] - text_width // 2
        text_y = position[1] - text_height // 2
    else:
        box_x = position[0] - padding
        box_y = position[1] - padding
        text_x = position[0]
        text_y = position[1]

    # Draw semi-transparent box
    box_coords = [
        box_x,
        box_y,
        box_x + text_width + padding * 2,
        box_y + text_height + padding * 2
    ]
    alpha_value = int(255 * box_alpha)
    draw_overlay.rectangle(box_coords, fill=(*box_color, alpha_value))

    # Composite overlay onto frame
    frame_rgba = frame.convert('RGBA')
    frame_rgba = Image.alpha_composite(frame_rgba, overlay)
    frame = frame_rgba.convert('RGB')

    # Draw text on top
    draw = ImageDraw.Draw(frame)
    draw.text((text_x, text_y), text, fill=text_color, font=font)

    return frame


def get_text_size(text: str, font_size: int, bold: bool = True) -> tuple[int, int]:
    """
    Get the dimensions of text without drawing it.

    Args:
        text: Text to measure
        font_size: Font size in pixels
        bold: Use bold font variant

    Returns:
        (width, height) tuple
    """
    font = get_font(font_size, bold=bold)
    # Create temporary image to measure
    temp_img = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(temp_img)
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return (width, height)


def get_optimal_font_size(text: str, max_width: int, max_height: int,
                          start_size: int = 60) -> int:
    """
    Find the largest font size that fits within given dimensions.

    Args:
        text: Text to size
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
        start_size: Starting font size to try

    Returns:
        Optimal font size
    """
    font_size = start_size
    while font_size > 10:
        width, height = get_text_size(text, font_size)
        if width <= max_width and height <= max_height:
            return font_size
        font_size -= 2
    return 10  # Minimum font size


def scale_font_for_frame(base_size: int, frame_width: int, frame_height: int) -> int:
    """
    Scale font size proportionally to frame dimensions.

    Useful for maintaining relative text size across different GIF dimensions.

    Args:
        base_size: Base font size for 480x480 frame
        frame_width: Actual frame width
        frame_height: Actual frame height

    Returns:
        Scaled font size
    """
    # Use average dimension for scaling
    avg_dimension = (frame_width + frame_height) / 2
    base_dimension = 480  # Reference dimension
    scale_factor = avg_dimension / base_dimension
    return max(10, int(base_size * scale_factor))