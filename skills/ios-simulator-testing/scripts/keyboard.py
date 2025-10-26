#!/usr/bin/env python3
"""
iOS Keyboard Controller - Text Entry and Hardware Buttons

Handles keyboard input, special keys, and hardware button simulation.
Token-efficient text entry and navigation control.

This script provides text input and hardware button control for iOS simulator
automation. It handles both typing text strings and pressing special keys like
return, delete, tab, etc. Also controls hardware buttons like home and lock.

Key Features:
- Type text strings into focused elements
- Press special keys (return, delete, tab, space, arrows)
- Hardware button simulation (home, lock, volume, screenshot)
- Character-by-character typing with delays (for animations)
- Multiple key press support
- iOS HID key code mapping for reliability

Usage Examples:
    # Type text into focused field
    python scripts/keyboard.py --type "hello@example.com" --udid <device-id>

    # Press return key to submit
    python scripts/keyboard.py --key return --udid <device-id>

    # Press delete 3 times
    python scripts/keyboard.py --key delete --key delete --key delete --udid <device-id>

    # Press home button
    python scripts/keyboard.py --button home --udid <device-id>

    # Press lock button
    python scripts/keyboard.py --button lock --udid <device-id>

    # Type with delay between characters (for animations)
    python scripts/keyboard.py --type "slow typing" --delay 0.1 --udid <device-id>

Output Format:
    Typed: "hello@example.com"
    Pressed return
    Pressed home button

Special Keys Supported:
- return/enter: Submit forms, new lines (HID code 40)
- delete/backspace: Remove characters (HID code 42)
- tab: Navigate between fields (HID code 43)
- space: Space character (HID code 44)
- escape: Cancel/dismiss (HID code 41)
- up/down/left/right: Arrow keys (HID codes 82/81/80/79)

Hardware Buttons Supported:
- home: Return to home screen
- lock/power: Lock device
- volume-up/volume-down: Volume control
- ringer: Toggle mute
- screenshot: Capture screen

Technical Details:
- Uses `idb ui text` for typing text strings
- Uses `idb ui key <code>` for special keys with iOS HID codes
- HID codes from Apple's UIKeyboardHIDUsage specification
- Hardware buttons use `xcrun simctl` button actions
- Text entry works on currently focused element
- Special keys are integers (40=Return, 42=Delete, etc.)
"""

import argparse
import subprocess
import sys
import time


class KeyboardController:
    """Controls keyboard and hardware buttons on iOS simulator."""

    # Special key mappings to iOS HID key codes
    # See: https://developer.apple.com/documentation/uikit/uikeyboardhidusage
    SPECIAL_KEYS = {
        "return": 40,
        "enter": 40,
        "delete": 42,
        "backspace": 42,
        "tab": 43,
        "space": 44,
        "escape": 41,
        "up": 82,
        "down": 81,
        "left": 80,
        "right": 79,
    }

    # Hardware button mappings
    HARDWARE_BUTTONS = {
        "home": "HOME",
        "lock": "LOCK",
        "volume-up": "VOLUME_UP",
        "volume-down": "VOLUME_DOWN",
        "ringer": "RINGER",
        "power": "LOCK",  # Alias
        "screenshot": "SCREENSHOT",
    }

    def __init__(self, udid: str | None = None):
        """Initialize keyboard controller."""
        self.udid = udid

    def type_text(self, text: str, delay: float = 0.0) -> bool:
        """
        Type text into current focus.

        Args:
            text: Text to type
            delay: Delay between characters (for slow typing effect)

        Returns:
            Success status
        """
        if delay > 0:
            # Type character by character with delay
            for char in text:
                if not self._type_single(char):
                    return False
                time.sleep(delay)
            return True
        # Type all at once (efficient)
        return self._type_single(text)

    def _type_single(self, text: str) -> bool:
        """Type text using IDB."""
        cmd = ["idb", "ui", "text", text]
        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def press_key(self, key: str, count: int = 1) -> bool:
        """
        Press a special key.

        Args:
            key: Key name (return, delete, tab, etc.)
            count: Number of times to press

        Returns:
            Success status
        """
        # Map key name to IDB key code
        key_code = self.SPECIAL_KEYS.get(key.lower())
        if not key_code:
            # Try as literal integer key code
            try:
                key_code = int(key)
            except ValueError:
                return False

        cmd = ["idb", "ui", "key", str(key_code)]
        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            for _ in range(count):
                subprocess.run(cmd, capture_output=True, check=True)
                if count > 1:
                    time.sleep(0.1)  # Small delay for multiple presses
            return True
        except subprocess.CalledProcessError:
            return False

    def press_key_sequence(self, keys: list[str]) -> bool:
        """
        Press a sequence of keys.

        Args:
            keys: List of key names

        Returns:
            Success status
        """
        cmd_base = ["idb", "ui", "key-sequence"]

        # Map keys to codes
        mapped_keys = []
        for key in keys:
            mapped = self.SPECIAL_KEYS.get(key.lower())
            if mapped is None:
                # Try as integer
                try:
                    mapped = int(key)
                except ValueError:
                    return False
            mapped_keys.append(str(mapped))

        cmd = cmd_base + mapped_keys

        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def press_hardware_button(self, button: str) -> bool:
        """
        Press hardware button.

        Args:
            button: Button name (home, lock, volume-up, etc.)

        Returns:
            Success status
        """
        button_code = self.HARDWARE_BUTTONS.get(button.lower())
        if not button_code:
            return False

        cmd = ["idb", "ui", "button", button_code]
        if self.udid:
            cmd.extend(["--udid", self.udid])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def clear_text(self, select_all: bool = True) -> bool:
        """
        Clear text in current field.

        Args:
            select_all: Use Cmd+A to select all first

        Returns:
            Success status
        """
        if select_all:
            # Select all then delete
            # Note: This might need adjustment for iOS keyboard shortcuts
            success = self.press_key_combo(["cmd", "a"])
            if success:
                return self.press_key("delete")
        else:
            # Just delete multiple times
            return self.press_key("delete", count=50)
        return None

    def press_key_combo(self, keys: list[str]) -> bool:
        """
        Press key combination (like Cmd+A).

        Args:
            keys: List of keys to press together

        Returns:
            Success status
        """
        # IDB doesn't directly support key combos
        # This is a workaround - may need platform-specific handling
        if "cmd" in keys or "command" in keys:
            # Handle common shortcuts
            if "a" in keys:
                # Select all - might work with key sequence
                return self.press_key_sequence(["command", "a"])
            if "c" in keys:
                return self.press_key_sequence(["command", "c"])
            if "v" in keys:
                return self.press_key_sequence(["command", "v"])
            if "x" in keys:
                return self.press_key_sequence(["command", "x"])

        # Try as sequence
        return self.press_key_sequence(keys)

    def dismiss_keyboard(self) -> bool:
        """Dismiss on-screen keyboard."""
        # Common ways to dismiss keyboard on iOS
        # Try Done button first, then Return
        success = self.press_key("return")
        if not success:
            # Try tapping outside (would need coordinate)
            pass
        return success


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Control keyboard and hardware buttons")

    # Text input
    parser.add_argument("--type", help="Type text into current focus")
    parser.add_argument("--slow", action="store_true", help="Type slowly (character by character)")

    # Special keys
    parser.add_argument("--key", help="Press special key (return, delete, tab, space, etc.)")
    parser.add_argument("--key-sequence", help="Press key sequence (comma-separated)")
    parser.add_argument("--count", type=int, default=1, help="Number of times to press key")

    # Hardware buttons
    parser.add_argument(
        "--button",
        choices=["home", "lock", "volume-up", "volume-down", "ringer", "screenshot"],
        help="Press hardware button",
    )

    # Other operations
    parser.add_argument("--clear", action="store_true", help="Clear current text field")
    parser.add_argument("--dismiss", action="store_true", help="Dismiss keyboard")

    parser.add_argument("--udid", help="Device UDID")

    args = parser.parse_args()

    controller = KeyboardController(udid=args.udid)

    # Execute requested action
    if args.type:
        delay = 0.1 if args.slow else 0.0
        if controller.type_text(args.type, delay):
            if args.slow:
                print(f'Typed: "{args.type}" (slowly)')
            else:
                print(f'Typed: "{args.type}"')
        else:
            print("Failed to type text")
            sys.exit(1)

    elif args.key:
        if controller.press_key(args.key, args.count):
            if args.count > 1:
                print(f"Pressed {args.key} ({args.count}x)")
            else:
                print(f"Pressed {args.key}")
        else:
            print(f"Failed to press {args.key}")
            sys.exit(1)

    elif args.key_sequence:
        keys = args.key_sequence.split(",")
        if controller.press_key_sequence(keys):
            print(f"Pressed sequence: {' -> '.join(keys)}")
        else:
            print("Failed to press key sequence")
            sys.exit(1)

    elif args.button:
        if controller.press_hardware_button(args.button):
            print(f"Pressed {args.button} button")
        else:
            print(f"Failed to press {args.button}")
            sys.exit(1)

    elif args.clear:
        if controller.clear_text():
            print("Cleared text field")
        else:
            print("Failed to clear text")
            sys.exit(1)

    elif args.dismiss:
        if controller.dismiss_keyboard():
            print("Dismissed keyboard")
        else:
            print("Failed to dismiss keyboard")
            sys.exit(1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
