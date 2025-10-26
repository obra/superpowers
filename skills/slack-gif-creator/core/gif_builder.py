#!/usr/bin/env python3
"""
GIF Builder - Core module for assembling frames into GIFs optimized for Slack.

This module provides the main interface for creating GIFs from programmatically
generated frames, with automatic optimization for Slack's requirements.
"""

from pathlib import Path
from typing import Optional
import imageio.v3 as imageio
from PIL import Image
import numpy as np


class GIFBuilder:
    """Builder for creating optimized GIFs from frames."""

    def __init__(self, width: int = 480, height: int = 480, fps: int = 15):
        """
        Initialize GIF builder.

        Args:
            width: Frame width in pixels
            height: Frame height in pixels
            fps: Frames per second
        """
        self.width = width
        self.height = height
        self.fps = fps
        self.frames: list[np.ndarray] = []

    def add_frame(self, frame: np.ndarray | Image.Image):
        """
        Add a frame to the GIF.

        Args:
            frame: Frame as numpy array or PIL Image (will be converted to RGB)
        """
        if isinstance(frame, Image.Image):
            frame = np.array(frame.convert('RGB'))

        # Ensure frame is correct size
        if frame.shape[:2] != (self.height, self.width):
            pil_frame = Image.fromarray(frame)
            pil_frame = pil_frame.resize((self.width, self.height), Image.Resampling.LANCZOS)
            frame = np.array(pil_frame)

        self.frames.append(frame)

    def add_frames(self, frames: list[np.ndarray | Image.Image]):
        """Add multiple frames at once."""
        for frame in frames:
            self.add_frame(frame)

    def optimize_colors(self, num_colors: int = 128, use_global_palette: bool = True) -> list[np.ndarray]:
        """
        Reduce colors in all frames using quantization.

        Args:
            num_colors: Target number of colors (8-256)
            use_global_palette: Use a single palette for all frames (better compression)

        Returns:
            List of color-optimized frames
        """
        optimized = []

        if use_global_palette and len(self.frames) > 1:
            # Create a global palette from all frames
            # Sample frames to build palette
            sample_size = min(5, len(self.frames))
            sample_indices = [int(i * len(self.frames) / sample_size) for i in range(sample_size)]
            sample_frames = [self.frames[i] for i in sample_indices]

            # Combine sample frames into a single image for palette generation
            # Flatten each frame to get all pixels, then stack them
            all_pixels = np.vstack([f.reshape(-1, 3) for f in sample_frames])  # (total_pixels, 3)

            # Create a properly-shaped RGB image from the pixel data
            # We'll make a roughly square image from all the pixels
            total_pixels = len(all_pixels)
            width = min(512, int(np.sqrt(total_pixels)))  # Reasonable width, max 512
            height = (total_pixels + width - 1) // width  # Ceiling division

            # Pad if necessary to fill the rectangle
            pixels_needed = width * height
            if pixels_needed > total_pixels:
                padding = np.zeros((pixels_needed - total_pixels, 3), dtype=np.uint8)
                all_pixels = np.vstack([all_pixels, padding])

            # Reshape to proper RGB image format (H, W, 3)
            img_array = all_pixels[:pixels_needed].reshape(height, width, 3).astype(np.uint8)
            combined_img = Image.fromarray(img_array, mode='RGB')

            # Generate global palette
            global_palette = combined_img.quantize(colors=num_colors, method=2)

            # Apply global palette to all frames
            for frame in self.frames:
                pil_frame = Image.fromarray(frame)
                quantized = pil_frame.quantize(palette=global_palette, dither=1)
                optimized.append(np.array(quantized.convert('RGB')))
        else:
            # Use per-frame quantization
            for frame in self.frames:
                pil_frame = Image.fromarray(frame)
                quantized = pil_frame.quantize(colors=num_colors, method=2, dither=1)
                optimized.append(np.array(quantized.convert('RGB')))

        return optimized

    def deduplicate_frames(self, threshold: float = 0.995) -> int:
        """
        Remove duplicate or near-duplicate consecutive frames.

        Args:
            threshold: Similarity threshold (0.0-1.0). Higher = more strict (0.995 = very similar).

        Returns:
            Number of frames removed
        """
        if len(self.frames) < 2:
            return 0

        deduplicated = [self.frames[0]]
        removed_count = 0

        for i in range(1, len(self.frames)):
            # Compare with previous frame
            prev_frame = np.array(deduplicated[-1], dtype=np.float32)
            curr_frame = np.array(self.frames[i], dtype=np.float32)

            # Calculate similarity (normalized)
            diff = np.abs(prev_frame - curr_frame)
            similarity = 1.0 - (np.mean(diff) / 255.0)

            # Keep frame if sufficiently different
            # High threshold (0.995) means only remove truly identical frames
            if similarity < threshold:
                deduplicated.append(self.frames[i])
            else:
                removed_count += 1

        self.frames = deduplicated
        return removed_count

    def save(self, output_path: str | Path, num_colors: int = 128,
             optimize_for_emoji: bool = False, remove_duplicates: bool = True) -> dict:
        """
        Save frames as optimized GIF for Slack.

        Args:
            output_path: Where to save the GIF
            num_colors: Number of colors to use (fewer = smaller file)
            optimize_for_emoji: If True, optimize for <64KB emoji size
            remove_duplicates: Remove duplicate consecutive frames

        Returns:
            Dictionary with file info (path, size, dimensions, frame_count)
        """
        if not self.frames:
            raise ValueError("No frames to save. Add frames with add_frame() first.")

        output_path = Path(output_path)
        original_frame_count = len(self.frames)

        # Remove duplicate frames to reduce file size
        if remove_duplicates:
            removed = self.deduplicate_frames(threshold=0.98)
            if removed > 0:
                print(f"  Removed {removed} duplicate frames")

        # Optimize for emoji if requested
        if optimize_for_emoji:
            if self.width > 128 or self.height > 128:
                print(f"  Resizing from {self.width}x{self.height} to 128x128 for emoji")
                self.width = 128
                self.height = 128
                # Resize all frames
                resized_frames = []
                for frame in self.frames:
                    pil_frame = Image.fromarray(frame)
                    pil_frame = pil_frame.resize((128, 128), Image.Resampling.LANCZOS)
                    resized_frames.append(np.array(pil_frame))
                self.frames = resized_frames
            num_colors = min(num_colors, 48)  # More aggressive color limit for emoji

            # More aggressive FPS reduction for emoji
            if len(self.frames) > 12:
                print(f"  Reducing frames from {len(self.frames)} to ~12 for emoji size")
                # Keep every nth frame to get close to 12 frames
                keep_every = max(1, len(self.frames) // 12)
                self.frames = [self.frames[i] for i in range(0, len(self.frames), keep_every)]

        # Optimize colors with global palette
        optimized_frames = self.optimize_colors(num_colors, use_global_palette=True)

        # Calculate frame duration in milliseconds
        frame_duration = 1000 / self.fps

        # Save GIF
        imageio.imwrite(
            output_path,
            optimized_frames,
            duration=frame_duration,
            loop=0  # Infinite loop
        )

        # Get file info
        file_size_kb = output_path.stat().st_size / 1024
        file_size_mb = file_size_kb / 1024

        info = {
            'path': str(output_path),
            'size_kb': file_size_kb,
            'size_mb': file_size_mb,
            'dimensions': f'{self.width}x{self.height}',
            'frame_count': len(optimized_frames),
            'fps': self.fps,
            'duration_seconds': len(optimized_frames) / self.fps,
            'colors': num_colors
        }

        # Print info
        print(f"\n✓ GIF created successfully!")
        print(f"  Path: {output_path}")
        print(f"  Size: {file_size_kb:.1f} KB ({file_size_mb:.2f} MB)")
        print(f"  Dimensions: {self.width}x{self.height}")
        print(f"  Frames: {len(optimized_frames)} @ {self.fps} fps")
        print(f"  Duration: {info['duration_seconds']:.1f}s")
        print(f"  Colors: {num_colors}")

        # Warnings
        if optimize_for_emoji and file_size_kb > 64:
            print(f"\n⚠️  WARNING: Emoji file size ({file_size_kb:.1f} KB) exceeds 64 KB limit")
            print("   Try: fewer frames, fewer colors, or simpler design")
        elif not optimize_for_emoji and file_size_kb > 2048:
            print(f"\n⚠️  WARNING: File size ({file_size_kb:.1f} KB) is large for Slack")
            print("   Try: fewer frames, smaller dimensions, or fewer colors")

        return info

    def clear(self):
        """Clear all frames (useful for creating multiple GIFs)."""
        self.frames = []