#!/usr/bin/env python3
"""
Shake Animation Template - Creates shaking/vibrating motion.

Use this for impact effects, emphasis, or nervous/excited reactions.
"""

import sys
import math
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_circle, draw_emoji, draw_text
from core.easing import ease_out_quad


def create_shake_animation(
    object_type: str = 'emoji',
    object_data: dict = None,
    num_frames: int = 20,
    shake_intensity: int = 15,
    center_x: int = 240,
    center_y: int = 240,
    direction: str = 'horizontal',  # 'horizontal', 'vertical', or 'both'
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list:
    """
    Create frames for a shaking animation.

    Args:
        object_type: 'circle', 'emoji', 'text', or 'custom'
        object_data: Data for the object
        num_frames: Number of frames
        shake_intensity: Maximum shake displacement in pixels
        center_x: Center X position
        center_y: Center Y position
        direction: 'horizontal', 'vertical', or 'both'
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
            object_data = {'emoji': '😱', 'size': 80}
        elif object_type == 'text':
            object_data = {'text': 'SHAKE!', 'font_size': 50, 'color': (255, 0, 0)}

    for i in range(num_frames):
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        # Calculate progress
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Decay shake intensity over time
        intensity = shake_intensity * (1 - ease_out_quad(t))

        # Calculate shake offset using sine wave for smooth oscillation
        freq = 3  # Oscillation frequency
        offset_x = 0
        offset_y = 0

        if direction in ['horizontal', 'both']:
            offset_x = int(math.sin(t * freq * 2 * math.pi) * intensity)

        if direction in ['vertical', 'both']:
            offset_y = int(math.cos(t * freq * 2 * math.pi) * intensity)

        # Apply offset
        x = center_x + offset_x
        y = center_y + offset_y

        # Draw object
        if object_type == 'emoji':
            draw_emoji(
                frame,
                emoji=object_data['emoji'],
                position=(x - object_data['size'] // 2, y - object_data['size'] // 2),
                size=object_data['size']
            )
        elif object_type == 'text':
            draw_text(
                frame,
                text=object_data['text'],
                position=(x, y),
                font_size=object_data['font_size'],
                color=object_data['color'],
                centered=True
            )
        elif object_type == 'circle':
            draw_circle(
                frame,
                center=(x, y),
                radius=object_data.get('radius', 30),
                fill_color=object_data.get('color', (100, 100, 255))
            )

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating shake GIF...")

    builder = GIFBuilder(width=480, height=480, fps=24)

    frames = create_shake_animation(
        object_type='emoji',
        object_data={'emoji': '😱', 'size': 100},
        num_frames=30,
        shake_intensity=20,
        direction='both'
    )

    builder.add_frames(frames)
    builder.save('shake_test.gif', num_colors=128)