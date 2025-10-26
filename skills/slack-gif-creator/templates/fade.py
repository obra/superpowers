#!/usr/bin/env python3
"""
Fade Animation - Fade in, fade out, and crossfade effects.

Creates smooth opacity transitions for appearing, disappearing, and transitioning.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image, ImageDraw
import numpy as np
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.easing import interpolate


def create_fade_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    fade_type: str = 'in',  # 'in', 'out', 'in_out', 'blink'
    easing: str = 'ease_in_out',
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create fade animation.

    Args:
        object_type: 'emoji', 'text', 'image'
        object_data: Object configuration
        num_frames: Number of frames
        fade_type: Type of fade effect
        easing: Easing function
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
            object_data = {'emoji': '✨', 'size': 100}

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate opacity based on fade type
        if fade_type == 'in':
            opacity = interpolate(0, 1, t, easing)
        elif fade_type == 'out':
            opacity = interpolate(1, 0, t, easing)
        elif fade_type == 'in_out':
            if t < 0.5:
                opacity = interpolate(0, 1, t * 2, easing)
            else:
                opacity = interpolate(1, 0, (t - 0.5) * 2, easing)
        elif fade_type == 'blink':
            # Quick fade out and back in
            if t < 0.2:
                opacity = interpolate(1, 0, t / 0.2, 'ease_in')
            elif t < 0.4:
                opacity = interpolate(0, 1, (t - 0.2) / 0.2, 'ease_out')
            else:
                opacity = 1.0
        else:
            opacity = interpolate(0, 1, t, easing)

        # Create background
        frame_bg = create_blank_frame(frame_width, frame_height, bg_color)

        # Create object layer with transparency
        if object_type == 'emoji':
            # Create RGBA canvas for emoji
            emoji_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            emoji_size = object_data['size']
            draw_emoji_enhanced(
                emoji_canvas,
                emoji=object_data['emoji'],
                position=(center_pos[0] - emoji_size // 2, center_pos[1] - emoji_size // 2),
                size=emoji_size,
                shadow=object_data.get('shadow', False)
            )

            # Apply opacity
            emoji_canvas = apply_opacity(emoji_canvas, opacity)

            # Composite onto background
            frame_bg_rgba = frame_bg.convert('RGBA')
            frame = Image.alpha_composite(frame_bg_rgba, emoji_canvas)
            frame = frame.convert('RGB')

        elif object_type == 'text':
            from core.typography import draw_text_with_outline

            # Create text on separate layer
            text_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            text_canvas_rgb = text_canvas.convert('RGB')
            text_canvas_rgb.paste(bg_color, (0, 0, frame_width, frame_height))

            draw_text_with_outline(
                text_canvas_rgb,
                text=object_data.get('text', 'FADE'),
                position=center_pos,
                font_size=object_data.get('font_size', 60),
                text_color=object_data.get('text_color', (0, 0, 0)),
                outline_color=object_data.get('outline_color', (255, 255, 255)),
                outline_width=3,
                centered=True
            )

            # Convert to RGBA and make background transparent
            text_canvas = text_canvas_rgb.convert('RGBA')
            data = text_canvas.getdata()
            new_data = []
            for item in data:
                if item[:3] == bg_color:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            text_canvas.putdata(new_data)

            # Apply opacity
            text_canvas = apply_opacity(text_canvas, opacity)

            # Composite
            frame_bg_rgba = frame_bg.convert('RGBA')
            frame = Image.alpha_composite(frame_bg_rgba, text_canvas)
            frame = frame.convert('RGB')

        else:
            frame = frame_bg

        frames.append(frame)

    return frames


def apply_opacity(image: Image.Image, opacity: float) -> Image.Image:
    """
    Apply opacity to an RGBA image.

    Args:
        image: RGBA image
        opacity: Opacity value (0.0 to 1.0)

    Returns:
        Image with adjusted opacity
    """
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    # Get alpha channel
    r, g, b, a = image.split()

    # Multiply alpha by opacity
    a_array = np.array(a, dtype=np.float32)
    a_array = a_array * opacity
    a = Image.fromarray(a_array.astype(np.uint8))

    # Merge back
    return Image.merge('RGBA', (r, g, b, a))


def create_crossfade(
    object1_data: dict,
    object2_data: dict,
    num_frames: int = 30,
    easing: str = 'ease_in_out',
    object_type: str = 'emoji',
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Crossfade between two objects.

    Args:
        object1_data: First object configuration
        object2_data: Second object configuration
        num_frames: Number of frames
        easing: Easing function
        object_type: Type of objects
        center_pos: Center position
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate opacities
        opacity1 = interpolate(1, 0, t, easing)
        opacity2 = interpolate(0, 1, t, easing)

        # Create background
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        if object_type == 'emoji':
            # Create first emoji
            emoji1_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            size1 = object1_data['size']
            draw_emoji_enhanced(
                emoji1_canvas,
                emoji=object1_data['emoji'],
                position=(center_pos[0] - size1 // 2, center_pos[1] - size1 // 2),
                size=size1,
                shadow=False
            )
            emoji1_canvas = apply_opacity(emoji1_canvas, opacity1)

            # Create second emoji
            emoji2_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            size2 = object2_data['size']
            draw_emoji_enhanced(
                emoji2_canvas,
                emoji=object2_data['emoji'],
                position=(center_pos[0] - size2 // 2, center_pos[1] - size2 // 2),
                size=size2,
                shadow=False
            )
            emoji2_canvas = apply_opacity(emoji2_canvas, opacity2)

            # Composite both
            frame_rgba = frame.convert('RGBA')
            frame_rgba = Image.alpha_composite(frame_rgba, emoji1_canvas)
            frame_rgba = Image.alpha_composite(frame_rgba, emoji2_canvas)
            frame = frame_rgba.convert('RGB')

        frames.append(frame)

    return frames


def create_fade_to_color(
    start_color: tuple[int, int, int],
    end_color: tuple[int, int, int],
    num_frames: int = 20,
    easing: str = 'linear',
    frame_width: int = 480,
    frame_height: int = 480
) -> list[Image.Image]:
    """
    Fade from one solid color to another.

    Args:
        start_color: Starting RGB color
        end_color: Ending RGB color
        num_frames: Number of frames
        easing: Easing function
        frame_width: Frame width
        frame_height: Frame height

    Returns:
        List of frames
    """
    frames = []

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Interpolate each color channel
        r = int(interpolate(start_color[0], end_color[0], t, easing))
        g = int(interpolate(start_color[1], end_color[1], t, easing))
        b = int(interpolate(start_color[2], end_color[2], t, easing))

        color = (r, g, b)
        frame = create_blank_frame(frame_width, frame_height, color)
        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating fade animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Fade in
    frames = create_fade_animation(
        object_type='emoji',
        object_data={'emoji': '✨', 'size': 120},
        num_frames=30,
        fade_type='in',
        easing='ease_out'
    )
    builder.add_frames(frames)
    builder.save('fade_in.gif', num_colors=128)

    # Example 2: Crossfade
    builder.clear()
    frames = create_crossfade(
        object1_data={'emoji': '😊', 'size': 100},
        object2_data={'emoji': '😂', 'size': 100},
        num_frames=30,
        object_type='emoji'
    )
    builder.add_frames(frames)
    builder.save('fade_crossfade.gif', num_colors=128)

    # Example 3: Blink
    builder.clear()
    frames = create_fade_animation(
        object_type='emoji',
        object_data={'emoji': '👀', 'size': 100},
        num_frames=20,
        fade_type='blink'
    )
    builder.add_frames(frames)
    builder.save('fade_blink.gif', num_colors=128)

    print("Created fade animations!")
