#!/usr/bin/env python3
"""
Visual Effects - Particles, motion blur, impacts, and other effects for GIFs.

This module provides high-impact visual effects that make animations feel
professional and dynamic while keeping file sizes reasonable.
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math
import random
from typing import Optional


class Particle:
    """A single particle in a particle system."""

    def __init__(self, x: float, y: float, vx: float, vy: float,
                 lifetime: float, color: tuple[int, int, int],
                 size: int = 3, shape: str = 'circle'):
        """
        Initialize a particle.

        Args:
            x, y: Starting position
            vx, vy: Velocity
            lifetime: How long particle lives (in frames)
            color: RGB color
            size: Particle size in pixels
            shape: 'circle', 'square', or 'star'
        """
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.lifetime = lifetime
        self.max_lifetime = lifetime
        self.color = color
        self.size = size
        self.shape = shape
        self.gravity = 0.5  # Pixels per frame squared
        self.drag = 0.98    # Velocity multiplier per frame

    def update(self):
        """Update particle position and lifetime."""
        # Apply physics
        self.vy += self.gravity
        self.vx *= self.drag
        self.vy *= self.drag

        # Update position
        self.x += self.vx
        self.y += self.vy

        # Decrease lifetime
        self.lifetime -= 1

    def is_alive(self) -> bool:
        """Check if particle is still alive."""
        return self.lifetime > 0

    def get_alpha(self) -> float:
        """Get particle opacity based on lifetime."""
        return max(0, min(1, self.lifetime / self.max_lifetime))

    def render(self, frame: Image.Image):
        """
        Render particle to frame.

        Args:
            frame: PIL Image to draw on
        """
        if not self.is_alive():
            return

        draw = ImageDraw.Draw(frame)
        alpha = self.get_alpha()

        # Calculate faded color
        color = tuple(int(c * alpha) for c in self.color)

        # Draw based on shape
        x, y = int(self.x), int(self.y)
        size = max(1, int(self.size * alpha))

        if self.shape == 'circle':
            bbox = [x - size, y - size, x + size, y + size]
            draw.ellipse(bbox, fill=color)
        elif self.shape == 'square':
            bbox = [x - size, y - size, x + size, y + size]
            draw.rectangle(bbox, fill=color)
        elif self.shape == 'star':
            # Simple 4-point star
            points = [
                (x, y - size),
                (x - size // 2, y),
                (x, y),
                (x, y + size),
                (x, y),
                (x + size // 2, y),
            ]
            draw.line(points, fill=color, width=2)


class ParticleSystem:
    """Manages a collection of particles."""

    def __init__(self):
        """Initialize particle system."""
        self.particles: list[Particle] = []

    def emit(self, x: int, y: int, count: int = 10,
             spread: float = 2.0, speed: float = 5.0,
             color: tuple[int, int, int] = (255, 200, 0),
             lifetime: float = 20.0, size: int = 3, shape: str = 'circle'):
        """
        Emit a burst of particles.

        Args:
            x, y: Emission position
            count: Number of particles to emit
            spread: Angle spread (radians)
            speed: Initial speed
            color: Particle color
            lifetime: Particle lifetime in frames
            size: Particle size
            shape: Particle shape
        """
        for _ in range(count):
            # Random angle and speed
            angle = random.uniform(0, 2 * math.pi)
            vel_mag = random.uniform(speed * 0.5, speed * 1.5)
            vx = math.cos(angle) * vel_mag
            vy = math.sin(angle) * vel_mag

            # Random lifetime variation
            life = random.uniform(lifetime * 0.7, lifetime * 1.3)

            particle = Particle(x, y, vx, vy, life, color, size, shape)
            self.particles.append(particle)

    def emit_confetti(self, x: int, y: int, count: int = 20,
                      colors: Optional[list[tuple[int, int, int]]] = None):
        """
        Emit confetti particles (colorful, falling).

        Args:
            x, y: Emission position
            count: Number of confetti pieces
            colors: List of colors (random if None)
        """
        if colors is None:
            colors = [
                (255, 107, 107), (255, 159, 64), (255, 218, 121),
                (107, 185, 240), (162, 155, 254), (255, 182, 193)
            ]

        for _ in range(count):
            color = random.choice(colors)
            vx = random.uniform(-3, 3)
            vy = random.uniform(-8, -2)
            shape = random.choice(['square', 'circle'])
            size = random.randint(2, 4)
            lifetime = random.uniform(40, 60)

            particle = Particle(x, y, vx, vy, lifetime, color, size, shape)
            particle.gravity = 0.3  # Lighter gravity for confetti
            self.particles.append(particle)

    def emit_sparkles(self, x: int, y: int, count: int = 15):
        """
        Emit sparkle particles (twinkling stars).

        Args:
            x, y: Emission position
            count: Number of sparkles
        """
        colors = [(255, 255, 200), (255, 255, 255), (255, 255, 150)]

        for _ in range(count):
            color = random.choice(colors)
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(1, 3)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            lifetime = random.uniform(15, 30)

            particle = Particle(x, y, vx, vy, lifetime, color, 2, 'star')
            particle.gravity = 0
            particle.drag = 0.95
            self.particles.append(particle)

    def update(self):
        """Update all particles."""
        # Update alive particles
        for particle in self.particles:
            particle.update()

        # Remove dead particles
        self.particles = [p for p in self.particles if p.is_alive()]

    def render(self, frame: Image.Image):
        """Render all particles to frame."""
        for particle in self.particles:
            particle.render(frame)

    def get_particle_count(self) -> int:
        """Get number of active particles."""
        return len(self.particles)


def add_motion_blur(frame: Image.Image, prev_frame: Optional[Image.Image],
                    blur_amount: float = 0.5) -> Image.Image:
    """
    Add motion blur by blending with previous frame.

    Args:
        frame: Current frame
        prev_frame: Previous frame (None for first frame)
        blur_amount: Amount of blur (0.0-1.0)

    Returns:
        Frame with motion blur applied
    """
    if prev_frame is None:
        return frame

    # Blend current frame with previous frame
    frame_array = np.array(frame, dtype=np.float32)
    prev_array = np.array(prev_frame, dtype=np.float32)

    blended = frame_array * (1 - blur_amount) + prev_array * blur_amount
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    return Image.fromarray(blended)


def create_impact_flash(frame: Image.Image, position: tuple[int, int],
                        radius: int = 100, intensity: float = 0.7) -> Image.Image:
    """
    Create a bright flash effect at impact point.

    Args:
        frame: PIL Image to draw on
        position: Center of flash
        radius: Flash radius
        intensity: Flash intensity (0.0-1.0)

    Returns:
        Modified frame
    """
    # Create overlay
    overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    x, y = position

    # Draw concentric circles with decreasing opacity
    num_circles = 5
    for i in range(num_circles):
        alpha = int(255 * intensity * (1 - i / num_circles))
        r = radius * (1 - i / num_circles)
        color = (255, 255, 240, alpha)  # Warm white

        bbox = [x - r, y - r, x + r, y + r]
        draw.ellipse(bbox, fill=color)

    # Composite onto frame
    frame_rgba = frame.convert('RGBA')
    frame_rgba = Image.alpha_composite(frame_rgba, overlay)
    return frame_rgba.convert('RGB')


def create_shockwave_rings(frame: Image.Image, position: tuple[int, int],
                           radii: list[int], color: tuple[int, int, int] = (255, 200, 0),
                           width: int = 3) -> Image.Image:
    """
    Create expanding ring effects.

    Args:
        frame: PIL Image to draw on
        position: Center of rings
        radii: List of ring radii
        color: Ring color
        width: Ring width

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x, y = position

    for radius in radii:
        bbox = [x - radius, y - radius, x + radius, y + radius]
        draw.ellipse(bbox, outline=color, width=width)

    return frame


def create_explosion_effect(frame: Image.Image, position: tuple[int, int],
                            radius: int, progress: float,
                            color: tuple[int, int, int] = (255, 150, 0)) -> Image.Image:
    """
    Create an explosion effect that expands and fades.

    Args:
        frame: PIL Image to draw on
        position: Explosion center
        radius: Maximum radius
        progress: Animation progress (0.0-1.0)
        color: Explosion color

    Returns:
        Modified frame
    """
    current_radius = int(radius * progress)
    fade = 1 - progress

    # Create overlay
    overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    x, y = position

    # Draw expanding circle with fade
    alpha = int(255 * fade)
    r, g, b = color
    circle_color = (r, g, b, alpha)

    bbox = [x - current_radius, y - current_radius, x + current_radius, y + current_radius]
    draw.ellipse(bbox, fill=circle_color)

    # Composite
    frame_rgba = frame.convert('RGBA')
    frame_rgba = Image.alpha_composite(frame_rgba, overlay)
    return frame_rgba.convert('RGB')


def add_glow_effect(frame: Image.Image, mask_color: tuple[int, int, int],
                    glow_color: tuple[int, int, int],
                    blur_radius: int = 10) -> Image.Image:
    """
    Add a glow effect to areas of a specific color.

    Args:
        frame: PIL Image
        mask_color: Color to create glow around
        glow_color: Color of glow
        blur_radius: Blur amount

    Returns:
        Frame with glow
    """
    # Create mask of target color
    frame_array = np.array(frame)
    mask = np.all(frame_array == mask_color, axis=-1)

    # Create glow layer
    glow = Image.new('RGB', frame.size, (0, 0, 0))
    glow_array = np.array(glow)
    glow_array[mask] = glow_color
    glow = Image.fromarray(glow_array)

    # Blur the glow
    glow = glow.filter(ImageFilter.GaussianBlur(blur_radius))

    # Blend with original
    blended = Image.blend(frame, glow, 0.5)
    return blended


def add_drop_shadow(frame: Image.Image, object_bounds: tuple[int, int, int, int],
                    shadow_offset: tuple[int, int] = (5, 5),
                    shadow_color: tuple[int, int, int] = (0, 0, 0),
                    blur: int = 5) -> Image.Image:
    """
    Add drop shadow to an object.

    Args:
        frame: PIL Image
        object_bounds: (x1, y1, x2, y2) bounds of object
        shadow_offset: (x, y) offset of shadow
        shadow_color: Shadow color
        blur: Shadow blur amount

    Returns:
        Frame with shadow
    """
    # Extract object
    x1, y1, x2, y2 = object_bounds
    obj = frame.crop((x1, y1, x2, y2))

    # Create shadow
    shadow = Image.new('RGBA', obj.size, (*shadow_color, 180))

    # Create frame with alpha
    frame_rgba = frame.convert('RGBA')

    # Paste shadow
    shadow_pos = (x1 + shadow_offset[0], y1 + shadow_offset[1])
    frame_rgba.paste(shadow, shadow_pos, shadow)

    # Paste object on top
    frame_rgba.paste(obj, (x1, y1))

    return frame_rgba.convert('RGB')


def create_speed_lines(frame: Image.Image, position: tuple[int, int],
                       direction: float, length: int = 50,
                       count: int = 5, color: tuple[int, int, int] = (200, 200, 200)) -> Image.Image:
    """
    Create speed lines for motion effect.

    Args:
        frame: PIL Image to draw on
        position: Center position
        direction: Angle in radians (0 = right, pi/2 = down)
        length: Line length
        count: Number of lines
        color: Line color

    Returns:
        Modified frame
    """
    draw = ImageDraw.Draw(frame)
    x, y = position

    # Opposite direction (lines trail behind)
    trail_angle = direction + math.pi

    for i in range(count):
        # Offset from center
        offset_angle = trail_angle + random.uniform(-0.3, 0.3)
        offset_dist = random.uniform(10, 30)
        start_x = x + math.cos(offset_angle) * offset_dist
        start_y = y + math.sin(offset_angle) * offset_dist

        # End point
        line_length = random.uniform(length * 0.7, length * 1.3)
        end_x = start_x + math.cos(trail_angle) * line_length
        end_y = start_y + math.sin(trail_angle) * line_length

        # Draw line with varying opacity
        alpha = random.randint(100, 200)
        width = random.randint(1, 3)

        # Simple line (full opacity simulation)
        draw.line([(start_x, start_y), (end_x, end_y)], fill=color, width=width)

    return frame


def create_screen_shake_offset(intensity: int, frame_index: int) -> tuple[int, int]:
    """
    Calculate screen shake offset for a frame.

    Args:
        intensity: Shake intensity in pixels
        frame_index: Current frame number

    Returns:
        (x, y) offset tuple
    """
    # Use frame index for deterministic but random-looking shake
    random.seed(frame_index)
    offset_x = random.randint(-intensity, intensity)
    offset_y = random.randint(-intensity, intensity)
    random.seed()  # Reset seed
    return (offset_x, offset_y)


def apply_screen_shake(frame: Image.Image, intensity: int, frame_index: int) -> Image.Image:
    """
    Apply screen shake effect to entire frame.

    Args:
        frame: PIL Image
        intensity: Shake intensity
        frame_index: Current frame number

    Returns:
        Shaken frame
    """
    offset_x, offset_y = create_screen_shake_offset(intensity, frame_index)

    # Create new frame with background
    shaken = Image.new('RGB', frame.size, (0, 0, 0))

    # Paste original frame with offset
    shaken.paste(frame, (offset_x, offset_y))

    return shaken