#!/usr/bin/env python3
"""
Visual Diff Tool for iOS Simulator Screenshots

Compares two screenshots pixel-by-pixel to detect visual changes.
Optimized for minimal token output.

Usage: python scripts/visual_diff.py baseline.png current.png [options]
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError:
    print("Error: Pillow not installed. Run: pip3 install pillow")
    sys.exit(1)


class VisualDiffer:
    """Performs visual comparison between screenshots."""

    def __init__(self, threshold: float = 0.01):
        """
        Initialize differ with threshold.

        Args:
            threshold: Maximum acceptable difference ratio (0.01 = 1%)
        """
        self.threshold = threshold

    def compare(self, baseline_path: str, current_path: str) -> dict:
        """
        Compare two images and return difference metrics.

        Args:
            baseline_path: Path to baseline image
            current_path: Path to current image

        Returns:
            Dictionary with comparison results
        """
        # Load images
        try:
            baseline = Image.open(baseline_path)
            current = Image.open(current_path)
        except FileNotFoundError as e:
            print(f"Error: Image not found - {e}")
            sys.exit(1)
        except Exception as e:
            print(f"Error: Failed to load image - {e}")
            sys.exit(1)

        # Verify dimensions match
        if baseline.size != current.size:
            return {
                "error": "Image dimensions do not match",
                "baseline_size": baseline.size,
                "current_size": current.size,
            }

        # Convert to RGB if needed
        if baseline.mode != "RGB":
            baseline = baseline.convert("RGB")
        if current.mode != "RGB":
            current = current.convert("RGB")

        # Calculate difference
        diff = ImageChops.difference(baseline, current)

        # Calculate metrics
        total_pixels = baseline.size[0] * baseline.size[1]
        diff_pixels = self._count_different_pixels(diff)
        diff_percentage = (diff_pixels / total_pixels) * 100

        # Determine pass/fail
        passed = diff_percentage <= (self.threshold * 100)

        return {
            "dimensions": baseline.size,
            "total_pixels": total_pixels,
            "different_pixels": diff_pixels,
            "difference_percentage": round(diff_percentage, 2),
            "threshold_percentage": self.threshold * 100,
            "passed": passed,
            "verdict": "PASS" if passed else "FAIL",
        }

    def _count_different_pixels(self, diff_image: Image.Image) -> int:
        """Count number of pixels that are different."""
        # Convert to grayscale for easier processing
        diff_gray = diff_image.convert("L")

        # Count non-zero pixels (different)
        pixels = diff_gray.getdata()
        return sum(1 for pixel in pixels if pixel > 10)  # Threshold for noise

    def generate_diff_image(self, baseline_path: str, current_path: str, output_path: str) -> None:
        """Generate highlighted difference image."""
        baseline = Image.open(baseline_path).convert("RGB")
        current = Image.open(current_path).convert("RGB")

        # Create difference image
        diff = ImageChops.difference(baseline, current)

        # Enhance differences with red overlay
        diff_enhanced = Image.new("RGB", baseline.size)
        for x in range(baseline.size[0]):
            for y in range(baseline.size[1]):
                diff_pixel = diff.getpixel((x, y))
                if sum(diff_pixel) > 30:  # Threshold for visibility
                    # Highlight in red
                    diff_enhanced.putpixel((x, y), (255, 0, 0))
                else:
                    # Keep original
                    diff_enhanced.putpixel((x, y), current.getpixel((x, y)))

        diff_enhanced.save(output_path)

    def generate_side_by_side(
        self, baseline_path: str, current_path: str, output_path: str
    ) -> None:
        """Generate side-by-side comparison image."""
        baseline = Image.open(baseline_path)
        current = Image.open(current_path)

        # Create combined image
        width = baseline.size[0] * 2 + 10  # 10px separator
        height = max(baseline.size[1], current.size[1])
        combined = Image.new("RGB", (width, height), color=(128, 128, 128))

        # Paste images
        combined.paste(baseline, (0, 0))
        combined.paste(current, (baseline.size[0] + 10, 0))

        combined.save(output_path)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Compare screenshots for visual differences")
    parser.add_argument("baseline", help="Path to baseline screenshot")
    parser.add_argument("current", help="Path to current screenshot")
    parser.add_argument(
        "--output",
        default=".",
        help="Output directory for diff artifacts (default: current directory)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.01,
        help="Acceptable difference threshold (0.01 = 1%%, default: 0.01)",
    )
    parser.add_argument(
        "--details", action="store_true", help="Show detailed output (increases tokens)"
    )

    args = parser.parse_args()

    # Create output directory if needed
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize differ
    differ = VisualDiffer(threshold=args.threshold)

    # Perform comparison
    result = differ.compare(args.baseline, args.current)

    # Handle dimension mismatch
    if "error" in result:
        print(f"Error: {result['error']}")
        print(f"Baseline: {result['baseline_size']}")
        print(f"Current: {result['current_size']}")
        sys.exit(1)

    # Generate artifacts
    diff_image_path = output_dir / "diff.png"
    comparison_image_path = output_dir / "side-by-side.png"

    try:
        differ.generate_diff_image(args.baseline, args.current, str(diff_image_path))
        differ.generate_side_by_side(args.baseline, args.current, str(comparison_image_path))
    except Exception as e:
        print(f"Warning: Could not generate images - {e}")

    # Output results (token-optimized)
    if args.details:
        # Detailed output
        report = {
            "summary": {
                "baseline": args.baseline,
                "current": args.current,
                "threshold": args.threshold,
                "passed": result["passed"],
            },
            "results": result,
            "artifacts": {
                "diff_image": str(diff_image_path),
                "comparison_image": str(comparison_image_path),
            },
        }
        print(json.dumps(report, indent=2))
    else:
        # Minimal output (default)
        print(f"Difference: {result['difference_percentage']}% ({result['verdict']})")
        if result["different_pixels"] > 0:
            print(f"Changed pixels: {result['different_pixels']:,}")
        print(f"Artifacts saved to: {output_dir}/")

    # Save JSON report
    report_path = output_dir / "diff-report.json"
    with open(report_path, "w") as f:
        json.dump(
            {
                "baseline": os.path.basename(args.baseline),
                "current": os.path.basename(args.current),
                "results": result,
                "artifacts": {"diff": "diff.png", "comparison": "side-by-side.png"},
            },
            f,
            indent=2,
        )

    # Exit with error if test failed
    sys.exit(0 if result["passed"] else 1)


if __name__ == "__main__":
    main()
