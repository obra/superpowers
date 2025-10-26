#!/usr/bin/env python3
"""
Frame Composer - Utilities for composing visual elements into frames.

Provides functions for drawing shapes, text, emojis, and compositing elements
together to create animation frames.
"""

from PIL import Image, ImageDraw, ImageFont
import numpy as np
from typing import Optional


def create_blank_frame(width: int, height: int, color: tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    """
    Create a blank frame with solid color background.

    Args:
        width: Frame width
        height: Frame height
        color: RGB color tuple (default: white)

    Returns:
        PIL Image
    """
    return Image.new('RGB', (width, height), color)


def draw_circle(frame: Image.Image, center: tuple[int, int], radius: int,
                fill_color: Optional[tuple[int, int, int]] = None,
                outline_color: Optional[tuple[int, int, int]] = None,
                outline_width: int = 1) -> Image.Image:
    """
    Draw a circle on a frame.

    Args:
        frame: PIL Image to draw on
        center: (x, y) center position
        radius: Circle radius
        fill_color: RGB fill color (None for no fill)
        outline_color: RGB outline color (None for no outline)
        outline_width: Outline width in pixels

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x, y = center
    bbox = [x - radius, y - radius, x + radius, y + radius]
    draw.ellipse(bbox, fill=fill_color, outline=outline_color, width=outline_width)
    return frame


def draw_rectangle(frame: Image.Image, top_left: tuple[int, int], bottom_right: tuple[int, int],
                   fill_color: Optional[tuple[int, int, int]] = None,
                   outline_color: Optional[tuple[int, int, int]] = None,
                   outline_width: int = 1) -> Image.Image:
    """
    Draw a rectangle on a frame.

    Args:
        frame: PIL Image to draw on
        top_left: (x, y) top-left corner
        bottom_right: (x, y) bottom-right corner
        fill_color: RGB fill color (None for no fill)
        outline_color: RGB outline color (None for no outline)
        outline_width: Outline width in pixels

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    draw.rectangle([top_left, bottom_right], fill=fill_color, outline=outline_color, width=outline_width)
    return frame


def draw_line(frame: Image.Image, start: tuple[int, int], end: tuple[int, int],
              color: tuple[int, int, int] = (0, 0, 0), width: int = 2) -> Image.Image:
    """
    Draw a line on a frame.

    Args:
        frame: PIL Image to draw on
        start: (x, y) start position
        end: (x, y) end position
        color: RGB line color
        width: Line width in pixels

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    draw.line([start, end], fill=color, width=width)
    return frame


def draw_text(frame: Image.Image, text: str, position: tuple[int, int],
              font_size: int = 40, color: tuple[int, int, int] = (0, 0, 0),
              centered: bool = False) -> Image.Image:
    """
    Draw text on a frame.

    Args:
        frame: PIL Image to draw on
        text: Text to draw
        position: (x, y) position (top-left unless centered=True)
        font_size: Font size in pixels
        color: RGB text color
        centered: If True, center text at position

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)

    # Try to use default font, fall back to basic if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()

    if centered:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = position[0] - text_width // 2
        y = position[1] - text_height // 2
        position = (x, y)

    draw.text(position, text, fill=color, font=font)
    return frame


def draw_emoji(frame: Image.Image, emoji: str, position: tuple[int, int], size: int = 60) -> Image.Image:
    """
    Draw emoji text on a frame (requires system emoji support).

    Args:
        frame: PIL Image to draw on
        emoji: Emoji character(s)
        position: (x, y) position
        size: Emoji size in pixels

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)

    # Use Apple Color Emoji font on macOS
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", size)
    except:
        # Fallback to text-based emoji
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)

    draw.text(position, emoji, font=font, embedded_color=True)
    return frame


def composite_layers(base: Image.Image, overlay: Image.Image,
                     position: tuple[int, int] = (0, 0), alpha: float = 1.0) -> Image.Image:
    """
    Composite one image on top of another.

    Args:
        base: Base image
        overlay: Image to overlay on top
        position: (x, y) position to place overlay
        alpha: Opacity of overlay (0.0 = transparent, 1.0 = opaque)

    Returns:
        Composite image
    """
    # Convert to RGBA for transparency support
    base_rgba = base.convert('RGBA')
    overlay_rgba = overlay.convert('RGBA')

    # Apply alpha
    if alpha < 1.0:
        overlay_rgba = overlay_rgba.copy()
        overlay_rgba.putalpha(int(255 * alpha))

    # Paste overlay onto base
    base_rgba.paste(overlay_rgba, position, overlay_rgba)

    # Convert back to RGB
    return base_rgba.convert('RGB')


def draw_stick_figure(frame: Image.Image, position: tuple[int, int], scale: float = 1.0,
                      color: tuple[int, int, int] = (0, 0, 0), line_width: int = 3) -> Image.Image:
    """
    Draw a simple stick figure.

    Args:
        frame: PIL Image to draw on
        position: (x, y) center position of head
        scale: Size multiplier
        color: RGB line color
        line_width: Line width in pixels

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x, y = position

    # Scale dimensions
    head_radius = int(15 * scale)
    body_length = int(40 * scale)
    arm_length = int(25 * scale)
    leg_length = int(35 * scale)
    leg_spread = int(15 * scale)

    # Head
    draw.ellipse([x - head_radius, y - head_radius, x + head_radius, y + head_radius],
                 outline=color, width=line_width)

    # Body
    body_start = y + head_radius
    body_end = body_start + body_length
    draw.line([(x, body_start), (x, body_end)], fill=color, width=line_width)

    # Arms
    arm_y = body_start + int(body_length * 0.3)
    draw.line([(x - arm_length, arm_y), (x + arm_length, arm_y)], fill=color, width=line_width)

    # Legs
    draw.line([(x, body_end), (x - leg_spread, body_end + leg_length)], fill=color, width=line_width)
    draw.line([(x, body_end), (x + leg_spread, body_end + leg_length)], fill=color, width=line_width)

    return frame


def create_gradient_background(width: int, height: int,
                               top_color: tuple[int, int, int],
                               bottom_color: tuple[int, int, int]) -> Image.Image:
    """
    Create a vertical gradient background.

    Args:
        width: Frame width
        height: Frame height
        top_color: RGB color at top
        bottom_color: RGB color at bottom

    Returns:
        PIL Image with gradient
    """
    frame = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(frame)

    # Calculate color step for each row
    r1, g1, b1 = top_color
    r2, g2, b2 = bottom_color

    for y in range(height):
        # Interpolate color
        ratio = y / height
        r = int(r1 * (1 - ratio) + r2 * ratio)
        g = int(g1 * (1 - ratio) + g2 * ratio)
        b = int(b1 * (1 - ratio) + b2 * ratio)

        # Draw horizontal line
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    return frame


def draw_emoji_enhanced(frame: Image.Image, emoji: str, position: tuple[int, int],
                       size: int = 60, shadow: bool = True,
                       shadow_offset: tuple[int, int] = (2, 2)) -> Image.Image:
    """
    Draw emoji with optional shadow for better visual quality.

    Args:
        frame: PIL Image to draw on
        emoji: Emoji character(s)
        position: (x, y) position
        size: Emoji size in pixels (minimum 12)
        shadow: Whether to add drop shadow
        shadow_offset: Shadow offset

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)

    # Ensure minimum size to avoid font rendering errors
    size = max(12, size)

    # Use Apple Color Emoji font on macOS
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", size)
    except:
        # Fallback to text-based emoji
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
        except:
            font = ImageFont.load_default()

    # Draw shadow first if enabled
    if shadow and size >= 20:  # Only draw shadow for larger emojis
        shadow_pos = (position[0] + shadow_offset[0], position[1] + shadow_offset[1])
        # Draw semi-transparent shadow (simulated by drawing multiple times)
        for offset in range(1, 3):
            try:
                draw.text((shadow_pos[0] + offset, shadow_pos[1] + offset),
                         emoji, font=font, embedded_color=True, fill=(0, 0, 0, 100))
            except:
                pass  # Skip shadow if it fails

    # Draw main emoji
    try:
        draw.text(position, emoji, font=font, embedded_color=True)
    except:
        # Fallback to basic drawing if embedded color fails
        draw.text(position, emoji, font=font, fill=(0, 0, 0))

    return frame


def draw_circle_with_shadow(frame: Image.Image, center: tuple[int, int], radius: int,
                            fill_color: tuple[int, int, int],
                            shadow_offset: tuple[int, int] = (3, 3),
                            shadow_color: tuple[int, int, int] = (0, 0, 0)) -> Image.Image:
    """
    Draw a circle with drop shadow.

    Args:
        frame: PIL Image to draw on
        center: (x, y) center position
        radius: Circle radius
        fill_color: RGB fill color
        shadow_offset: (x, y) shadow offset
        shadow_color: RGB shadow color

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x, y = center

    # Draw shadow
    shadow_center = (x + shadow_offset[0], y + shadow_offset[1])
    shadow_bbox = [
        shadow_center[0] - radius,
        shadow_center[1] - radius,
        shadow_center[0] + radius,
        shadow_center[1] + radius
    ]
    draw.ellipse(shadow_bbox, fill=shadow_color)

    # Draw main circle
    bbox = [x - radius, y - radius, x + radius, y + radius]
    draw.ellipse(bbox, fill=fill_color)

    return frame


def draw_rounded_rectangle(frame: Image.Image, top_left: tuple[int, int],
                          bottom_right: tuple[int, int], radius: int,
                          fill_color: Optional[tuple[int, int, int]] = None,
                          outline_color: Optional[tuple[int, int, int]] = None,
                          outline_width: int = 1) -> Image.Image:
    """
    Draw a rectangle with rounded corners.

    Args:
        frame: PIL Image to draw on
        top_left: (x, y) top-left corner
        bottom_right: (x, y) bottom-right corner
        radius: Corner radius
        fill_color: RGB fill color (None for no fill)
        outline_color: RGB outline color (None for no outline)
        outline_width: Outline width

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x1, y1 = top_left
    x2, y2 = bottom_right

    # Draw rounded rectangle using PIL's built-in method
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius,
                          fill=fill_color, outline=outline_color, width=outline_width)

    return frame


def add_vignette(frame: Image.Image, strength: float = 0.5) -> Image.Image:
    """
    Add a vignette effect (darkened edges) to frame.

    Args:
        frame: PIL Image
        strength: Vignette strength (0.0-1.0)

    Returns:
        Frame with vignette
    """
    width, height = frame.size

    # Create radial gradient mask
    center_x, center_y = width // 2, height // 2
    max_dist = ((width / 2) ** 2 + (height / 2) ** 2) ** 0.5

    # Create overlay
    overlay = Image.new('RGB', (width, height), (0, 0, 0))
    pixels = overlay.load()

    for y in range(height):
        for x in range(width):
            # Calculate distance from center
            dx = x - center_x
            dy = y - center_y
            dist = (dx ** 2 + dy ** 2) ** 0.5

            # Calculate vignette value
            vignette = min(1, (dist / max_dist) * strength)
            value = int(255 * (1 - vignette))
            pixels[x, y] = (value, value, value)

    # Blend with original using multiply
    frame_array = np.array(frame, dtype=np.float32) / 255
    overlay_array = np.array(overlay, dtype=np.float32) / 255

    result = frame_array * overlay_array
    result = (result * 255).astype(np.uint8)

    return Image.fromarray(result)


def draw_star(frame: Image.Image, center: tuple[int, int], size: int,
             fill_color: tuple[int, int, int],
             outline_color: Optional[tuple[int, int, int]] = None,
             outline_width: int = 1) -> Image.Image:
    """
    Draw a 5-pointed star.

    Args:
        frame: PIL Image to draw on
        center: (x, y) center position
        size: Star size (outer radius)
        fill_color: RGB fill color
        outline_color: RGB outline color (None for no outline)
        outline_width: Outline width

    Returns:
        Modified frame
    """
    import math
    draw = ImageDraw.Draw(frame)
    x, y = center

    # Calculate star points
    points = []
    for i in range(10):
        angle = (i * 36 - 90) * math.pi / 180  # 36 degrees per point, start at top
        radius = size if i % 2 == 0 else size * 0.4  # Alternate between outer and inner
        px = x + radius * math.cos(angle)
        py = y + radius * math.sin(angle)
        points.append((px, py))

    # Draw star
    draw.polygon(points, fill=fill_color, outline=outline_color, width=outline_width)

    return frame