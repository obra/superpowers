---
name: slack-gif-creator
description: Toolkit for creating animated GIFs optimized for Slack, with validators for size constraints and composable animation primitives. This skill applies when users request animated GIFs or emoji animations for Slack from descriptions like "make me a GIF for Slack of X doing Y".
license: Complete terms in LICENSE.txt
---

# Slack GIF Creator - Flexible Toolkit

A toolkit for creating animated GIFs optimized for Slack. Provides validators for Slack's constraints, composable animation primitives, and optional helper utilities. **Apply these tools however needed to achieve the creative vision.**

## Slack's Requirements

Slack has specific requirements for GIFs based on their use:

**Message GIFs:**
- Max size: ~2MB
- Optimal dimensions: 480x480
- Typical FPS: 15-20
- Color limit: 128-256
- Duration: 2-5s

**Emoji GIFs:**
- Max size: 64KB (strict limit)
- Optimal dimensions: 128x128
- Typical FPS: 10-12
- Color limit: 32-48
- Duration: 1-2s

**Emoji GIFs are challenging** - the 64KB limit is strict. Strategies that help:
- Limit to 10-15 frames total
- Use 32-48 colors maximum
- Keep designs simple
- Avoid gradients
- Validate file size frequently

## Toolkit Structure

This skill provides three types of tools:

1. **Validators** - Check if a GIF meets Slack's requirements
2. **Animation Primitives** - Composable building blocks for motion (shake, bounce, move, kaleidoscope)
3. **Helper Utilities** - Optional functions for common needs (text, colors, effects)

**Complete creative freedom is available in how these tools are applied.**

## Core Validators

To ensure a GIF meets Slack's constraints, use these validators:

```python
from core.gif_builder import GIFBuilder

# After creating your GIF, check if it meets requirements
builder = GIFBuilder(width=128, height=128, fps=10)
# ... add your frames however you want ...

# Save and check size
info = builder.save('emoji.gif', num_colors=48, optimize_for_emoji=True)

# The save method automatically warns if file exceeds limits
# info dict contains: size_kb, size_mb, frame_count, duration_seconds
```

**File size validator**:
```python
from core.validators import check_slack_size

# Check if GIF meets size limits
passes, info = check_slack_size('emoji.gif', is_emoji=True)
# Returns: (True/False, dict with size details)
```

**Dimension validator**:
```python
from core.validators import validate_dimensions

# Check dimensions
passes, info = validate_dimensions(128, 128, is_emoji=True)
# Returns: (True/False, dict with dimension details)
```

**Complete validation**:
```python
from core.validators import validate_gif, is_slack_ready

# Run all validations
all_pass, results = validate_gif('emoji.gif', is_emoji=True)

# Or quick check
if is_slack_ready('emoji.gif', is_emoji=True):
    print("Ready to upload!")
```

## Animation Primitives

These are composable building blocks for motion. Apply these to any object in any combination:

### Shake
```python
from templates.shake import create_shake_animation

# Shake an emoji
frames = create_shake_animation(
    object_type='emoji',
    object_data={'emoji': '😱', 'size': 80},
    num_frames=20,
    shake_intensity=15,
    direction='both'  # or 'horizontal', 'vertical'
)
```

### Bounce
```python
from templates.bounce import create_bounce_animation

# Bounce a circle
frames = create_bounce_animation(
    object_type='circle',
    object_data={'radius': 40, 'color': (255, 100, 100)},
    num_frames=30,
    bounce_height=150
)
```

### Spin / Rotate
```python
from templates.spin import create_spin_animation, create_loading_spinner

# Clockwise spin
frames = create_spin_animation(
    object_type='emoji',
    object_data={'emoji': '🔄', 'size': 100},
    rotation_type='clockwise',
    full_rotations=2
)

# Wobble rotation
frames = create_spin_animation(rotation_type='wobble', full_rotations=3)

# Loading spinner
frames = create_loading_spinner(spinner_type='dots')
```

### Pulse / Heartbeat
```python
from templates.pulse import create_pulse_animation, create_attention_pulse

# Smooth pulse
frames = create_pulse_animation(
    object_data={'emoji': '❤️', 'size': 100},
    pulse_type='smooth',
    scale_range=(0.8, 1.2)
)

# Heartbeat (double-pump)
frames = create_pulse_animation(pulse_type='heartbeat')

# Attention pulse for emoji GIFs
frames = create_attention_pulse(emoji='⚠️', num_frames=20)
```

### Fade
```python
from templates.fade import create_fade_animation, create_crossfade

# Fade in
frames = create_fade_animation(fade_type='in')

# Fade out
frames = create_fade_animation(fade_type='out')

# Crossfade between two emojis
frames = create_crossfade(
    object1_data={'emoji': '😊', 'size': 100},
    object2_data={'emoji': '😂', 'size': 100}
)
```

### Zoom
```python
from templates.zoom import create_zoom_animation, create_explosion_zoom

# Zoom in dramatically
frames = create_zoom_animation(
    zoom_type='in',
    scale_range=(0.1, 2.0),
    add_motion_blur=True
)

# Zoom out
frames = create_zoom_animation(zoom_type='out')

# Explosion zoom
frames = create_explosion_zoom(emoji='💥')
```

### Explode / Shatter
```python
from templates.explode import create_explode_animation, create_particle_burst

# Burst explosion
frames = create_explode_animation(
    explode_type='burst',
    num_pieces=25
)

# Shatter effect
frames = create_explode_animation(explode_type='shatter')

# Dissolve into particles
frames = create_explode_animation(explode_type='dissolve')

# Particle burst
frames = create_particle_burst(particle_count=30)
```

### Wiggle / Jiggle
```python
from templates.wiggle import create_wiggle_animation, create_excited_wiggle

# Jello wobble
frames = create_wiggle_animation(
    wiggle_type='jello',
    intensity=1.0,
    cycles=2
)

# Wave motion
frames = create_wiggle_animation(wiggle_type='wave')

# Excited wiggle for emoji GIFs
frames = create_excited_wiggle(emoji='🎉')
```

### Slide
```python
from templates.slide import create_slide_animation, create_multi_slide

# Slide in from left with overshoot
frames = create_slide_animation(
    direction='left',
    slide_type='in',
    overshoot=True
)

# Slide across
frames = create_slide_animation(direction='left', slide_type='across')

# Multiple objects sliding in sequence
objects = [
    {'data': {'emoji': '🎯', 'size': 60}, 'direction': 'left', 'final_pos': (120, 240)},
    {'data': {'emoji': '🎪', 'size': 60}, 'direction': 'right', 'final_pos': (240, 240)}
]
frames = create_multi_slide(objects, stagger_delay=5)
```

### Flip
```python
from templates.flip import create_flip_animation, create_quick_flip

# Horizontal flip between two emojis
frames = create_flip_animation(
    object1_data={'emoji': '😊', 'size': 120},
    object2_data={'emoji': '😂', 'size': 120},
    flip_axis='horizontal'
)

# Vertical flip
frames = create_flip_animation(flip_axis='vertical')

# Quick flip for emoji GIFs
frames = create_quick_flip('👍', '👎')
```

### Morph / Transform
```python
from templates.morph import create_morph_animation, create_reaction_morph

# Crossfade morph
frames = create_morph_animation(
    object1_data={'emoji': '😊', 'size': 100},
    object2_data={'emoji': '😂', 'size': 100},
    morph_type='crossfade'
)

# Scale morph (shrink while other grows)
frames = create_morph_animation(morph_type='scale')

# Spin morph (3D flip-like)
frames = create_morph_animation(morph_type='spin_morph')
```

### Move Effect
```python
from templates.move import create_move_animation

# Linear movement
frames = create_move_animation(
    object_type='emoji',
    object_data={'emoji': '🚀', 'size': 60},
    start_pos=(50, 240),
    end_pos=(430, 240),
    motion_type='linear',
    easing='ease_out'
)

# Arc movement (parabolic trajectory)
frames = create_move_animation(
    object_type='emoji',
    object_data={'emoji': '⚽', 'size': 60},
    start_pos=(50, 350),
    end_pos=(430, 350),
    motion_type='arc',
    motion_params={'arc_height': 150}
)

# Circular movement
frames = create_move_animation(
    object_type='emoji',
    object_data={'emoji': '🌍', 'size': 50},
    motion_type='circle',
    motion_params={
        'center': (240, 240),
        'radius': 120,
        'angle_range': 360  # full circle
    }
)

# Wave movement
frames = create_move_animation(
    motion_type='wave',
    motion_params={
        'wave_amplitude': 50,
        'wave_frequency': 2
    }
)

# Or use low-level easing functions
from core.easing import interpolate, calculate_arc_motion

for i in range(num_frames):
    t = i / (num_frames - 1)
    x = interpolate(start_x, end_x, t, easing='ease_out')
    # Or: x, y = calculate_arc_motion(start, end, height, t)
```

### Kaleidoscope Effect
```python
from templates.kaleidoscope import apply_kaleidoscope, create_kaleidoscope_animation

# Apply to a single frame
kaleido_frame = apply_kaleidoscope(frame, segments=8)

# Or create animated kaleidoscope
frames = create_kaleidoscope_animation(
    base_frame=my_frame,  # or None for demo pattern
    num_frames=30,
    segments=8,
    rotation_speed=1.0
)

# Simple mirror effects (faster)
from templates.kaleidoscope import apply_simple_mirror

mirrored = apply_simple_mirror(frame, mode='quad')  # 4-way mirror
# modes: 'horizontal', 'vertical', 'quad', 'radial'
```

**To compose primitives freely, follow these patterns:**
```python
# Example: Bounce + shake for impact
for i in range(num_frames):
    frame = create_blank_frame(480, 480, bg_color)

    # Bounce motion
    t_bounce = i / (num_frames - 1)
    y = interpolate(start_y, ground_y, t_bounce, 'bounce_out')

    # Add shake on impact (when y reaches ground)
    if y >= ground_y - 5:
        shake_x = math.sin(i * 2) * 10
        x = center_x + shake_x
    else:
        x = center_x

    draw_emoji(frame, '⚽', (x, y), size=60)
    builder.add_frame(frame)
```

## Helper Utilities

These are optional helpers for common needs. **Use, modify, or replace these with custom implementations as needed.**

### GIF Builder (Assembly & Optimization)

```python
from core.gif_builder import GIFBuilder

# Create builder with your chosen settings
builder = GIFBuilder(width=480, height=480, fps=20)

# Add frames (however you created them)
for frame in my_frames:
    builder.add_frame(frame)

# Save with optimization
builder.save('output.gif',
             num_colors=128,
             optimize_for_emoji=False)
```

Key features:
- Automatic color quantization
- Duplicate frame removal
- Size warnings for Slack limits
- Emoji mode (aggressive optimization)

### Text Rendering

For small GIFs like emojis, text readability is challenging. A common solution involves adding outlines:

```python
from core.typography import draw_text_with_outline, TYPOGRAPHY_SCALE

# Text with outline (helps readability)
draw_text_with_outline(
    frame, "BONK!",
    position=(240, 100),
    font_size=TYPOGRAPHY_SCALE['h1'],  # 60px
    text_color=(255, 68, 68),
    outline_color=(0, 0, 0),
    outline_width=4,
    centered=True
)
```

To implement custom text rendering, use PIL's `ImageDraw.text()` which works fine for larger GIFs.

### Color Management

Professional-looking GIFs often use cohesive color palettes:

```python
from core.color_palettes import get_palette

# Get a pre-made palette
palette = get_palette('vibrant')  # or 'pastel', 'dark', 'neon', 'professional'

bg_color = palette['background']
text_color = palette['primary']
accent_color = palette['accent']
```

To work with colors directly, use RGB tuples - whatever works for the use case.

### Visual Effects

Optional effects for impact moments:

```python
from core.visual_effects import ParticleSystem, create_impact_flash, create_shockwave_rings

# Particle system
particles = ParticleSystem()
particles.emit_sparkles(x=240, y=200, count=15)
particles.emit_confetti(x=240, y=200, count=20)

# Update and render each frame
particles.update()
particles.render(frame)

# Flash effect
frame = create_impact_flash(frame, position=(240, 200), radius=100)

# Shockwave rings
frame = create_shockwave_rings(frame, position=(240, 200), radii=[30, 60, 90])
```

### Easing Functions

Smooth motion uses easing instead of linear interpolation:

```python
from core.easing import interpolate

# Object falling (accelerates)
y = interpolate(start=0, end=400, t=progress, easing='ease_in')

# Object landing (decelerates)
y = interpolate(start=0, end=400, t=progress, easing='ease_out')

# Bouncing
y = interpolate(start=0, end=400, t=progress, easing='bounce_out')

# Overshoot (elastic)
scale = interpolate(start=0.5, end=1.0, t=progress, easing='elastic_out')
```

Available easings: `linear`, `ease_in`, `ease_out`, `ease_in_out`, `bounce_out`, `elastic_out`, `back_out` (overshoot), and more in `core/easing.py`.

### Frame Composition

Basic drawing utilities if you need them:

```python
from core.frame_composer import (
    create_gradient_background,  # Gradient backgrounds
    draw_emoji_enhanced,         # Emoji with optional shadow
    draw_circle_with_shadow,     # Shapes with depth
    draw_star                    # 5-pointed stars
)

# Gradient background
frame = create_gradient_background(480, 480, top_color, bottom_color)

# Emoji with shadow
draw_emoji_enhanced(frame, '🎉', position=(200, 200), size=80, shadow=True)
```

## Optimization Strategies

When your GIF is too large:

**For Message GIFs (>2MB):**
1. Reduce frames (lower FPS or shorter duration)
2. Reduce colors (128 → 64 colors)
3. Reduce dimensions (480x480 → 320x320)
4. Enable duplicate frame removal

**For Emoji GIFs (>64KB) - be aggressive:**
1. Limit to 10-12 frames total
2. Use 32-40 colors maximum
3. Avoid gradients (solid colors compress better)
4. Simplify design (fewer elements)
5. Use `optimize_for_emoji=True` in save method

## Example Composition Patterns

### Simple Reaction (Pulsing)
```python
builder = GIFBuilder(128, 128, 10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))

    # Pulsing scale
    scale = 1.0 + math.sin(i * 0.5) * 0.15
    size = int(60 * scale)

    draw_emoji_enhanced(frame, '😱', position=(64-size//2, 64-size//2),
                       size=size, shadow=False)
    builder.add_frame(frame)

builder.save('reaction.gif', num_colors=40, optimize_for_emoji=True)

# Validate
from core.validators import check_slack_size
check_slack_size('reaction.gif', is_emoji=True)
```

### Action with Impact (Bounce + Flash)
```python
builder = GIFBuilder(480, 480, 20)

# Phase 1: Object falls
for i in range(15):
    frame = create_gradient_background(480, 480, (240, 248, 255), (200, 230, 255))
    t = i / 14
    y = interpolate(0, 350, t, 'ease_in')
    draw_emoji_enhanced(frame, '⚽', position=(220, int(y)), size=80)
    builder.add_frame(frame)

# Phase 2: Impact + flash
for i in range(8):
    frame = create_gradient_background(480, 480, (240, 248, 255), (200, 230, 255))

    # Flash on first frames
    if i < 3:
        frame = create_impact_flash(frame, (240, 350), radius=120, intensity=0.6)

    draw_emoji_enhanced(frame, '⚽', position=(220, 350), size=80)

    # Text appears
    if i > 2:
        draw_text_with_outline(frame, "GOAL!", position=(240, 150),
                              font_size=60, text_color=(255, 68, 68),
                              outline_color=(0, 0, 0), outline_width=4, centered=True)

    builder.add_frame(frame)

builder.save('goal.gif', num_colors=128)
```

### Combining Primitives (Move + Shake)
```python
from templates.shake import create_shake_animation

# Create shake animation
shake_frames = create_shake_animation(
    object_type='emoji',
    object_data={'emoji': '😰', 'size': 70},
    num_frames=20,
    shake_intensity=12
)

# Create moving element that triggers the shake
builder = GIFBuilder(480, 480, 20)
for i in range(40):
    t = i / 39

    if i < 20:
        # Before trigger - use blank frame with moving object
        frame = create_blank_frame(480, 480, (255, 255, 255))
        x = interpolate(50, 300, t * 2, 'linear')
        draw_emoji_enhanced(frame, '🚗', position=(int(x), 300), size=60)
        draw_emoji_enhanced(frame, '😰', position=(350, 200), size=70)
    else:
        # After trigger - use shake frame
        frame = shake_frames[i - 20]
        # Add the car in final position
        draw_emoji_enhanced(frame, '🚗', position=(300, 300), size=60)

    builder.add_frame(frame)

builder.save('scare.gif')
```

## Philosophy

This toolkit provides building blocks, not rigid recipes. To work with a GIF request:

1. **Understand the creative vision** - What should happen? What's the mood?
2. **Design the animation** - Break it into phases (anticipation, action, reaction)
3. **Apply primitives as needed** - Shake, bounce, move, effects - mix freely
4. **Validate constraints** - Check file size, especially for emoji GIFs
5. **Iterate if needed** - Reduce frames/colors if over size limits

**The goal is creative freedom within Slack's technical constraints.**

## Dependencies

To use this toolkit, install these dependencies only if they aren't already present:

```bash
pip install pillow imageio numpy
```
