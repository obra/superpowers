#!/usr/bin/env python3
"""
Morph Animation - Transform between different emojis or shapes.

Creates smooth transitions and transformations.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
import numpy as np
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced, draw_circle
from core.easing import interpolate


def create_morph_animation(
    object1_data: dict,
    object2_data: dict,
    num_frames: int = 30,
    morph_type: str = 'crossfade',  # 'crossfade', 'scale', 'spin_morph'
    easing: str = 'ease_in_out',
    object_type: str = 'emoji',
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create morphing animation between two objects.

    Args:
        object1_data: First object configuration
        object2_data: Second object configuration
        num_frames: Number of frames
        morph_type: Type of morph effect
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
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        if morph_type == 'crossfade':
            # Simple crossfade between two objects
            opacity1 = interpolate(1, 0, t, easing)
            opacity2 = interpolate(0, 1, t, easing)

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

                # Apply opacity
                from templates.fade import apply_opacity
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

            elif object_type == 'circle':
                # Morph between two circles
                radius1 = object1_data['radius']
                radius2 = object2_data['radius']
                color1 = object1_data['color']
                color2 = object2_data['color']

                # Interpolate properties
                current_radius = int(interpolate(radius1, radius2, t, easing))
                current_color = tuple(
                    int(interpolate(color1[i], color2[i], t, easing))
                    for i in range(3)
                )

                draw_circle(frame, center_pos, current_radius, fill_color=current_color)

        elif morph_type == 'scale':
            # First object scales down as second scales up
            if object_type == 'emoji':
                scale1 = interpolate(1.0, 0.0, t, easing)
                scale2 = interpolate(0.0, 1.0, t, easing)

                # Draw first emoji (shrinking)
                if scale1 > 0.05:
                    size1 = int(object1_data['size'] * scale1)
                    size1 = max(12, size1)
                    emoji1_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
                    draw_emoji_enhanced(
                        emoji1_canvas,
                        emoji=object1_data['emoji'],
                        position=(center_pos[0] - size1 // 2, center_pos[1] - size1 // 2),
                        size=size1,
                        shadow=False
                    )

                    frame_rgba = frame.convert('RGBA')
                    frame = Image.alpha_composite(frame_rgba, emoji1_canvas)
                    frame = frame.convert('RGB')

                # Draw second emoji (growing)
                if scale2 > 0.05:
                    size2 = int(object2_data['size'] * scale2)
                    size2 = max(12, size2)
                    emoji2_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
                    draw_emoji_enhanced(
                        emoji2_canvas,
                        emoji=object2_data['emoji'],
                        position=(center_pos[0] - size2 // 2, center_pos[1] - size2 // 2),
                        size=size2,
                        shadow=False
                    )

                    frame_rgba = frame.convert('RGBA')
                    frame = Image.alpha_composite(frame_rgba, emoji2_canvas)
                    frame = frame.convert('RGB')

        elif morph_type == 'spin_morph':
            # Spin while morphing (flip-like)
            import math

            # Calculate rotation (0 to 180 degrees)
            angle = interpolate(0, 180, t, easing)
            scale_factor = abs(math.cos(math.radians(angle)))

            # Determine which object to show
            if angle < 90:
                current_object = object1_data
            else:
                current_object = object2_data

            # Skip when edge-on
            if scale_factor < 0.05:
                frames.append(frame)
                continue

            if object_type == 'emoji':
                size = current_object['size']
                canvas_size = size * 2
                emoji_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

                draw_emoji_enhanced(
                    emoji_canvas,
                    emoji=current_object['emoji'],
                    position=(canvas_size // 2 - size // 2, canvas_size // 2 - size // 2),
                    size=size,
                    shadow=False
                )

                # Scale horizontally for spin effect
                new_width = max(1, int(canvas_size * scale_factor))
                emoji_scaled = emoji_canvas.resize((new_width, canvas_size), Image.LANCZOS)

                paste_x = center_pos[0] - new_width // 2
                paste_y = center_pos[1] - canvas_size // 2

                frame_rgba = frame.convert('RGBA')
                frame_rgba.paste(emoji_scaled, (paste_x, paste_y), emoji_scaled)
                frame = frame_rgba.convert('RGB')

        frames.append(frame)

    return frames


def create_reaction_morph(
    emoji_start: str,
    emoji_end: str,
    num_frames: int = 20,
    frame_size: int = 128
) -> list[Image.Image]:
    """
    Create quick emoji reaction morph (for emoji GIFs).

    Args:
        emoji_start: Starting emoji
        emoji_end: Ending emoji
        num_frames: Number of frames
        frame_size: Frame size (square)

    Returns:
        List of frames
    """
    return create_morph_animation(
        object1_data={'emoji': emoji_start, 'size': 80},
        object2_data={'emoji': emoji_end, 'size': 80},
        num_frames=num_frames,
        morph_type='crossfade',
        easing='ease_in_out',
        object_type='emoji',
        center_pos=(frame_size // 2, frame_size // 2),
        frame_width=frame_size,
        frame_height=frame_size,
        bg_color=(255, 255, 255)
    )


def create_shape_morph(
    shapes: list[dict],
    num_frames: int = 60,
    frames_per_shape: int = 20,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Morph through a sequence of shapes.

    Args:
        shapes: List of shape dicts with 'radius' and 'color'
        num_frames: Total number of frames
        frames_per_shape: Frames to spend on each morph
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []
    center = (frame_width // 2, frame_height // 2)

    for i in range(num_frames):
        # Determine which shapes we're morphing between
        cycle_progress = (i % (frames_per_shape * len(shapes))) / frames_per_shape
        shape_idx = int(cycle_progress) % len(shapes)
        next_shape_idx = (shape_idx + 1) % len(shapes)

        # Progress between these two shapes
        t = cycle_progress - shape_idx

        shape1 = shapes[shape_idx]
        shape2 = shapes[next_shape_idx]

        # Interpolate properties
        radius = int(interpolate(shape1['radius'], shape2['radius'], t, 'ease_in_out'))
        color = tuple(
            int(interpolate(shape1['color'][j], shape2['color'][j], t, 'ease_in_out'))
            for j in range(3)
        )

        # Draw frame
        frame = create_blank_frame(frame_width, frame_height, bg_color)
        draw_circle(frame, center, radius, fill_color=color)

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating morph animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Crossfade morph
    frames = create_morph_animation(
        object1_data={'emoji': '😊', 'size': 100},
        object2_data={'emoji': '😂', 'size': 100},
        num_frames=30,
        morph_type='crossfade',
        object_type='emoji'
    )
    builder.add_frames(frames)
    builder.save('morph_crossfade.gif', num_colors=128)

    # Example 2: Scale morph
    builder.clear()
    frames = create_morph_animation(
        object1_data={'emoji': '🌙', 'size': 100},
        object2_data={'emoji': '☀️', 'size': 100},
        num_frames=40,
        morph_type='scale',
        object_type='emoji'
    )
    builder.add_frames(frames)
    builder.save('morph_scale.gif', num_colors=128)

    # Example 3: Shape morph cycle
    builder.clear()
    from core.color_palettes import get_palette
    palette = get_palette('vibrant')

    shapes = [
        {'radius': 60, 'color': palette['primary']},
        {'radius': 80, 'color': palette['secondary']},
        {'radius': 50, 'color': palette['accent']},
        {'radius': 70, 'color': palette['success']}
    ]
    frames = create_shape_morph(shapes, num_frames=80, frames_per_shape=20)
    builder.add_frames(frames)
    builder.save('morph_shapes.gif', num_colors=64)

    print("Created morph animations!")
