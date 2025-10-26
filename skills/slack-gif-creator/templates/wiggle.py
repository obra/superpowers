#!/usr/bin/env python3
"""
Wiggle Animation - Smooth, organic wobbling and jiggling motions.

Creates playful, elastic movements that are smoother than shake.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.easing import interpolate


def create_wiggle_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    wiggle_type: str = 'jello',  # 'jello', 'wave', 'bounce', 'sway'
    intensity: float = 1.0,
    cycles: float = 2.0,
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create wiggle/wobble animation.

    Args:
        object_type: 'emoji', 'text'
        object_data: Object configuration
        num_frames: Number of frames
        wiggle_type: Type of wiggle motion
        intensity: Wiggle intensity multiplier
        cycles: Number of wiggle cycles
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
            object_data = {'emoji': '🎈', 'size': 100}

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        # Calculate wiggle transformations
        offset_x = 0
        offset_y = 0
        rotation = 0
        scale_x = 1.0
        scale_y = 1.0

        if wiggle_type == 'jello':
            # Jello wobble - multiple frequencies
            freq1 = cycles * 2 * math.pi
            freq2 = cycles * 3 * math.pi
            freq3 = cycles * 5 * math.pi

            decay = 1.0 - t if cycles < 1.5 else 1.0  # Decay for single wiggles

            offset_x = (
                math.sin(freq1 * t) * 15 +
                math.sin(freq2 * t) * 8 +
                math.sin(freq3 * t) * 3
            ) * intensity * decay

            rotation = (
                math.sin(freq1 * t) * 10 +
                math.cos(freq2 * t) * 5
            ) * intensity * decay

            # Squash and stretch
            scale_y = 1.0 + math.sin(freq1 * t) * 0.1 * intensity * decay
            scale_x = 1.0 / scale_y  # Preserve volume

        elif wiggle_type == 'wave':
            # Wave motion
            freq = cycles * 2 * math.pi
            offset_y = math.sin(freq * t) * 20 * intensity
            rotation = math.sin(freq * t + math.pi / 4) * 8 * intensity

        elif wiggle_type == 'bounce':
            # Bouncy wiggle
            freq = cycles * 2 * math.pi
            bounce = abs(math.sin(freq * t))

            scale_y = 1.0 + bounce * 0.2 * intensity
            scale_x = 1.0 - bounce * 0.1 * intensity
            offset_y = -bounce * 10 * intensity

        elif wiggle_type == 'sway':
            # Gentle sway back and forth
            freq = cycles * 2 * math.pi
            offset_x = math.sin(freq * t) * 25 * intensity
            rotation = math.sin(freq * t) * 12 * intensity

            # Subtle scale change
            scale = 1.0 + math.sin(freq * t) * 0.05 * intensity
            scale_x = scale
            scale_y = scale

        elif wiggle_type == 'tail_wag':
            # Like a wagging tail - base stays, tip moves
            freq = cycles * 2 * math.pi
            wag = math.sin(freq * t) * intensity

            # Rotation focused at one end
            rotation = wag * 20
            offset_x = wag * 15

        # Apply transformations
        if object_type == 'emoji':
            size = object_data['size']
            size_x = int(size * scale_x)
            size_y = int(size * scale_y)

            # For non-uniform scaling or rotation, we need to use PIL transforms
            if abs(scale_x - scale_y) > 0.01 or abs(rotation) > 0.1:
                # Create emoji on transparent canvas
                canvas_size = int(size * 2)
                emoji_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

                # Draw emoji
                draw_emoji_enhanced(
                    emoji_canvas,
                    emoji=object_data['emoji'],
                    position=(canvas_size // 2 - size // 2, canvas_size // 2 - size // 2),
                    size=size,
                    shadow=False
                )

                # Scale
                if abs(scale_x - scale_y) > 0.01:
                    new_size = (int(canvas_size * scale_x), int(canvas_size * scale_y))
                    emoji_canvas = emoji_canvas.resize(new_size, Image.LANCZOS)
                    canvas_size_x, canvas_size_y = new_size
                else:
                    canvas_size_x = canvas_size_y = canvas_size

                # Rotate
                if abs(rotation) > 0.1:
                    emoji_canvas = emoji_canvas.rotate(
                        rotation,
                        resample=Image.BICUBIC,
                        expand=False
                    )

                # Position with offset
                paste_x = int(center_pos[0] - canvas_size_x // 2 + offset_x)
                paste_y = int(center_pos[1] - canvas_size_y // 2 + offset_y)

                frame_rgba = frame.convert('RGBA')
                frame_rgba.paste(emoji_canvas, (paste_x, paste_y), emoji_canvas)
                frame = frame_rgba.convert('RGB')
            else:
                # Simple case - just offset
                pos_x = int(center_pos[0] - size // 2 + offset_x)
                pos_y = int(center_pos[1] - size // 2 + offset_y)
                draw_emoji_enhanced(
                    frame,
                    emoji=object_data['emoji'],
                    position=(pos_x, pos_y),
                    size=size,
                    shadow=object_data.get('shadow', True)
                )

        elif object_type == 'text':
            from core.typography import draw_text_with_outline

            # Create text on canvas for transformation
            canvas_size = max(frame_width, frame_height)
            text_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

            # Convert to RGB for drawing
            text_canvas_rgb = text_canvas.convert('RGB')
            text_canvas_rgb.paste(bg_color, (0, 0, canvas_size, canvas_size))

            draw_text_with_outline(
                text_canvas_rgb,
                text=object_data.get('text', 'WIGGLE'),
                position=(canvas_size // 2, canvas_size // 2),
                font_size=object_data.get('font_size', 50),
                text_color=object_data.get('text_color', (0, 0, 0)),
                outline_color=object_data.get('outline_color', (255, 255, 255)),
                outline_width=3,
                centered=True
            )

            # Make transparent
            text_canvas = text_canvas_rgb.convert('RGBA')
            data = text_canvas.getdata()
            new_data = []
            for item in data:
                if item[:3] == bg_color:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            text_canvas.putdata(new_data)

            # Apply rotation
            if abs(rotation) > 0.1:
                text_canvas = text_canvas.rotate(rotation, center=(canvas_size // 2, canvas_size // 2), resample=Image.BICUBIC)

            # Crop to frame with offset
            left = (canvas_size - frame_width) // 2 - int(offset_x)
            top = (canvas_size - frame_height) // 2 - int(offset_y)
            text_cropped = text_canvas.crop((left, top, left + frame_width, top + frame_height))

            frame_rgba = frame.convert('RGBA')
            frame = Image.alpha_composite(frame_rgba, text_cropped)
            frame = frame.convert('RGB')

        frames.append(frame)

    return frames


def create_excited_wiggle(
    emoji: str = '🎉',
    num_frames: int = 20,
    frame_size: int = 128
) -> list[Image.Image]:
    """
    Create excited wiggle for emoji GIFs.

    Args:
        emoji: Emoji to wiggle
        num_frames: Number of frames
        frame_size: Frame size (square)

    Returns:
        List of frames
    """
    return create_wiggle_animation(
        object_type='emoji',
        object_data={'emoji': emoji, 'size': 80, 'shadow': False},
        num_frames=num_frames,
        wiggle_type='jello',
        intensity=0.8,
        cycles=2,
        center_pos=(frame_size // 2, frame_size // 2),
        frame_width=frame_size,
        frame_height=frame_size,
        bg_color=(255, 255, 255)
    )


# Example usage
if __name__ == '__main__':
    print("Creating wiggle animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Jello wiggle
    frames = create_wiggle_animation(
        object_type='emoji',
        object_data={'emoji': '🎈', 'size': 100},
        num_frames=40,
        wiggle_type='jello',
        intensity=1.0,
        cycles=2
    )
    builder.add_frames(frames)
    builder.save('wiggle_jello.gif', num_colors=128)

    # Example 2: Wave
    builder.clear()
    frames = create_wiggle_animation(
        object_type='emoji',
        object_data={'emoji': '🌊', 'size': 100},
        num_frames=30,
        wiggle_type='wave',
        intensity=1.2,
        cycles=3
    )
    builder.add_frames(frames)
    builder.save('wiggle_wave.gif', num_colors=128)

    # Example 3: Excited wiggle (emoji size)
    builder = GIFBuilder(width=128, height=128, fps=15)
    frames = create_excited_wiggle(emoji='🎉', num_frames=20)
    builder.add_frames(frames)
    builder.save('wiggle_excited.gif', num_colors=48, optimize_for_emoji=True)

    print("Created wiggle animations!")
