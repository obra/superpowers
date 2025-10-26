#!/usr/bin/env python3
"""
Move Animation - Move objects along paths with various motion types.

Provides flexible movement primitives for objects along linear, arc, or custom paths.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_circle, draw_emoji_enhanced
from core.easing import interpolate, calculate_arc_motion


def create_move_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    start_pos: tuple[int, int] = (50, 240),
    end_pos: tuple[int, int] = (430, 240),
    num_frames: int = 30,
    motion_type: str = 'linear',  # 'linear', 'arc', 'bezier', 'circle', 'wave'
    easing: str = 'ease_out',
    motion_params: dict | None = None,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list:
    """
    Create frames showing object moving along a path.

    Args:
        object_type: 'circle', 'emoji', or 'custom'
        object_data: Data for the object
        start_pos: Starting (x, y) position
        end_pos: Ending (x, y) position
        num_frames: Number of frames
        motion_type: Type of motion path
        easing: Easing function name
        motion_params: Additional parameters for motion (e.g., {'arc_height': 100})
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
            object_data = {'radius': 30, 'color': (100, 150, 255)}
        elif object_type == 'emoji':
            object_data = {'emoji': '🚀', 'size': 60}

    # Default motion params
    if motion_params is None:
        motion_params = {}

    for i in range(num_frames):
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate position based on motion type
        if motion_type == 'linear':
            # Straight line with easing
            x = interpolate(start_pos[0], end_pos[0], t, easing)
            y = interpolate(start_pos[1], end_pos[1], t, easing)

        elif motion_type == 'arc':
            # Parabolic arc
            arc_height = motion_params.get('arc_height', 100)
            x, y = calculate_arc_motion(start_pos, end_pos, arc_height, t)

        elif motion_type == 'circle':
            # Circular motion around a center
            center = motion_params.get('center', (frame_width // 2, frame_height // 2))
            radius = motion_params.get('radius', 150)
            start_angle = motion_params.get('start_angle', 0)
            angle_range = motion_params.get('angle_range', 360)  # Full circle

            angle = start_angle + (angle_range * t)
            angle_rad = math.radians(angle)

            x = center[0] + radius * math.cos(angle_rad)
            y = center[1] + radius * math.sin(angle_rad)

        elif motion_type == 'wave':
            # Move in straight line but add wave motion
            wave_amplitude = motion_params.get('wave_amplitude', 50)
            wave_frequency = motion_params.get('wave_frequency', 2)

            # Base linear motion
            base_x = interpolate(start_pos[0], end_pos[0], t, easing)
            base_y = interpolate(start_pos[1], end_pos[1], t, easing)

            # Add wave offset perpendicular to motion direction
            dx = end_pos[0] - start_pos[0]
            dy = end_pos[1] - start_pos[1]
            length = math.sqrt(dx * dx + dy * dy)

            if length > 0:
                # Perpendicular direction
                perp_x = -dy / length
                perp_y = dx / length

                # Wave offset
                wave_offset = math.sin(t * wave_frequency * 2 * math.pi) * wave_amplitude

                x = base_x + perp_x * wave_offset
                y = base_y + perp_y * wave_offset
            else:
                x, y = base_x, base_y

        elif motion_type == 'bezier':
            # Quadratic bezier curve
            control_point = motion_params.get('control_point', (
                (start_pos[0] + end_pos[0]) // 2,
                (start_pos[1] + end_pos[1]) // 2 - 100
            ))

            # Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            x = (1 - t) ** 2 * start_pos[0] + 2 * (1 - t) * t * control_point[0] + t ** 2 * end_pos[0]
            y = (1 - t) ** 2 * start_pos[1] + 2 * (1 - t) * t * control_point[1] + t ** 2 * end_pos[1]

        else:
            # Default to linear
            x = interpolate(start_pos[0], end_pos[0], t, easing)
            y = interpolate(start_pos[1], end_pos[1], t, easing)

        # Draw object at calculated position
        x, y = int(x), int(y)

        if object_type == 'circle':
            draw_circle(
                frame,
                center=(x, y),
                radius=object_data['radius'],
                fill_color=object_data['color']
            )
        elif object_type == 'emoji':
            draw_emoji_enhanced(
                frame,
                emoji=object_data['emoji'],
                position=(x - object_data['size'] // 2, y - object_data['size'] // 2),
                size=object_data['size'],
                shadow=object_data.get('shadow', True)
            )

        frames.append(frame)

    return frames


def create_path_from_points(points: list[tuple[int, int]],
                            num_frames: int = 60,
                            easing: str = 'ease_in_out') -> list[tuple[int, int]]:
    """
    Create a smooth path through multiple points.

    Args:
        points: List of (x, y) waypoints
        num_frames: Total number of frames
        easing: Easing between points

    Returns:
        List of (x, y) positions for each frame
    """
    if len(points) < 2:
        return points * num_frames

    path = []
    frames_per_segment = num_frames // (len(points) - 1)

    for i in range(len(points) - 1):
        start = points[i]
        end = points[i + 1]

        # Last segment gets remaining frames
        if i == len(points) - 2:
            segment_frames = num_frames - len(path)
        else:
            segment_frames = frames_per_segment

        for j in range(segment_frames):
            t = j / segment_frames if segment_frames > 0 else 0
            x = interpolate(start[0], end[0], t, easing)
            y = interpolate(start[1], end[1], t, easing)
            path.append((int(x), int(y)))

    return path


def apply_trail_effect(frames: list, trail_length: int = 5,
                      fade_alpha: float = 0.3) -> list:
    """
    Add motion trail effect to moving object.

    Args:
        frames: List of frames with moving object
        trail_length: Number of previous frames to blend
        fade_alpha: Opacity of trail frames

    Returns:
        List of frames with trail effect
    """
    from PIL import Image, ImageChops
    import numpy as np

    trailed_frames = []

    for i, frame in enumerate(frames):
        # Start with current frame
        result = frame.copy()

        # Blend previous frames
        for j in range(1, min(trail_length + 1, i + 1)):
            prev_frame = frames[i - j]

            # Calculate fade
            alpha = fade_alpha ** j

            # Blend
            result_array = np.array(result, dtype=np.float32)
            prev_array = np.array(prev_frame, dtype=np.float32)

            blended = result_array * (1 - alpha) + prev_array * alpha
            result = Image.fromarray(blended.astype(np.uint8))

        trailed_frames.append(result)

    return trailed_frames


# Example usage
if __name__ == '__main__':
    print("Creating movement examples...")

    # Example 1: Linear movement
    builder = GIFBuilder(width=480, height=480, fps=20)
    frames = create_move_animation(
        object_type='emoji',
        object_data={'emoji': '🚀', 'size': 60},
        start_pos=(50, 240),
        end_pos=(430, 240),
        num_frames=30,
        motion_type='linear',
        easing='ease_out'
    )
    builder.add_frames(frames)
    builder.save('move_linear.gif', num_colors=128)

    # Example 2: Arc movement
    builder.clear()
    frames = create_move_animation(
        object_type='emoji',
        object_data={'emoji': '⚽', 'size': 60},
        start_pos=(50, 350),
        end_pos=(430, 350),
        num_frames=30,
        motion_type='arc',
        motion_params={'arc_height': 150},
        easing='linear'
    )
    builder.add_frames(frames)
    builder.save('move_arc.gif', num_colors=128)

    # Example 3: Circular movement
    builder.clear()
    frames = create_move_animation(
        object_type='emoji',
        object_data={'emoji': '🌍', 'size': 50},
        start_pos=(0, 0),  # Ignored for circle
        end_pos=(0, 0),    # Ignored for circle
        num_frames=40,
        motion_type='circle',
        motion_params={
            'center': (240, 240),
            'radius': 120,
            'start_angle': 0,
            'angle_range': 360
        },
        easing='linear'
    )
    builder.add_frames(frames)
    builder.save('move_circle.gif', num_colors=128)

    print("Created movement examples!")
