#!/usr/bin/env python3
"""
Explode Animation - Break objects into pieces that fly outward.

Creates explosion, shatter, and particle burst effects.
"""

import sys
from pathlib import Path
import math
import random

sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image, ImageDraw
import numpy as np
from core.gif_builder import GIFBuilder
from core.frame_composer import create_blank_frame, draw_emoji_enhanced
from core.visual_effects import ParticleSystem
from core.easing import interpolate


def create_explode_animation(
    object_type: str = 'emoji',
    object_data: dict | None = None,
    num_frames: int = 30,
    explode_type: str = 'burst',  # 'burst', 'shatter', 'dissolve', 'implode'
    num_pieces: int = 20,
    explosion_speed: float = 5.0,
    center_pos: tuple[int, int] = (240, 240),
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create explosion animation.

    Args:
        object_type: 'emoji', 'circle', 'text'
        object_data: Object configuration
        num_frames: Number of frames
        explode_type: Type of explosion
        num_pieces: Number of pieces/particles
        explosion_speed: Speed of explosion
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
            object_data = {'emoji': '💣', 'size': 100}

    # Generate pieces/particles
    pieces = []
    for _ in range(num_pieces):
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(explosion_speed * 0.5, explosion_speed * 1.5)
        vx = math.cos(angle) * speed
        vy = math.sin(angle) * speed
        size = random.randint(3, 12)
        color = (
            random.randint(100, 255),
            random.randint(100, 255),
            random.randint(100, 255)
        )
        rotation_speed = random.uniform(-20, 20)

        pieces.append({
            'vx': vx,
            'vy': vy,
            'size': size,
            'color': color,
            'rotation': 0,
            'rotation_speed': rotation_speed
        })

    for i in range(num_frames):
        t = i / (num_frames - 1) if num_frames > 1 else 0
        frame = create_blank_frame(frame_width, frame_height, bg_color)
        draw = ImageDraw.Draw(frame)

        if explode_type == 'burst':
            # Show object at start, then explode
            if t < 0.2:
                # Object still intact
                scale = interpolate(1.0, 1.2, t / 0.2, 'ease_out')
                if object_type == 'emoji':
                    size = int(object_data['size'] * scale)
                    draw_emoji_enhanced(
                        frame,
                        emoji=object_data['emoji'],
                        position=(center_pos[0] - size // 2, center_pos[1] - size // 2),
                        size=size,
                        shadow=False
                    )
            else:
                # Exploded - draw pieces
                explosion_t = (t - 0.2) / 0.8
                for piece in pieces:
                    # Update position
                    x = center_pos[0] + piece['vx'] * explosion_t * 50
                    y = center_pos[1] + piece['vy'] * explosion_t * 50 + 0.5 * 300 * explosion_t ** 2  # Gravity

                    # Fade out
                    alpha = 1.0 - explosion_t
                    if alpha > 0:
                        color = tuple(int(c * alpha) for c in piece['color'])
                        size = int(piece['size'] * (1 - explosion_t * 0.5))

                        draw.ellipse(
                            [x - size, y - size, x + size, y + size],
                            fill=color
                        )

        elif explode_type == 'shatter':
            # Break into geometric pieces
            if t < 0.15:
                # Object intact
                if object_type == 'emoji':
                    draw_emoji_enhanced(
                        frame,
                        emoji=object_data['emoji'],
                        position=(center_pos[0] - object_data['size'] // 2,
                                center_pos[1] - object_data['size'] // 2),
                        size=object_data['size'],
                        shadow=False
                    )
            else:
                # Shattered
                shatter_t = (t - 0.15) / 0.85

                # Draw triangular shards
                for piece in pieces[:min(10, len(pieces))]:
                    x = center_pos[0] + piece['vx'] * shatter_t * 30
                    y = center_pos[1] + piece['vy'] * shatter_t * 30 + 0.5 * 200 * shatter_t ** 2

                    # Update rotation
                    rotation = piece['rotation_speed'] * shatter_t * 100

                    # Draw triangle shard
                    shard_size = piece['size'] * 2
                    points = []
                    for j in range(3):
                        angle = (rotation + j * 120) * math.pi / 180
                        px = x + shard_size * math.cos(angle)
                        py = y + shard_size * math.sin(angle)
                        points.append((px, py))

                    alpha = 1.0 - shatter_t
                    if alpha > 0:
                        color = tuple(int(c * alpha) for c in piece['color'])
                        draw.polygon(points, fill=color)

        elif explode_type == 'dissolve':
            # Dissolve into particles
            dissolve_scale = interpolate(1.0, 0.0, t, 'ease_in')

            if dissolve_scale > 0.1:
                # Draw fading object
                if object_type == 'emoji':
                    size = int(object_data['size'] * dissolve_scale)
                    size = max(12, size)

                    emoji_canvas = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
                    draw_emoji_enhanced(
                        emoji_canvas,
                        emoji=object_data['emoji'],
                        position=(center_pos[0] - size // 2, center_pos[1] - size // 2),
                        size=size,
                        shadow=False
                    )

                    # Apply opacity
                    from templates.fade import apply_opacity
                    emoji_canvas = apply_opacity(emoji_canvas, dissolve_scale)

                    frame_rgba = frame.convert('RGBA')
                    frame = Image.alpha_composite(frame_rgba, emoji_canvas)
                    frame = frame.convert('RGB')
                    draw = ImageDraw.Draw(frame)

            # Draw outward-moving particles
            for piece in pieces:
                x = center_pos[0] + piece['vx'] * t * 40
                y = center_pos[1] + piece['vy'] * t * 40

                alpha = 1.0 - t
                if alpha > 0:
                    color = tuple(int(c * alpha) for c in piece['color'])
                    size = int(piece['size'] * (1 - t * 0.5))
                    draw.ellipse(
                        [x - size, y - size, x + size, y + size],
                        fill=color
                    )

        elif explode_type == 'implode':
            # Reverse explosion - pieces fly inward
            if t < 0.7:
                # Pieces converging
                implode_t = 1.0 - (t / 0.7)
                for piece in pieces:
                    x = center_pos[0] + piece['vx'] * implode_t * 50
                    y = center_pos[1] + piece['vy'] * implode_t * 50

                    alpha = 1.0 - (1.0 - implode_t) * 0.5
                    color = tuple(int(c * alpha) for c in piece['color'])
                    size = int(piece['size'] * alpha)

                    draw.ellipse(
                        [x - size, y - size, x + size, y + size],
                        fill=color
                    )
            else:
                # Object reforms
                reform_t = (t - 0.7) / 0.3
                scale = interpolate(0.5, 1.0, reform_t, 'elastic_out')

                if object_type == 'emoji':
                    size = int(object_data['size'] * scale)
                    draw_emoji_enhanced(
                        frame,
                        emoji=object_data['emoji'],
                        position=(center_pos[0] - size // 2, center_pos[1] - size // 2),
                        size=size,
                        shadow=False
                    )

        frames.append(frame)

    return frames


def create_particle_burst(
    num_frames: int = 25,
    particle_count: int = 30,
    center_pos: tuple[int, int] = (240, 240),
    colors: list[tuple[int, int, int]] | None = None,
    frame_width: int = 480,
    frame_height: int = 480,
    bg_color: tuple[int, int, int] = (255, 255, 255)
) -> list[Image.Image]:
    """
    Create simple particle burst effect.

    Args:
        num_frames: Number of frames
        particle_count: Number of particles
        center_pos: Burst center
        colors: Particle colors (None for random)
        frame_width: Frame width
        frame_height: Frame height
        bg_color: Background color

    Returns:
        List of frames
    """
    particles = ParticleSystem()

    # Emit particles
    if colors is None:
        from core.color_palettes import get_palette
        palette = get_palette('vibrant')
        colors = [palette['primary'], palette['secondary'], palette['accent']]

    for _ in range(particle_count):
        color = random.choice(colors)
        particles.emit(
            center_pos[0], center_pos[1],
            count=1,
            speed=random.uniform(3, 8),
            color=color,
            lifetime=random.uniform(20, 30),
            size=random.randint(3, 8),
            shape='star'
        )

    frames = []
    for _ in range(num_frames):
        frame = create_blank_frame(frame_width, frame_height, bg_color)

        particles.update()
        particles.render(frame)

        frames.append(frame)

    return frames


# Example usage
if __name__ == '__main__':
    print("Creating explode animations...")

    builder = GIFBuilder(width=480, height=480, fps=20)

    # Example 1: Burst
    frames = create_explode_animation(
        object_type='emoji',
        object_data={'emoji': '💣', 'size': 100},
        num_frames=30,
        explode_type='burst',
        num_pieces=25
    )
    builder.add_frames(frames)
    builder.save('explode_burst.gif', num_colors=128)

    # Example 2: Shatter
    builder.clear()
    frames = create_explode_animation(
        object_type='emoji',
        object_data={'emoji': '🪟', 'size': 100},
        num_frames=30,
        explode_type='shatter',
        num_pieces=12
    )
    builder.add_frames(frames)
    builder.save('explode_shatter.gif', num_colors=128)

    # Example 3: Particle burst
    builder.clear()
    frames = create_particle_burst(num_frames=25, particle_count=40)
    builder.add_frames(frames)
    builder.save('explode_particles.gif', num_colors=128)

    print("Created explode animations!")
