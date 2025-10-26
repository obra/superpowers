#!/usr/bin/env python3
"""
Validators - Check if GIFs meet Slack's requirements.

These validators help ensure your GIFs meet Slack's size and dimension constraints.
"""

from pathlib import Path


def check_slack_size(gif_path: str | Path, is_emoji: bool = True) -> tuple[bool, dict]:
    """
    Check if GIF meets Slack size limits.

    Args:
        gif_path: Path to GIF file
        is_emoji: True for emoji GIF (64KB limit), False for message GIF (2MB limit)

    Returns:
        Tuple of (passes: bool, info: dict with details)
    """
    gif_path = Path(gif_path)

    if not gif_path.exists():
        return False, {'error': f'File not found: {gif_path}'}

    size_bytes = gif_path.stat().st_size
    size_kb = size_bytes / 1024
    size_mb = size_kb / 1024

    limit_kb = 64 if is_emoji else 2048
    limit_mb = limit_kb / 1024

    passes = size_kb <= limit_kb

    info = {
        'size_bytes': size_bytes,
        'size_kb': size_kb,
        'size_mb': size_mb,
        'limit_kb': limit_kb,
        'limit_mb': limit_mb,
        'passes': passes,
        'type': 'emoji' if is_emoji else 'message'
    }

    # Print feedback
    if passes:
        print(f"✓ {size_kb:.1f} KB - within {limit_kb} KB limit")
    else:
        print(f"✗ {size_kb:.1f} KB - exceeds {limit_kb} KB limit")
        overage_kb = size_kb - limit_kb
        overage_percent = (overage_kb / limit_kb) * 100
        print(f"  Over by: {overage_kb:.1f} KB ({overage_percent:.1f}%)")
        print(f"  Try: fewer frames, fewer colors, or simpler design")

    return passes, info


def validate_dimensions(width: int, height: int, is_emoji: bool = True) -> tuple[bool, dict]:
    """
    Check if dimensions are suitable for Slack.

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        is_emoji: True for emoji GIF, False for message GIF

    Returns:
        Tuple of (passes: bool, info: dict with details)
    """
    info = {
        'width': width,
        'height': height,
        'is_square': width == height,
        'type': 'emoji' if is_emoji else 'message'
    }

    if is_emoji:
        # Emoji GIFs should be 128x128
        optimal = width == height == 128
        acceptable = width == height and 64 <= width <= 128

        info['optimal'] = optimal
        info['acceptable'] = acceptable

        if optimal:
            print(f"✓ {width}x{height} - optimal for emoji")
            passes = True
        elif acceptable:
            print(f"⚠ {width}x{height} - acceptable but 128x128 is optimal")
            passes = True
        else:
            print(f"✗ {width}x{height} - emoji should be square, 128x128 recommended")
            passes = False
    else:
        # Message GIFs should be square-ish and reasonable size
        aspect_ratio = max(width, height) / min(width, height) if min(width, height) > 0 else float('inf')
        reasonable_size = 320 <= min(width, height) <= 640

        info['aspect_ratio'] = aspect_ratio
        info['reasonable_size'] = reasonable_size

        # Check if roughly square (within 2:1 ratio)
        is_square_ish = aspect_ratio <= 2.0

        if is_square_ish and reasonable_size:
            print(f"✓ {width}x{height} - good for message GIF")
            passes = True
        elif is_square_ish:
            print(f"⚠ {width}x{height} - square-ish but unusual size")
            passes = True
        elif reasonable_size:
            print(f"⚠ {width}x{height} - good size but not square-ish")
            passes = True
        else:
            print(f"✗ {width}x{height} - unusual dimensions for Slack")
            passes = False

    return passes, info


def validate_gif(gif_path: str | Path, is_emoji: bool = True) -> tuple[bool, dict]:
    """
    Run all validations on a GIF file.

    Args:
        gif_path: Path to GIF file
        is_emoji: True for emoji GIF, False for message GIF

    Returns:
        Tuple of (all_pass: bool, results: dict)
    """
    from PIL import Image

    gif_path = Path(gif_path)

    if not gif_path.exists():
        return False, {'error': f'File not found: {gif_path}'}

    print(f"\nValidating {gif_path.name} as {'emoji' if is_emoji else 'message'} GIF:")
    print("=" * 60)

    # Check file size
    size_pass, size_info = check_slack_size(gif_path, is_emoji)

    # Check dimensions
    try:
        with Image.open(gif_path) as img:
            width, height = img.size
            dim_pass, dim_info = validate_dimensions(width, height, is_emoji)

            # Count frames
            frame_count = 0
            try:
                while True:
                    img.seek(frame_count)
                    frame_count += 1
            except EOFError:
                pass

            # Get duration if available
            try:
                duration_ms = img.info.get('duration', 100)
                total_duration = (duration_ms * frame_count) / 1000
                fps = frame_count / total_duration if total_duration > 0 else 0
            except:
                duration_ms = None
                total_duration = None
                fps = None

    except Exception as e:
        return False, {'error': f'Failed to read GIF: {e}'}

    print(f"\nFrames: {frame_count}")
    if total_duration:
        print(f"Duration: {total_duration:.1f}s @ {fps:.1f} fps")

    all_pass = size_pass and dim_pass

    results = {
        'file': str(gif_path),
        'passes': all_pass,
        'size': size_info,
        'dimensions': dim_info,
        'frame_count': frame_count,
        'duration_seconds': total_duration,
        'fps': fps
    }

    print("=" * 60)
    if all_pass:
        print("✓ All validations passed!")
    else:
        print("✗ Some validations failed")
    print()

    return all_pass, results


def get_optimization_suggestions(results: dict) -> list[str]:
    """
    Get suggestions for optimizing a GIF based on validation results.

    Args:
        results: Results dict from validate_gif()

    Returns:
        List of suggestion strings
    """
    suggestions = []

    if not results.get('passes', False):
        size_info = results.get('size', {})
        dim_info = results.get('dimensions', {})

        # Size suggestions
        if not size_info.get('passes', True):
            overage = size_info['size_kb'] - size_info['limit_kb']
            if size_info['type'] == 'emoji':
                suggestions.append(f"Reduce file size by {overage:.1f} KB:")
                suggestions.append("  - Limit to 10-12 frames")
                suggestions.append("  - Use 32-40 colors maximum")
                suggestions.append("  - Remove gradients (solid colors compress better)")
                suggestions.append("  - Simplify design")
            else:
                suggestions.append(f"Reduce file size by {overage:.1f} KB:")
                suggestions.append("  - Reduce frame count or FPS")
                suggestions.append("  - Use fewer colors (128 → 64)")
                suggestions.append("  - Reduce dimensions")

        # Dimension suggestions
        if not dim_info.get('optimal', True) and dim_info.get('type') == 'emoji':
            suggestions.append("For optimal emoji GIF:")
            suggestions.append("  - Use 128x128 dimensions")
            suggestions.append("  - Ensure square aspect ratio")

    return suggestions


# Convenience function for quick checks
def is_slack_ready(gif_path: str | Path, is_emoji: bool = True, verbose: bool = True) -> bool:
    """
    Quick check if GIF is ready for Slack.

    Args:
        gif_path: Path to GIF file
        is_emoji: True for emoji GIF, False for message GIF
        verbose: Print detailed feedback

    Returns:
        True if ready, False otherwise
    """
    if verbose:
        passes, results = validate_gif(gif_path, is_emoji)
        if not passes:
            suggestions = get_optimization_suggestions(results)
            if suggestions:
                print("\nSuggestions:")
                for suggestion in suggestions:
                    print(suggestion)
        return passes
    else:
        size_pass, _ = check_slack_size(gif_path, is_emoji)
        return size_pass
