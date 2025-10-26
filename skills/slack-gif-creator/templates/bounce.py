#!/usr/bin/env python3
"""
Bounce Animation Template - Creates bouncing motion for objects.

Use this to make objects bounce up and down or horizontally with realistic physics.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_circle, draw_emoji
from core.easing import ease_out_bounce, interpolate


def create_bounce_animation(
    object_type: str = 'circle',
    object_data: dict = None,
    num_frames: int = 30,
    bounce_height: int = 150,
    ground_y: int = 350,
    start_x: int = 240,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list:
    """
    Create frames for a bouncing animation.

    Args:
        object_type: 'circle', 'emoji', or 'custom'
        object_data: Data for the object (e.g., {'radius': 30, 'color': (255, 0, 0)})
        num_frames: Number of frames in the animation
        bounce_height: Maximum height of bounce
        ground_y: Y position of ground
        start_x: X position (or starting X if moving horizontally)
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    frames = []

    # Default object data
    if object_data is None:
        if object_type == 'circle':
            object_data = {'radius': 30, 'color': (255, 100, 100)}
        elif object_type == 'emoji':
            object_data = {'emoji': '⚽', 'size': 60}

    for i in range(num_frames):
        # Create blank frame
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        # Calculate progress (0.0 to 1.0)
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate Y position using bounce easing
        y = ground_y - int(ease_out_bounce(t) * bounce_height)

        # Draw object
        if object_type == 'circle':
            draw_circle(
                frame,
                center=(start_x, y),
                radius=object_data['radius'],
                fill_color=object_data['color']
            )
        elif object_type == 'emoji':
            draw_emoji(
                frame,
                emoji=object_data['emoji'],
                position=(start_x - object_data['size'] // 2, y - object_data['size'] // 2),
                size=object_data['size']
            )

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating bouncing ball GIF...")

    # Create GIF builder
    builder = GIFBuilder(width=480, height=480, fps=20)

    # Generate bounce animation
    frames = create_bounce_animation(
        object_type='circle',
        object_data={'radius': 40, 'color': (255, 100, 100)},
        num_frames=40,
        bounce_height=200
    )

    # Add frames to builder
    builder.add_frames(frames)

    # Save GIF
    builder.save('bounce_test.gif', num_colors=64)