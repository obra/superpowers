#!/usr/bin/env python3
"""
iOS App Launcher - App Lifecycle Control

Launches, terminates, and manages iOS apps in the simulator.
Handles deep links and app switching.

Usage: python scripts/app_launcher.py --launch com.example.app
"""

import argparse
import contextlib
import subprocess
import sys
import time

from common import build_simctl_command


class AppLauncher:
    """Controls app lifecycle on iOS simulator."""

    def __init__(self, udid: str | None = None):
        """Initialize app launcher."""
        self.udid = udid

    def launch(self, bundle_id: str, wait_for_debugger: bool = False) -> tuple[bool, int | None]:
        """
        Launch an app.

        Args:
            bundle_id: App bundle identifier
            wait_for_debugger: Wait for debugger attachment

        Returns:
            (success, pid) tuple
        """
        cmd = build_simctl_command("launch", self.udid, bundle_id)

        if wait_for_debugger:
            cmd.insert(3, "--wait-for-debugger")  # Insert after "launch" operation

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            # Parse PID from output if available
            pid = None
            if result.stdout:
                # Output format: "com.example.app: <PID>"
                parts = result.stdout.strip().split(":")
                if len(parts) > 1:
                    with contextlib.suppress(ValueError):
                        pid = int(parts[1].strip())
            return (True, pid)
        except subprocess.CalledProcessError:
            return (False, None)

    def terminate(self, bundle_id: str) -> bool:
        """
        Terminate an app.

        Args:
            bundle_id: App bundle identifier

        Returns:
            Success status
        """
        cmd = build_simctl_command("terminate", self.udid, bundle_id)

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def install(self, app_path: str) -> bool:
        """
        Install an app.

        Args:
            app_path: Path to .app bundle

        Returns:
            Success status
        """
        cmd = build_simctl_command("install", self.udid, app_path)

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def uninstall(self, bundle_id: str) -> bool:
        """
        Uninstall an app.

        Args:
            bundle_id: App bundle identifier

        Returns:
            Success status
        """
        cmd = build_simctl_command("uninstall", self.udid, bundle_id)

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def open_url(self, url: str) -> bool:
        """
        Open URL (for deep linking).

        Args:
            url: URL to open (http://, myapp://, etc.)

        Returns:
            Success status
        """
        cmd = build_simctl_command("openurl", self.udid, url)

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def list_apps(self) -> list[dict[str, str]]:
        """
        List installed apps.

        Returns:
            List of app info dictionaries
        """
        cmd = build_simctl_command("listapps", self.udid)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Parse plist output using plutil to convert to JSON
            plist_data = result.stdout

            # Use plutil to convert plist to JSON
            convert_cmd = ["plutil", "-convert", "json", "-o", "-", "-"]
            convert_result = subprocess.run(
                convert_cmd, check=False, input=plist_data, capture_output=True, text=True
            )

            apps = []
            if convert_result.returncode == 0:
                import json

                try:
                    data = json.loads(convert_result.stdout)
                    for bundle_id, app_info in data.items():
                        # Skip system internal apps that are hidden
                        if app_info.get("ApplicationType") == "Hidden":
                            continue

                        apps.append(
                            {
                                "bundle_id": bundle_id,
                                "name": app_info.get(
                                    "CFBundleDisplayName", app_info.get("CFBundleName", bundle_id)
                                ),
                                "path": app_info.get("Path", ""),
                                "version": app_info.get("CFBundleVersion", "Unknown"),
                                "type": app_info.get("ApplicationType", "User"),
                            }
                        )
                except json.JSONDecodeError:
                    pass

            return apps
        except subprocess.CalledProcessError:
            return []

    def get_app_state(self, bundle_id: str) -> str:
        """
        Get app state (running, suspended, etc.).

        Args:
            bundle_id: App bundle identifier

        Returns:
            State string or 'unknown'
        """
        # Check if app is running by trying to get its PID
        cmd = build_simctl_command("spawn", self.udid, "launchctl", "list")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            if bundle_id in result.stdout:
                return "running"
            return "not running"
        except subprocess.CalledProcessError:
            return "unknown"

    def restart_app(self, bundle_id: str, delay: float = 1.0) -> bool:
        """
        Restart an app (terminate then launch).

        Args:
            bundle_id: App bundle identifier
            delay: Delay between terminate and launch

        Returns:
            Success status
        """
        # Terminate
        self.terminate(bundle_id)
        time.sleep(delay)

        # Launch
        success, _ = self.launch(bundle_id)
        return success


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Control iOS app lifecycle")

    # Actions
    parser.add_argument("--launch", help="Launch app by bundle ID")
    parser.add_argument("--terminate", help="Terminate app by bundle ID")
    parser.add_argument("--restart", help="Restart app by bundle ID")
    parser.add_argument("--install", help="Install app from .app path")
    parser.add_argument("--uninstall", help="Uninstall app by bundle ID")
    parser.add_argument("--open-url", help="Open URL (deep link)")
    parser.add_argument("--list", action="store_true", help="List installed apps")
    parser.add_argument("--state", help="Get app state by bundle ID")

    # Options
    parser.add_argument(
        "--wait-for-debugger", action="store_true", help="Wait for debugger when launching"
    )
    parser.add_argument("--udid", help="Device UDID")

    args = parser.parse_args()

    launcher = AppLauncher(udid=args.udid)

    # Execute requested action
    if args.launch:
        success, pid = launcher.launch(args.launch, args.wait_for_debugger)
        if success:
            if pid:
                print(f"Launched {args.launch} (PID: {pid})")
            else:
                print(f"Launched {args.launch}")
        else:
            print(f"Failed to launch {args.launch}")
            sys.exit(1)

    elif args.terminate:
        if launcher.terminate(args.terminate):
            print(f"Terminated {args.terminate}")
        else:
            print(f"Failed to terminate {args.terminate}")
            sys.exit(1)

    elif args.restart:
        if launcher.restart_app(args.restart):
            print(f"Restarted {args.restart}")
        else:
            print(f"Failed to restart {args.restart}")
            sys.exit(1)

    elif args.install:
        if launcher.install(args.install):
            print(f"Installed {args.install}")
        else:
            print(f"Failed to install {args.install}")
            sys.exit(1)

    elif args.uninstall:
        if launcher.uninstall(args.uninstall):
            print(f"Uninstalled {args.uninstall}")
        else:
            print(f"Failed to uninstall {args.uninstall}")
            sys.exit(1)

    elif args.open_url:
        if launcher.open_url(args.open_url):
            print(f"Opened URL: {args.open_url}")
        else:
            print(f"Failed to open URL: {args.open_url}")
            sys.exit(1)

    elif args.list:
        apps = launcher.list_apps()
        if apps:
            print(f"Installed apps ({len(apps)}):")
            for app in apps[:10]:  # Limit for token efficiency
                print(f"  {app['bundle_id']}: {app['name']} (v{app['version']})")
            if len(apps) > 10:
                print(f"  ... and {len(apps) - 10} more")
        else:
            print("No apps found or failed to list")

    elif args.state:
        state = launcher.get_app_state(args.state)
        print(f"{args.state}: {state}")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
