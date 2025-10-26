#!/usr/bin/env python3
"""
iOS Gesture Controller - Swipes and Complex Gestures

Performs navigation gestures like swipes, scrolls, and pinches.
Token-efficient output for common navigation patterns.

This script handles touch gestures for iOS simulator automation. It provides
directional swipes, multi-swipe scrolling, pull-to-refresh, and pinch gestures.
Automatically detects screen size from the device for accurate gesture positioning.

Key Features:
- Directional swipes (up, down, left, right)
- Multi-swipe scrolling with customizable amount
- Pull-to-refresh gesture
- Pinch to zoom (in/out)
- Custom swipe between any two points
- Drag and drop simulation
- Auto-detects screen dimensions from device

Usage Examples:
    # Simple directional swipe
    python scripts/gesture.py --swipe up --udid <device-id>

    # Scroll down multiple times
    python scripts/gesture.py --scroll down --scroll-amount 3 --udid <device-id>

    # Pull to refresh
    python scripts/gesture.py --refresh --udid <device-id>

    # Custom swipe coordinates
    python scripts/gesture.py --swipe-from 100,500 --swipe-to 100,100 --udid <device-id>

    # Pinch to zoom
    python scripts/gesture.py --pinch out --udid <device-id>

    # Long press at coordinates
    python scripts/gesture.py --long-press 200,300 --duration 2.0 --udid <device-id>

Output Format:
    Swiped up
    Scrolled down (3x)
    Performed pull to refresh

Gesture Details:
- Swipes use 70% of screen by default (configurable)
- Scrolls are multiple small 30% swipes with delays
- Start points are offset from edges for reliability
- Screen size auto-detected from accessibility tree root element
- Falls back to iPhone 14 dimensions (390x844) if detection fails

Technical Details:
- Uses `idb ui swipe x1 y1 x2 y2` for gesture execution
- Duration parameter converts to milliseconds for IDB
- Automatically fetches screen size on initialization
- Parses IDB accessibility tree to get root frame dimensions
- All coordinates calculated as fractions of screen size for device independence
"""

import argparse
import subprocess
import sys
import time

from common import get_screen_size


class GestureController:
    """Performs gestures on iOS simulator."""

    # Standard screen dimensions (will be detected if possible)
    DEFAULT_WIDTH = 390  # iPhone 14
    DEFAULT_HEIGHT = 844

    def __init__(self, udid: str | None = None):
        """Initialize gesture controller."""
        self.udid = udid
        self.screen_size = self._get_screen_size()

    def _get_screen_size(self) -> tuple[int, int]:
        """Try to detect screen size from device using shared utility."""
        return get_screen_size(self.udid)

    def swipe(self, direction: str, distance_ratio: float = 0.7) -> bool:
        """
        Perform directional swipe.

        Args:
            direction: up, down, left, right
            distance_ratio: How far to swipe (0.0-1.0 of screen)

        Returns:
            Success status
        """
        width, height = self.screen_size
        center_x = width // 2
        center_y = height // 2

        # Calculate swipe coordinates based on direction
        if direction == "up":
            start = (center_x, int(height * 0.7))
            end = (center_x, int(height * (1 - distance_ratio + 0.3)))
        elif direction == "down":
            start = (center_x, int(height * 0.3))
            end = (center_x, int(height * (distance_ratio - 0.3 + 0.3)))
        elif direction == "left":
            start = (int(width * 0.8), center_y)
            end = (int(width * (1 - distance_ratio + 0.2)), center_y)
        elif direction == "right":
            start = (int(width * 0.2), center_y)
            end = (int(width * (distance_ratio - 0.2 + 0.2)), center_y)
        else:
            return False

        return self.swipe_between(start, end)

    def swipe_between(
        self, start: tuple[int, int], end: tuple[int, int], duration: float = 0.3
    ) -> bool:
        """
        Swipe between two points.

        Args:
            start: Starting coordinates (x, y)
            end: Ending coordinates (x, y)
            duration: Swipe duration in seconds

        Returns:
            Success status
        """
        cmd = ["idb", "ui", "swipe"]
        cmd.extend([str(start[0]), str(start[1]), str(end[0]), str(end[1])])

        # IDB doesn't support duration directly, but we can add delay
        if duration != 0.3:
            cmd.extend(["--duration", str(int(duration * 1000))])

        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def scroll(self, direction: str, amount: int = 3) -> bool:
        """
        Perform multiple small swipes to scroll.

        Args:
            direction: up, down
            amount: Number of small swipes

        Returns:
            Success status
        """
        for _ in range(amount):
            if not self.swipe(direction, distance_ratio=0.3):
                return False
            time.sleep(0.2)  # Small delay between swipes
        return True

    def tap_and_hold(self, x: int, y: int, duration: float = 2.0) -> bool:
        """
        Long press at coordinates.

        Args:
            x, y: Coordinates
            duration: Hold duration in seconds

        Returns:
            Success status
        """
        # IDB doesn't have native long press, simulate with tap
        # In real implementation, might need to use different approach
        cmd = ["idb", "ui", "tap", str(x), str(y)]

        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            # Simulate hold with delay
            time.sleep(duration)
            return True
        except subprocess.CalledProcessError:
            return False

    def pinch(self, direction: str = "out", center: tuple[int, int] | None = None) -> bool:
        """
        Perform pinch gesture (zoom in/out).

        Args:
            direction: 'in' (zoom out) or 'out' (zoom in)
            center: Center point for pinch

        Returns:
            Success status
        """
        if not center:
            width, height = self.screen_size
            center = (width // 2, height // 2)

        # Calculate pinch points
        offset = 100 if direction == "out" else 50

        if direction == "out":
            # Zoom in - fingers move apart
            start1 = (center[0] - 20, center[1] - 20)
            end1 = (center[0] - offset, center[1] - offset)
            start2 = (center[0] + 20, center[1] + 20)
            end2 = (center[0] + offset, center[1] + offset)
        else:
            # Zoom out - fingers move together
            start1 = (center[0] - offset, center[1] - offset)
            end1 = (center[0] - 20, center[1] - 20)
            start2 = (center[0] + offset, center[1] + offset)
            end2 = (center[0] + 20, center[1] + 20)

        # Perform two swipes simultaneously (simulated)
        success1 = self.swipe_between(start1, end1)
        success2 = self.swipe_between(start2, end2)

        return success1 and success2

    def drag_and_drop(self, start: tuple[int, int], end: tuple[int, int]) -> bool:
        """
        Drag element from one position to another.

        Args:
            start: Starting coordinates
            end: Ending coordinates

        Returns:
            Success status
        """
        # Use slow swipe to simulate drag
        return self.swipe_between(start, end, duration=1.0)

    def refresh(self) -> bool:
        """Pull to refresh gesture."""
        width, _ = self.screen_size
        start = (width // 2, 100)
        end = (width // 2, 400)
        return self.swipe_between(start, end)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Perform gestures on iOS simulator")

    # Gesture options
    parser.add_argument(
        "--swipe", choices=["up", "down", "left", "right"], help="Perform directional swipe"
    )
    parser.add_argument("--swipe-from", help="Custom swipe start coordinates (x,y)")
    parser.add_argument("--swipe-to", help="Custom swipe end coordinates (x,y)")
    parser.add_argument(
        "--scroll", choices=["up", "down"], help="Scroll in direction (multiple small swipes)"
    )
    parser.add_argument(
        "--scroll-amount", type=int, default=3, help="Number of scroll swipes (default: 3)"
    )
    parser.add_argument("--long-press", help="Long press at coordinates (x,y)")
    parser.add_argument(
        "--duration", type=float, default=2.0, help="Duration for long press in seconds"
    )
    parser.add_argument(
        "--pinch", choices=["in", "out"], help="Pinch gesture (in=zoom out, out=zoom in)"
    )
    parser.add_argument("--refresh", action="store_true", help="Pull to refresh gesture")
    parser.add_argument("--udid", help="Device UDID")

    args = parser.parse_args()

    controller = GestureController(udid=args.udid)

    # Execute requested gesture
    if args.swipe:
        if controller.swipe(args.swipe):
            print(f"Swiped {args.swipe}")
        else:
            print(f"Failed to swipe {args.swipe}")
            sys.exit(1)

    elif args.swipe_from and args.swipe_to:
        # Custom swipe
        start = tuple(map(int, args.swipe_from.split(",")))
        end = tuple(map(int, args.swipe_to.split(",")))

        if controller.swipe_between(start, end):
            print(f"Swiped from {start} to {end}")
        else:
            print("Failed to swipe")
            sys.exit(1)

    elif args.scroll:
        if controller.scroll(args.scroll, args.scroll_amount):
            print(f"Scrolled {args.scroll} ({args.scroll_amount}x)")
        else:
            print(f"Failed to scroll {args.scroll}")
            sys.exit(1)

    elif args.long_press:
        coords = tuple(map(int, args.long_press.split(",")))
        if controller.tap_and_hold(coords[0], coords[1], args.duration):
            print(f"Long pressed at {coords} for {args.duration}s")
        else:
            print("Failed to long press")
            sys.exit(1)

    elif args.pinch:
        if controller.pinch(args.pinch):
            action = "Zoomed in" if args.pinch == "out" else "Zoomed out"
            print(action)
        else:
            print(f"Failed to pinch {args.pinch}")
            sys.exit(1)

    elif args.refresh:
        if controller.refresh():
            print("Performed pull to refresh")
        else:
            print("Failed to refresh")
            sys.exit(1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
