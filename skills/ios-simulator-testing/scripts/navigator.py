#!/usr/bin/env python3
"""
iOS Simulator Navigator - Smart Element Finder and Interactor

Finds and interacts with UI elements using accessibility data.
Prioritizes structured navigation over pixel-based interaction.

This script is the core automation tool for iOS simulator navigation. It finds
UI elements by text, type, or accessibility ID and performs actions on them
(tap, enter text). Uses semantic element finding instead of fragile pixel coordinates.

Key Features:
- Find elements by text (fuzzy or exact matching)
- Find elements by type (Button, TextField, etc.)
- Find elements by accessibility identifier
- Tap elements at their center point
- Enter text into text fields
- List all tappable elements on screen
- Automatic element caching for performance

Usage Examples:
    # Find and tap a button by text
    python scripts/navigator.py --find-text "Login" --tap --udid <device-id>

    # Enter text into first text field
    python scripts/navigator.py --find-type TextField --index 0 --enter-text "username" --udid <device-id>

    # Tap element by accessibility ID
    python scripts/navigator.py --find-id "submitButton" --tap --udid <device-id>

    # List all interactive elements
    python scripts/navigator.py --list --udid <device-id>

    # Tap at specific coordinates (fallback)
    python scripts/navigator.py --tap-at 200,400 --udid <device-id>

Output Format:
    Tapped: Button "Login" at (320, 450)
    Entered text in: TextField "Username"
    Not found: text='Submit'

Navigation Priority (best to worst):
    1. Find by accessibility label/text (most reliable)
    2. Find by element type + index (good for forms)
    3. Find by accessibility ID (precise but app-specific)
    4. Tap at coordinates (last resort, fragile)

Technical Details:
- Uses IDB's accessibility tree via `idb ui describe-all --json --nested`
- Caches tree for multiple operations (call with force_refresh to update)
- Finds elements by parsing tree recursively
- Calculates tap coordinates from element frame center
- Uses `idb ui tap` for tapping, `idb ui text` for text entry
- Extracts data from AXLabel, AXValue, and AXUniqueId fields
"""

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass

from common import flatten_tree, get_accessibility_tree


@dataclass
class Element:
    """Represents a UI element from accessibility tree."""

    type: str
    label: str | None
    value: str | None
    identifier: str | None
    frame: dict[str, float]
    traits: list[str]
    enabled: bool = True

    @property
    def center(self) -> tuple[int, int]:
        """Calculate center point for tapping."""
        x = int(self.frame["x"] + self.frame["width"] / 2)
        y = int(self.frame["y"] + self.frame["height"] / 2)
        return (x, y)

    @property
    def description(self) -> str:
        """Human-readable description."""
        label = self.label or self.value or self.identifier or "Unnamed"
        return f'{self.type} "{label}"'


class Navigator:
    """Navigates iOS apps using accessibility data."""

    def __init__(self, udid: str | None = None):
        """Initialize navigator with optional device UDID."""
        self.udid = udid
        self._tree_cache = None

    def get_accessibility_tree(self, force_refresh: bool = False) -> dict:
        """Get accessibility tree (cached for efficiency)."""
        if self._tree_cache and not force_refresh:
            return self._tree_cache

        # Delegate to shared utility
        self._tree_cache = get_accessibility_tree(self.udid, nested=True)
        return self._tree_cache

    def _flatten_tree(self, node: dict, elements: list[Element] | None = None) -> list[Element]:
        """Flatten accessibility tree into list of elements."""
        if elements is None:
            elements = []

        # Create element from node
        if node.get("type"):
            element = Element(
                type=node.get("type", "Unknown"),
                label=node.get("AXLabel"),
                value=node.get("AXValue"),
                identifier=node.get("AXUniqueId"),
                frame=node.get("frame", {}),
                traits=node.get("traits", []),
                enabled=node.get("enabled", True),
            )
            elements.append(element)

        # Process children
        for child in node.get("children", []):
            self._flatten_tree(child, elements)

        return elements

    def find_element(
        self,
        text: str | None = None,
        element_type: str | None = None,
        identifier: str | None = None,
        index: int = 0,
        fuzzy: bool = True,
    ) -> Element | None:
        """
        Find element by various criteria.

        Args:
            text: Text to search in label/value
            element_type: Type of element (Button, TextField, etc.)
            identifier: Accessibility identifier
            index: Which matching element to return (0-based)
            fuzzy: Use fuzzy matching for text

        Returns:
            Element if found, None otherwise
        """
        tree = self.get_accessibility_tree()
        elements = self._flatten_tree(tree)

        matches = []

        for elem in elements:
            # Skip disabled elements
            if not elem.enabled:
                continue

            # Check type
            if element_type and elem.type != element_type:
                continue

            # Check identifier (exact match)
            if identifier and elem.identifier != identifier:
                continue

            # Check text (in label or value)
            if text:
                elem_text = (elem.label or "") + " " + (elem.value or "")
                if fuzzy:
                    if text.lower() not in elem_text.lower():
                        continue
                elif text not in (elem.label, elem.value):
                    continue

            matches.append(elem)

        if matches and index < len(matches):
            return matches[index]

        return None

    def tap(self, element: Element) -> bool:
        """Tap on an element."""
        x, y = element.center
        return self.tap_at(x, y)

    def tap_at(self, x: int, y: int) -> bool:
        """Tap at specific coordinates."""
        cmd = ["idb", "ui", "tap", str(x), str(y)]
        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def enter_text(self, text: str, element: Element | None = None) -> bool:
        """
        Enter text into element or current focus.

        Args:
            text: Text to enter
            element: Optional element to tap first

        Returns:
            Success status
        """
        # Tap element if provided
        if element:
            if not self.tap(element):
                return False
            # Small delay for focus
            import time

            time.sleep(0.5)

        # Enter text
        cmd = ["idb", "ui", "text", text]
        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def find_and_tap(
        self,
        text: str | None = None,
        element_type: str | None = None,
        identifier: str | None = None,
        index: int = 0,
    ) -> tuple[bool, str]:
        """
        Find element and tap it.

        Returns:
            (success, message) tuple
        """
        element = self.find_element(text, element_type, identifier, index)

        if not element:
            criteria = []
            if text:
                criteria.append(f"text='{text}'")
            if element_type:
                criteria.append(f"type={element_type}")
            if identifier:
                criteria.append(f"id={identifier}")
            return (False, f"Not found: {', '.join(criteria)}")

        if self.tap(element):
            return (True, f"Tapped: {element.description} at {element.center}")
        return (False, f"Failed to tap: {element.description}")

    def find_and_enter_text(
        self,
        text_to_enter: str,
        find_text: str | None = None,
        element_type: str | None = "TextField",
        identifier: str | None = None,
        index: int = 0,
    ) -> tuple[bool, str]:
        """
        Find element and enter text into it.

        Returns:
            (success, message) tuple
        """
        element = self.find_element(find_text, element_type, identifier, index)

        if not element:
            return (False, "TextField not found")

        if self.enter_text(text_to_enter, element):
            return (True, f"Entered text in: {element.description}")
        return (False, "Failed to enter text")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Navigate iOS apps using accessibility data")

    # Finding options
    parser.add_argument("--find-text", help="Find element by text (fuzzy match)")
    parser.add_argument("--find-exact", help="Find element by exact text")
    parser.add_argument("--find-type", help="Element type (Button, TextField, etc.)")
    parser.add_argument("--find-id", help="Accessibility identifier")
    parser.add_argument("--index", type=int, default=0, help="Which match to use (0-based)")

    # Action options
    parser.add_argument("--tap", action="store_true", help="Tap the found element")
    parser.add_argument("--tap-at", help="Tap at coordinates (x,y)")
    parser.add_argument("--enter-text", help="Enter text into element")

    # Other options
    parser.add_argument("--udid", help="Device UDID")
    parser.add_argument("--list", action="store_true", help="List all tappable elements")

    args = parser.parse_args()

    navigator = Navigator(udid=args.udid)

    # List mode
    if args.list:
        tree = navigator.get_accessibility_tree()
        elements = navigator._flatten_tree(tree)

        # Filter to tappable elements
        tappable = [
            e
            for e in elements
            if e.enabled and e.type in ["Button", "Link", "Cell", "TextField", "SecureTextField"]
        ]

        print(f"Tappable elements ({len(tappable)}):")
        for elem in tappable[:10]:  # Limit output for tokens
            print(f"  {elem.type}: \"{elem.label or elem.value or 'Unnamed'}\" {elem.center}")

        if len(tappable) > 10:
            print(f"  ... and {len(tappable) - 10} more")
        sys.exit(0)

    # Direct tap at coordinates
    if args.tap_at:
        coords = args.tap_at.split(",")
        if len(coords) != 2:
            print("Error: --tap-at requires x,y format")
            sys.exit(1)

        x, y = int(coords[0]), int(coords[1])
        if navigator.tap_at(x, y):
            print(f"Tapped at ({x}, {y})")
        else:
            print(f"Failed to tap at ({x}, {y})")
            sys.exit(1)

    # Find and tap
    elif args.tap:
        text = args.find_text or args.find_exact
        fuzzy = args.find_text is not None

        success, message = navigator.find_and_tap(
            text=text, element_type=args.find_type, identifier=args.find_id, index=args.index
        )

        print(message)
        if not success:
            sys.exit(1)

    # Find and enter text
    elif args.enter_text:
        text = args.find_text or args.find_exact

        success, message = navigator.find_and_enter_text(
            text_to_enter=args.enter_text,
            find_text=text,
            element_type=args.find_type or "TextField",
            identifier=args.find_id,
            index=args.index,
        )

        print(message)
        if not success:
            sys.exit(1)

    # Just find (no action)
    else:
        text = args.find_text or args.find_exact
        fuzzy = args.find_text is not None

        element = navigator.find_element(
            text=text,
            element_type=args.find_type,
            identifier=args.find_id,
            index=args.index,
            fuzzy=fuzzy,
        )

        if element:
            print(f"Found: {element.description} at {element.center}")
        else:
            print("Element not found")
            sys.exit(1)


if __name__ == "__main__":
    main()
