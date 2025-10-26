#!/usr/bin/env python3
"""
Example: Complete Login Flow Navigation

Demonstrates how to use the iOS Simulator Navigator tools
to automate a typical login workflow.

This example shows:
- Launching an app
- Mapping the screen
- Finding and interacting with elements
- Entering credentials
- Navigating to authenticated state
"""

import subprocess
import sys
import time
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))


def run_command(cmd: list) -> tuple:
    """Run command and return (success, output)."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return (True, result.stdout.strip())
    except subprocess.CalledProcessError as e:
        return (False, e.stderr.strip())


def print_step(step_num: int, description: str):
    """Print step header."""
    print(f"\n{'='*60}")
    print(f"Step {step_num}: {description}")
    print("=" * 60)


def main():
    """Execute complete login flow."""

    # Configuration
    APP_BUNDLE_ID = "com.example.app"  # Change to your app

    print("iOS Simulator Navigator - Login Flow Example")
    print("=" * 60)

    # Step 1: Launch the app
    print_step(1, "Launch App")
    success, output = run_command(
        ["python", str(scripts_dir / "app_launcher.py"), "--launch", APP_BUNDLE_ID]
    )

    if success:
        print(f"✓ {output}")
    else:
        print(f"✗ Failed to launch: {output}")
        sys.exit(1)

    # Wait for app to load
    time.sleep(2)

    # Step 2: Map the login screen
    print_step(2, "Map Login Screen")
    success, output = run_command(["python", str(scripts_dir / "screen_mapper.py")])

    if success:
        print(output)
    else:
        print(f"✗ Failed to map screen: {output}")
        sys.exit(1)

    # Step 3: Enter email
    print_step(3, "Enter Email Address")
    success, output = run_command(
        [
            "python",
            str(scripts_dir / "navigator.py"),
            "--find-type",
            "TextField",
            "--index",
            "0",
            "--enter-text",
            "test@example.com",
        ]
    )

    if success:
        print(f"✓ {output}")
    else:
        print(f"✗ Failed to enter email: {output}")
        sys.exit(1)

    # Step 4: Enter password
    print_step(4, "Enter Password")
    success, output = run_command(
        [
            "python",
            str(scripts_dir / "navigator.py"),
            "--find-type",
            "SecureTextField",
            "--enter-text",
            "password123",
        ]
    )

    if success:
        print(f"✓ {output}")
    else:
        print(f"✗ Failed to enter password: {output}")
        sys.exit(1)

    # Step 5: Tap Login button
    print_step(5, "Tap Login Button")
    success, output = run_command(
        ["python", str(scripts_dir / "navigator.py"), "--find-text", "Login", "--tap"]
    )

    if success:
        print(f"✓ {output}")
    else:
        print(f"✗ Failed to tap login: {output}")
        sys.exit(1)

    # Wait for login to complete
    print("\nWaiting for login to complete...")
    time.sleep(3)

    # Step 6: Verify we're logged in
    print_step(6, "Verify Logged In")
    success, output = run_command(["python", str(scripts_dir / "screen_mapper.py")])

    if success:
        print(output)
        if "Home" in output or "Dashboard" in output:
            print("\n✓ Successfully logged in!")
        else:
            print("\n⚠ Login may not have succeeded (no Home/Dashboard screen detected)")
    else:
        print(f"✗ Failed to verify: {output}")
        sys.exit(1)

    # Optional: Navigate to profile
    print_step(7, "Navigate to Profile (Optional)")
    success, output = run_command(
        ["python", str(scripts_dir / "navigator.py"), "--find-text", "Profile", "--tap"]
    )

    if success:
        print(f"✓ {output}")
        time.sleep(1)

        # Map profile screen
        success, output = run_command(["python", str(scripts_dir / "screen_mapper.py")])
        if success:
            print(f"\nProfile Screen:\n{output}")
    else:
        print(f"⚠ Profile navigation skipped: {output}")

    print("\n" + "=" * 60)
    print("Login flow complete!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        sys.exit(1)
