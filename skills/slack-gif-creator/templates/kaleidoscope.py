#!/usr/bin/env python3
"""
Kaleidoscope Effect - Create mirror/rotation effects.

Apply kaleidoscope effects to frames or objects for psychedelic visuals.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image, ImageOps, ImageDraw
import numpy as np


def apply_kaleidoscope(frame: Image.Image, segments: int = 8,
                       center: tuple[int, int] | None = None) -> Image.Image:
    """
    Apply kaleidoscope effect by mirroring/rotating frame sections.

    Args:
        frame: Input frame
        segments: Number of mirror segments (4, 6, 8, 12 work well)
        center: Center point for effect (None = frame center)

    Returns:
        Frame with kaleidoscope effect
    """
    width, height = frame.size

    if center is None:
        center = (width // 2, height // 2)

    # Create output frame
    output = Image.new('RGB', (width, height))

    # Calculate angle per segment
    angle_per_segment = 360 / segments

    # For simplicity, we'll create a radial mirror effect
    # A full implementation would rotate and mirror properly
    # This is a simplified version that creates interesting patterns

    # Convert to numpy for easier manipulation
    frame_array = np.array(frame)
    output_array = np.zeros_like(frame_array)

    center_x, center_y = center

    # Create wedge mask and mirror it
    for y in range(height):
        for x in range(width):
            # Calculate angle from center
            dx = x - center_x
            dy = y - center_y

            angle = (math.degrees(math.atan2(dy, dx)) + 180) % 360
            distance = math.sqrt(dx * dx + dy * dy)

            # Which segment does this pixel belong to?
            segment = int(angle / angle_per_segment)

            # Mirror angle within segment
            segment_angle = angle % angle_per_segment
            if segment % 2 == 1:  # Mirror every other segment
                segment_angle = angle_per_segment - segment_angle

            # Calculate source position
            source_angle = segment_angle + (segment // 2) * angle_per_segment * 2
            source_angle_rad = math.radians(source_angle - 180)

            source_x = int(center_x + distance * math.cos(source_angle_rad))
            source_y = int(center_y + distance * math.sin(source_angle_rad))

            # Bounds check
            if 0 <= source_x < width and 0 <= source_y < height:
                output_array[y, x] = frame_array[source_y, source_x]
            else:
                output_array[y, x] = frame_array[y, x]

    return Image.fromarray(output_array)


def apply_simple_mirror(frame: Image.Image, mode: str = 'quad') -> Image.Image:
    """
    Apply simple mirror effect (faster than full kaleidoscope).

    Args:
        frame: Input frame
        mode: 'horizontal', 'vertical', 'quad' (4-way), 'radial'

    Returns:
        Mirrored frame
    """
    width, height = frame.size
    center_x, center_y = width // 2, height // 2

    if mode == 'horizontal':
        # Mirror left half to right
        left_half = frame.crop((0, 0, center_x, height))
        left_flipped = ImageOps.mirror(left_half)
        result = frame.copy()
        result.paste(left_flipped, (center_x, 0))
        return result

    elif mode == 'vertical':
        # Mirror top half to bottom
        top_half = frame.crop((0, 0, width, center_y))
        top_flipped = ImageOps.flip(top_half)
        result = frame.copy()
        result.paste(top_flipped, (0, center_y))
        return result

    elif mode == 'quad':
        # 4-way mirror (top-left quadrant mirrored to all)
        quad = frame.crop((0, 0, center_x, center_y))

        result = Image.new('RGB', (width, height))

        # Top-left (original)
        result.paste(quad, (0, 0))

        # Top-right (horizontal mirror)
        result.paste(ImageOps.mirror(quad), (center_x, 0))

        # Bottom-left (vertical mirror)
        result.paste(ImageOps.flip(quad), (0, center_y))

        # Bottom-right (both mirrors)
        result.paste(ImageOps.flip(ImageOps.mirror(quad)), (center_x, center_y))

        return result

    else:
        return frame


def create_kaleidoscope_animation(
    base_frame: Image.Image | None = None,
    num_frames: int = 30,
    segments: int = 8,
    rotation_speed: float = 1.0,
    width: int = 480,
    height: int = 480
) -> list[Image.Image]:
    """
    Create animated kaleidoscope effect.

    Args:
        base_frame: Frame to apply effect to (or None for demo pattern)
        num_frames: Number of frames
        segments: Kaleidoscope segments
        rotation_speed: How fast pattern rotates (0.5-2.0)
        width: Frame width if generating demo
        height: Frame height if generating demo

    Returns:
        List of frames with kaleidoscope effect
    """
    frames = []

    # Create demo pattern if no base frame
    if base_frame is None:
        base_frame = Image.new('RGB', (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(base_frame)

        # Draw some colored shapes
        from core.color_palettes import get_palette
        palette = get_palette('vibrant')

        colors = [palette['primary'], palette['secondary'], palette['accent']]

        for i, color in enumerate(colors):
            x = width // 2 + int(100 * math.cos(i * 2 * math.pi / 3))
            y = height // 2 + int(100 * math.sin(i * 2 * math.pi / 3))
            draw.ellipse([x - 40, y - 40, x + 40, y + 40], fill=color)

    # Rotate base frame and apply kaleidoscope
    for i in range(num_frames):
        angle = (i / num_frames) * 360 * rotation_speed

        # Rotate base frame
        rotated = base_frame.rotate(angle, resample=Image.BICUBIC)

        # Apply kaleidoscope
        kaleido_frame = apply_kaleidoscope(rotated, segments=segments)

        frames.append(kaleido_frame)

    return frames


# Example usage
if __name__ == '__main__':
    from core.gif_builder import GIFBuilder

    print("Creating kaleidoscope GIF...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Create kaleidoscope animation
    frames = create_kaleidoscope_animation(
        num_frames=40,
        segments=8,
        rotation_speed=0.5
    )

    builder.add_frames(frames)
    builder.save('kaleidoscope_test.gif', num_colors=128)
