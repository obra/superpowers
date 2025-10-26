#!/usr/bin/env python3
"""
Flip Animation - 3D-style card flip and rotation effects.

Creates horizontal and vertical flips with perspective.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.easing import interpolate


def create_flip_animation(
    object1_data: dict,
    object2_data: dict | None = None,
    num_frames: int = 30,
    flip_axis: str = 'horizontal',  # 'horizontal', 'vertical'
    easing: str = 'ease_in_out',
    object_type: str = 'emoji',
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create 3D-style flip animation.

    Args:
        object1_data: First object (front side)
        object2_data: Second object (back side, None = same as front)
        num_frames: Number of frames
        flip_axis: Axis to flip around
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

    if object2_data is None:
        object2_data = object1_data

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        # Calculate rotation angle (0 to 180 degrees)
        angle = interpolate(0, 180, t, easing)

        # Determine which side is visible and calculate scale
        if angle < 90:
            # Front side visible
            current_object = object1_data
            scale_factor = math.cos(math.radians(angle))
        else:
            # Back side visible
            current_object = object2_data
            scale_factor = abs(math.cos(math.radians(angle)))

        # Don't draw when edge-on (very thin)
        if scale_factor < 0.05:
            frames.append(frame)
            continue

        if object_type == 'emoji':
            size = current_object['size']

            # Create emoji on canvas
            canvas_size = size * 2
            emoji_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

            draw_emoji_enhanced(
                emoji_canvas,
                emoji=current_object['emoji'],
                position=(canvas_size // 2 - size // 2, canvas_size // 2 - size // 2),
                size=size,
                shadow=False
            )

            # Apply flip scaling
            if flip_axis == 'horizontal':
                # Scale horizontally for horizontal flip
                new_width = max(1, int(canvas_size * scale_factor))
                new_height = canvas_size
            else:
                # Scale vertically for vertical flip
                new_width = canvas_size
                new_height = max(1, int(canvas_size * scale_factor))

            # Resize to simulate 3D rotation
            emoji_scaled = emoji_canvas.resize((new_width, new_height), Image.LANCZOS)

            # Position centered
            paste_x = center_pos[0] - new_width // 2
            paste_y = center_pos[1] - new_height // 2

            # Composite onto frame
            frame_rgba = frame.convert('RGBA')
            frame_rgba.paste(emoji_scaled, (paste_x, paste_y), emoji_scaled)
            frame = frame_rgba.convert('RGB')

        elif object_type == 'text':
            from core.typography import draw_text_with_outline

            # Create text on canvas
            text = current_object.get('text', 'FLIP')
            font_size = current_object.get('font_size', 50)

            canvas_size = max(frame_width, frame_height)
            text_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

            # Draw on RGB for text rendering
            text_canvas_rgb = text_canvas.convert('RGB')
            text_canvas_rgb.paste(bg_color, (0, 0, canvas_size, canvas_size))

            draw_text_with_outline(
                text_canvas_rgb,
                text=text,
                position=(canvas_size // 2, canvas_size // 2),
                font_size=font_size,
                text_color=current_object.get('text_color', (0, 0, 0)),
                outline_color=current_object.get('outline_color', (255, 255, 255)),
                outline_width=3,
                centered=True
            )

            # Make background transparent
            text_canvas = text_canvas_rgb.convert('RGBA')
            data = text_canvas.getdata()
            new_data = []
            for item in data:
                if item[:3] == bg_color:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            text_canvas.putdata(new_data)

            # Apply flip scaling
            if flip_axis == 'horizontal':
                new_width = max(1, int(canvas_size * scale_factor))
                new_height = canvas_size
            else:
                new_width = canvas_size
                new_height = max(1, int(canvas_size * scale_factor))

            text_scaled = text_canvas.resize((new_width, new_height), Image.LANCZOS)

            # Center and crop
            if flip_axis == 'horizontal':
                left = (new_width - frame_width) // 2 if new_width > frame_width else 0
                top = (canvas_size - frame_height) // 2
                paste_x = center_pos[0] - min(new_width, frame_width) // 2
                paste_y = 0

                text_cropped = text_scaled.crop((
                    left,
                    top,
                    left + min(new_width, frame_width),
                    top + frame_height
                ))
            else:
                left = (canvas_size - frame_width) // 2
                top = (new_height - frame_height) // 2 if new_height > frame_height else 0
                paste_x = 0
                paste_y = center_pos[1] - min(new_height, frame_height) // 2

                text_cropped = text_scaled.crop((
                    left,
                    top,
                    left + frame_width,
                    top + min(new_height, frame_height)
                ))

            frame_rgba = frame.convert('RGBA')
            frame_rgba.paste(text_cropped, (paste_x, paste_y), text_cropped)
            frame = frame_rgba.convert('RGB')

        frames.append(frame)

    return frames


def create_quick_flip(
    emoji_front: str,
    emoji_back: str,
    num_frames: int = 20,
    frame_size: int = 128
) -> list[Image.Image]:
    """
    Create quick flip for emoji GIFs.

    Args:
        emoji_front: Front emoji
        emoji_back: Back emoji
        num_frames: Number of frames
        frame_size: Frame size (square)

    Returns:
        List of frames
    """
    return create_flip_animation(
        object1_data={'emoji': emoji_front, 'size': 80},
        object2_data={'emoji': emoji_back, 'size': 80},
        num_frames=num_frames,
        flip_axis='horizontal',
        easing='ease_in_out',
        object_type='emoji',
        center_pos=(frame_size // 2, frame_size // 2),
        frame_width=frame_size,
        frame_height=frame_size,
        bg_color=(255, 255, 255)
    )


def create_nope_flip(
    num_frames: int = 25,
    frame_width: int = 480,
    frame_height: int = 480
) -> list[Image.Image]:
    """
    Create "nope" reaction flip (like flipping table).

    Args:
        num_frames: Number of frames
        frame_width: Frame width
        frame_height: Frame height

    Returns:
        List of frames
    """
    return create_flip_animation(
        object1_data={'text': 'NOPE', 'font_size': 80, 'text_color': (255, 50, 50)},
        object2_data={'text': 'NOPE', 'font_size': 80, 'text_color': (255, 50, 50)},
        num_frames=num_frames,
        flip_axis='horizontal',
        easing='ease_out',
        object_type='text',
        frame_width=frame_width,
        frame_height=frame_height,
        bg_color=(255, 255, 255)
    )


# Example usage
if __name__ == '__main__':
    print("Creating flip animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Emoji flip
    frames = create_flip_animation(
        object1_data={'emoji': '😊', 'size': 120},
        object2_data={'emoji': '😂', 'size': 120},
        num_frames=30,
        flip_axis='horizontal',
        object_type='emoji'
    )
    builder.add_frames(frames)
    builder.save('flip_emoji.gif', num_colors=128)

    # Example 2: Text flip
    builder.clear()
    frames = create_flip_animation(
        object1_data={'text': 'YES', 'font_size': 80, 'text_color': (100, 200, 100)},
        object2_data={'text': 'NO', 'font_size': 80, 'text_color': (200, 100, 100)},
        num_frames=30,
        flip_axis='vertical',
        object_type='text'
    )
    builder.add_frames(frames)
    builder.save('flip_text.gif', num_colors=128)

    # Example 3: Quick flip (emoji size)
    builder = GIFBuilder(width=128, height=128, fps=15)
    frames = create_quick_flip('👍', '👎', num_frames=20)
    builder.add_frames(frames)
    builder.save('flip_quick.gif', num_colors=48, optimize_for_emoji=True)

    print("Created flip animations!")
