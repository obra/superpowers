#!/usr/bin/env python3
"""
Slide Animation - Slide elements in from edges with overshoot/bounce.

Creates smooth entrance and exit animations.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.easing import interpolate


def create_slide_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    direction: str = 'left',  # 'left', 'right', 'top', 'bottom'
    slide_type: str = 'in',  # 'in', 'out', 'across'
    easing: str = 'ease_out',
    overshoot: bool = False,
    final_pos: tuple[int, int] | None = None,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create slide animation.

    Args:
        object_type: 'emoji', 'text'
        object_data: Object configuration
        num_frames: Number of frames
        direction: Direction of slide
        slide_type: Type of slide (in/out/across)
        easing: Easing function
        overshoot: Add overshoot/bounce at end
        final_pos: Final position (None = center)
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
            object_data = {'emoji': '➡️', 'size': 100}

    if final_pos is None:
        final_pos = (frame_width // 2, frame_height // 2)

    # Calculate start and end positions based on direction
    size = object_data.get('size', 100) if object_type == 'emoji' else 100
    margin = size

    if direction == 'left':
        start_pos = (-margin, final_pos[1])
        end_pos = final_pos if slide_type == 'in' else (frame_width + margin, final_pos[1])
    elif direction == 'right':
        start_pos = (frame_width + margin, final_pos[1])
        end_pos = final_pos if slide_type == 'in' else (-margin, final_pos[1])
    elif direction == 'top':
        start_pos = (final_pos[0], -margin)
        end_pos = final_pos if slide_type == 'in' else (final_pos[0], frame_height + margin)
    elif direction == 'bottom':
        start_pos = (final_pos[0], frame_height + margin)
        end_pos = final_pos if slide_type == 'in' else (final_pos[0], -margin)
    else:
        start_pos = (-margin, final_pos[1])
        end_pos = final_pos

    # For 'out' type, swap start and end
    if slide_type == 'out':
        start_pos, end_pos = final_pos, end_pos
    elif slide_type == 'across':
        # Slide all the way across
        if direction == 'left':
            start_pos = (-margin, final_pos[1])
            end_pos = (frame_width + margin, final_pos[1])
        elif direction == 'right':
            start_pos = (frame_width + margin, final_pos[1])
            end_pos = (-margin, final_pos[1])
        elif direction == 'top':
            start_pos = (final_pos[0], -margin)
            end_pos = (final_pos[0], frame_height + margin)
        elif direction == 'bottom':
            start_pos = (final_pos[0], frame_height + margin)
            end_pos = (final_pos[0], -margin)

    # Use overshoot easing if requested
    if overshoot and slide_type == 'in':
        easing = 'back_out'

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        # Calculate current position
        x = int(interpolate(start_pos[0], end_pos[0], t, easing))
        y = int(interpolate(start_pos[1], end_pos[1], t, easing))

        # Draw object
        if object_type == 'emoji':
            size = object_data['size']
            draw_emoji_enhanced(
                frame,
                emoji=object_data['emoji'],
                position=(x - size // 2, y - size // 2),
                size=size,
                shadow=object_data.get('shadow', True)
            )

        elif object_type == 'text':
            from core.typography import draw_text_with_outline
            draw_text_with_outline(
                frame,
                text=object_data.get('text', 'SLIDE'),
                position=(x, y),
                font_size=object_data.get('font_size', 50),
                text_color=object_data.get('text_color', (0, 0, 0)),
                outline_color=object_data.get('outline_color', (255, 255, 255)),
                outline_width=3,
                centered=True
            )

        frames.append(frame)

    return frames


def create_multi_slide(
    objects: list[dict],
    num_frames: int = 30,
    stagger_delay: int = 3,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create animation with multiple objects sliding in sequence.

    Args:
        objects: List of object configs with 'type', 'data', 'direction', 'final_pos'
        num_frames: Number of frames
        stagger_delay: Frames between each object starting
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    for i in range(num_frames):
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        for idx, obj in enumerate(objects):
            # Calculate when this object starts moving
            start_frame = idx * stagger_delay
            if i < start_frame:
                continue  # Object hasn't started yet

            # Calculate progress for this object
            obj_frame = i - start_frame
            obj_duration = num_frames - start_frame
            if obj_duration <= 0:
                continue

            t = obj_frame / obj_duration

            # Get object properties
            obj_type = obj.get('type', 'emoji')
            obj_data = obj.get('data', {'emoji': '➡️', 'size': 80})
            direction = obj.get('direction', 'left')
            final_pos = obj.get('final_pos', (frame_width // 2, frame_height // 2))
            easing = obj.get('easing', 'back_out')

            # Calculate position
            size = obj_data.get('size', 80)
            margin = size

            if direction == 'left':
                start_x = -margin
                end_x = final_pos[0]
                y = final_pos[1]
            elif direction == 'right':
                start_x = frame_width + margin
                end_x = final_pos[0]
                y = final_pos[1]
            elif direction == 'top':
                x = final_pos[0]
                start_y = -margin
                end_y = final_pos[1]
            elif direction == 'bottom':
                x = final_pos[0]
                start_y = frame_height + margin
                end_y = final_pos[1]
            else:
                start_x = -margin
                end_x = final_pos[0]
                y = final_pos[1]

            # Interpolate position
            if direction in ['left', 'right']:
                x = int(interpolate(start_x, end_x, t, easing))
            else:
                y = int(interpolate(start_y, end_y, t, easing))

            # Draw object
            if obj_type == 'emoji':
                draw_emoji_enhanced(
                    frame,
                    emoji=obj_data['emoji'],
                    position=(x - size // 2, y - size // 2),
                    size=size,
                    shadow=False
                )

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating slide animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Slide in from left with overshoot
    frames = create_slide_animation(
        object_type='emoji',
        object_data={'emoji': '➡️', 'size': 100},
        num_frames=30,
        direction='left',
        slide_type='in',
        overshoot=True
    )
    builder.add_frames(frames)
    builder.save('slide_in_left.gif', num_colors=128)

    # Example 2: Slide across
    builder.clear()
    frames = create_slide_animation(
        object_type='emoji',
        object_data={'emoji': '🚀', 'size': 80},
        num_frames=40,
        direction='left',
        slide_type='across',
        easing='ease_in_out'
    )
    builder.add_frames(frames)
    builder.save('slide_across.gif', num_colors=128)

    # Example 3: Multiple objects sliding in
    builder.clear()
    objects = [
        {
            'type': 'emoji',
            'data': {'emoji': '🎯', 'size': 60},
            'direction': 'left',
            'final_pos': (120, 240)
        },
        {
            'type': 'emoji',
            'data': {'emoji': '🎪', 'size': 60},
            'direction': 'right',
            'final_pos': (240, 240)
        },
        {
            'type': 'emoji',
            'data': {'emoji': '🎨', 'size': 60},
            'direction': 'top',
            'final_pos': (360, 240)
        }
    ]
    frames = create_multi_slide(objects, num_frames=50, stagger_delay=5)
    builder.add_frames(frames)
    builder.save('slide_multi.gif', num_colors=128)

    print("Created slide animations!")
