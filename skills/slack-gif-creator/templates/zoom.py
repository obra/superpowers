#!/usr/bin/env python3
"""
Zoom Animation - Scale objects dramatically for emphasis.

Creates zoom in, zoom out, and dramatic scaling effects.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image, ImageFilter
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.easing import interpolate


def create_zoom_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    zoom_type: str = 'in',  # 'in', 'out', 'in_out', 'punch'
    scale_range: tuple[float, float] = (0.1, 2.0),
    easing: str = 'ease_out',
    add_motion_blur: bool = False,
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create zoom animation.

    Args:
        object_type: 'emoji', 'text', 'image'
        object_data: Object configuration
        num_frames: Number of frames
        zoom_type: Type of zoom effect
        scale_range: (start_scale, end_scale) tuple
        easing: Easing function
        add_motion_blur: Add blur for speed effect
        center_pos: Center position
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    # Default object data
    if object_data is None:
        if object_type == 'emoji':
            object_data = {'emoji': '🔍', 'size': 100}

    base_size = object_data.get('size', 100) if object_type == 'emoji' else object_data.get('font_size', 60)
    start_scale, end_scale = scale_range

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate scale based on zoom type
        if zoom_type == 'in':
            scale = interpolate(start_scale, end_scale, t, easing)
        elif zoom_type == 'out':
            scale = interpolate(end_scale, start_scale, t, easing)
        elif zoom_type == 'in_out':
            if t < 0.5:
                scale = interpolate(start_scale, end_scale, t * 2, easing)
            else:
                scale = interpolate(end_scale, start_scale, (t - 0.5) * 2, easing)
        elif zoom_type == 'punch':
            # Quick zoom in with overshoot then settle
            if t < 0.3:
                scale = interpolate(start_scale, end_scale * 1.2, t / 0.3, 'ease_out')
            else:
                scale = interpolate(end_scale * 1.2, end_scale, (t - 0.3) / 0.7, 'elastic_out')
        else:
            scale = interpolate(start_scale, end_scale, t, easing)

        # Create frame
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        if object_type == 'emoji':
            current_size = int(base_size * scale)

            # Clamp size to reasonable bounds
            current_size = max(12, min(current_size, frame_width * 2))

            # Create emoji on transparent background
            canvas_size = max(frame_width, frame_height, current_size) * 2
            emoji_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

            draw_emoji_enhanced(
                emoji_canvas,
                emoji=object_data['emoji'],
                position=(canvas_size // 2 - current_size // 2, canvas_size // 2 - current_size // 2),
                size=current_size,
                shadow=False
            )

            # Optional motion blur for fast zooms
            if add_motion_blur and abs(scale - 1.0) > 0.5:
                blur_amount = min(5, int(abs(scale - 1.0) * 3))
                emoji_canvas = emoji_canvas.filter(ImageFilter.GaussianBlur(blur_amount))

            # Crop to frame size centered
            left = (canvas_size - frame_width) // 2
            top = (canvas_size - frame_height) // 2
            emoji_cropped = emoji_canvas.crop((left, top, left + frame_width, top + frame_height))

            # Composite
            frame_rgba = frame.convert('RGBA')
            frame = Image.alpha_composite(frame_rgba, emoji_cropped)
            frame = frame.convert('RGB')

        elif object_type == 'text':
            from core.typography import draw_text_with_outline

            current_size = int(base_size * scale)
            current_size = max(10, min(current_size, 500))

            # Create oversized canvas for large text
            canvas_size = max(frame_width, frame_height, current_size * 10)
            text_canvas = Image.new('RGB', (canvas_size, canvas_size), bg_color)

            draw_text_with_outline(
                text_canvas,
                text=object_data.get('text', 'ZOOM'),
                position=(canvas_size // 2, canvas_size // 2),
                font_size=current_size,
                text_color=object_data.get('text_color', (0, 0, 0)),
                outline_color=object_data.get('outline_color', (255, 255, 255)),
                outline_width=max(2, int(current_size * 0.05)),
                centered=True
            )

            # Crop to frame
            left = (canvas_size - frame_width) // 2
            top = (canvas_size - frame_height) // 2
            frame = text_canvas.crop((left, top, left + frame_width, top + frame_height))

        frames.append(frame)

    return frames


def create_explosion_zoom(
    emoji: str = '💥',
    num_frames: int = 20,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create dramatic explosion zoom effect.

    Args:
        emoji: Emoji to explode
        num_frames: Number of frames
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Exponential zoom
        scale = 0.1 * math.exp(t * 5)

        # Add rotation for drama
        angle = t * 360 * 2

        frame = create_blank_frame(frame_width, frame_height, bg_color)

        current_size = int(100 * scale)
        current_size = max(12, min(current_size, frame_width * 3))

        # Create emoji
        canvas_size = max(frame_width, frame_height, current_size) * 2
        emoji_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

        draw_emoji_enhanced(
            emoji_canvas,
            emoji=emoji,
            position=(canvas_size // 2 - current_size // 2, canvas_size // 2 - current_size // 2),
            size=current_size,
            shadow=False
        )

        # Rotate
        emoji_canvas = emoji_canvas.rotate(angle, center=(canvas_size // 2, canvas_size // 2), resample=Image.BICUBIC)

        # Add motion blur for later frames
        if t > 0.5:
            blur_amount = int((t - 0.5) * 10)
            emoji_canvas = emoji_canvas.filter(ImageFilter.GaussianBlur(blur_amount))

        # Crop and composite
        left = (canvas_size - frame_width) // 2
        top = (canvas_size - frame_height) // 2
        emoji_cropped = emoji_canvas.crop((left, top, left + frame_width, top + frame_height))

        frame_rgba = frame.convert('RGBA')
        frame = Image.alpha_composite(frame_rgba, emoji_cropped)
        frame = frame.convert('RGB')

        frames.append(frame)

    return frames


def create_mind_blown_zoom(
    emoji: str = '🤯',
    num_frames: int = 30,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create "mind blown" dramatic zoom with shake.

    Args:
        emoji: Emoji to use
        num_frames: Number of frames
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Zoom in then shake
        if t < 0.5:
            scale = interpolate(0.3, 1.2, t * 2, 'ease_out')
            shake_x = 0
            shake_y = 0
        else:
            scale = 1.2
            # Shake intensifies
            shake_intensity = (t - 0.5) * 40
            shake_x = int(math.sin(t * 50) * shake_intensity)
            shake_y = int(math.cos(t * 45) * shake_intensity)

        frame = create_blank_frame(frame_width, frame_height, bg_color)

        current_size = int(100 * scale)
        center_x = frame_width // 2 + shake_x
        center_y = frame_height // 2 + shake_y

        emoji_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
        draw_emoji_enhanced(
            emoji_canvas,
            emoji=emoji,
            position=(center_x - current_size // 2, center_y - current_size // 2),
            size=current_size,
            shadow=False
        )

        frame_rgba = frame.convert('RGBA')
        frame = Image.alpha_composite(frame_rgba, emoji_canvas)
        frame = frame.convert('RGB')

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating zoom animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Zoom in
    frames = create_zoom_animation(
        object_type='emoji',
        object_data={'emoji': '🔍', 'size': 100},
        num_frames=30,
        zoom_type='in',
        scale_range=(0.1, 1.5),
        easing='ease_out'
    )
    builder.add_frames(frames)
    builder.save('zoom_in.gif', num_colors=128)

    # Example 2: Explosion zoom
    builder.clear()
    frames = create_explosion_zoom(emoji='💥', num_frames=20)
    builder.add_frames(frames)
    builder.save('zoom_explosion.gif', num_colors=128)

    # Example 3: Mind blown
    builder.clear()
    frames = create_mind_blown_zoom(emoji='🤯', num_frames=30)
    builder.add_frames(frames)
    builder.save('zoom_mind_blown.gif', num_colors=128)

    print("Created zoom animations!")
