#!/usr/bin/env python3
"""
Pulse Animation - Scale objects rhythmically for emphasis.

Creates pulsing, heartbeat, and throbbing effects.
"""

import sys
from pathlib import Path
import math

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced, draw_circle
from core.easing import interpolate


def create_pulse_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    pulse_type: str = 'smooth',  # 'smooth', 'heartbeat', 'throb', 'pop'
    scale_range: tuple[float, float] = (0.8, 1.2),
    pulses: float = 2.0,
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create pulsing/scaling animation.

    Args:
        object_type: 'emoji', 'circle', 'text'
        object_data: Object configuration
        num_frames: Number of frames
        pulse_type: Type of pulsing motion
        scale_range: (min_scale, max_scale) tuple
        pulses: Number of pulses in animation
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
            object_data = {'emoji': '❤️', 'size': 100}
        elif object_type == 'circle':
            object_data = {'radius': 50, 'color': (255, 100, 100)}

    min_scale, max_scale = scale_range

    for i in range(num_frames):
        frame = create_blank_frame(frame_width, frame_height, bg_color)
        t = i / (num_frames - 1) if num_frames > 1 else 0

        # Calculate scale based on pulse type
        if pulse_type == 'smooth':
            # Simple sinusoidal pulse
            scale = min_scale + (max_scale - min_scale) * (
                0.5 + 0.5 * math.sin(t * pulses * 2 * math.pi - math.pi / 2)
            )

        elif pulse_type == 'heartbeat':
            # Double pump like a heartbeat
            phase = (t * pulses) % 1.0
            if phase < 0.15:
                # First pump
                scale = interpolate(min_scale, max_scale, phase / 0.15, 'ease_out')
            elif phase < 0.25:
                # First release
                scale = interpolate(max_scale, min_scale, (phase - 0.15) / 0.10, 'ease_in')
            elif phase < 0.35:
                # Second pump (smaller)
                scale = interpolate(min_scale, (min_scale + max_scale) / 2, (phase - 0.25) / 0.10, 'ease_out')
            elif phase < 0.45:
                # Second release
                scale = interpolate((min_scale + max_scale) / 2, min_scale, (phase - 0.35) / 0.10, 'ease_in')
            else:
                # Rest period
                scale = min_scale

        elif pulse_type == 'throb':
            # Sharp pulse with quick return
            phase = (t * pulses) % 1.0
            if phase < 0.2:
                scale = interpolate(min_scale, max_scale, phase / 0.2, 'ease_out')
            else:
                scale = interpolate(max_scale, min_scale, (phase - 0.2) / 0.8, 'ease_in')

        elif pulse_type == 'pop':
            # Pop out and back with overshoot
            phase = (t * pulses) % 1.0
            if phase < 0.3:
                # Pop out with overshoot
                scale = interpolate(min_scale, max_scale * 1.1, phase / 0.3, 'elastic_out')
            else:
                # Settle back
                scale = interpolate(max_scale * 1.1, min_scale, (phase - 0.3) / 0.7, 'ease_out')

        else:
            scale = min_scale + (max_scale - min_scale) * (
                0.5 + 0.5 * math.sin(t * pulses * 2 * math.pi)
            )

        # Draw object at calculated scale
        if object_type == 'emoji':
            base_size = object_data['size']
            current_size = int(base_size * scale)
            draw_emoji_enhanced(
                frame,
                emoji=object_data['emoji'],
                position=(center_pos[0] - current_size // 2, center_pos[1] - current_size // 2),
                size=current_size,
                shadow=object_data.get('shadow', True)
            )

        elif object_type == 'circle':
            base_radius = object_data['radius']
            current_radius = int(base_radius * scale)
            draw_circle(
                frame,
                center=center_pos,
                radius=current_radius,
                fill_color=object_data['color']
            )

        elif object_type == 'text':
            from core.typography import draw_text_with_outline
            base_size = object_data.get('font_size', 50)
            current_size = int(base_size * scale)
            draw_text_with_outline(
                frame,
                text=object_data.get('text', 'PULSE'),
                position=center_pos,
                font_size=current_size,
                text_color=object_data.get('text_color', (255, 100, 100)),
                outline_color=object_data.get('outline_color', (0, 0, 0)),
                outline_width=3,
                centered=True
            )

        frames.append(frame)

    return frames


def create_attention_pulse(
    emoji: str = '⚠️',
    num_frames: int = 20,
    frame_size: int = 128,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create attention-grabbing pulse (good for emoji GIFs).

    Args:
        emoji: Emoji to pulse
        num_frames: Number of frames
        frame_size: Frame size (square)
        bg_color: Background color

    Returns:
        List of frames optimized for emoji size
    """
    return create_pulse_animation(
        object_type='emoji',
        object_data={'emoji': emoji, 'size': 80, 'shadow': False},
        num_frames=num_frames,
        pulse_type='throb',
        scale_range=(0.85, 1.15),
        pulses=2,
        center_pos=(frame_size // 2, frame_size // 2),
        frame_width=frame_size,
        frame_height=frame_size,
        bg_color=bg_color
    )


def create_breathing_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 60,
    breaths: float = 2.0,
    scale_range: tuple[float, float] = (0.9, 1.1),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (240, 248, 255)
) -> list[Image.Image]:
    """
    Create slow, calming breathing animation (in and out).

    Args:
        object_type: Type of object
        object_data: Object configuration
        num_frames: Number of frames
        breaths: Number of breathing cycles
        scale_range: Min/max scale
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    if object_data is None:
        object_data = {'emoji': '😌', 'size': 100}

    return create_pulse_animation(
        object_type=object_type,
        object_data=object_data,
        num_frames=num_frames,
        pulse_type='smooth',
        scale_range=scale_range,
        pulses=breaths,
        center_pos=(frame_width // 2, frame_height // 2),
        frame_width=frame_width,
        frame_height=frame_height,
        bg_color=bg_color
    )


# Example usage
if __name__ == '__main__':
    print("Creating pulse animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Smooth pulse
    frames = create_pulse_animation(
        object_type='emoji',
        object_data={'emoji': '❤️', 'size': 100},
        num_frames=40,
        pulse_type='smooth',
        scale_range=(0.8, 1.2),
        pulses=2
    )
    builder.add_frames(frames)
    builder.save('pulse_smooth.gif', num_colors=128)

    # Example 2: Heartbeat
    builder.clear()
    frames = create_pulse_animation(
        object_type='emoji',
        object_data={'emoji': '💓', 'size': 100},
        num_frames=60,
        pulse_type='heartbeat',
        scale_range=(0.85, 1.2),
        pulses=3
    )
    builder.add_frames(frames)
    builder.save('pulse_heartbeat.gif', num_colors=128)

    # Example 3: Attention pulse (emoji size)
    builder = GIFBuilder(width=128, height=128, fps=15)
    frames = create_attention_pulse(emoji='⚠️', num_frames=20)
    builder.add_frames(frames)
    builder.save('pulse_attention.gif', num_colors=48, optimize_for_emoji=True)

    print("Created pulse animations!")
