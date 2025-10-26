#!/usr/bin/env python3
"""
App State Capture for iOS Simulator

Captures complete app state including screenshot, accessibility tree, and logs.
Optimized for minimal token output.

Usage: python scripts/app_state_capture.py [options]
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from common import count_elements, get_accessibility_tree


class AppStateCapture:
    """Captures comprehensive app state for debugging."""

    def __init__(self, app_bundle_id: str | None = None, udid: str | None = None):
        """
        Initialize state capture.

        Args:
            app_bundle_id: Optional app bundle ID for log filtering
            udid: Optional device UDID (uses booted if not specified)
        """
        self.app_bundle_id = app_bundle_id
        self.udid = udid

    def capture_screenshot(self, output_path: Path) -> bool:
        """Capture screenshot of current screen."""
        cmd = ["xcrun", "simctl", "io"]

        if self.udid:
            cmd.append(self.udid)
        else:
            cmd.append("booted")

        cmd.extend(["screenshot", str(output_path)])

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def capture_accessibility_tree(self, output_path: Path) -> dict:
        """Capture accessibility tree using shared utility."""
        try:
            # Use shared utility to fetch tree
            tree = get_accessibility_tree(self.udid, nested=True)

            # Save tree
            with open(output_path, "w") as f:
                json.dump(tree, f, indent=2)

            # Return summary using shared utility
            return {"captured": True, "element_count": count_elements(tree)}
        except Exception as e:
            return {"captured": False, "error": str(e)}

    def capture_logs(self, output_path: Path, line_limit: int = 100) -> dict:
        """Capture recent app logs."""
        if not self.app_bundle_id:
            # Can't capture logs without app ID
            return {"captured": False, "reason": "No app bundle ID specified"}

        # Get app name from bundle ID (simplified)
        app_name = self.app_bundle_id.split(".")[-1]

        cmd = ["xcrun", "simctl", "spawn"]

        if self.udid:
            cmd.append(self.udid)
        else:
            cmd.append("booted")

        cmd.extend(
            [
                "log",
                "show",
                "--predicate",
                f'process == "{app_name}"',
                "--last",
                "1m",  # Last 1 minute
                "--style",
                "compact",
            ]
        )

        try:
            result = subprocess.run(cmd, check=False, capture_output=True, text=True, timeout=5)
            logs = result.stdout

            # Limit lines for token efficiency
            lines = logs.split("\n")
            if len(lines) > line_limit:
                lines = lines[-line_limit:]

            # Save logs
            with open(output_path, "w") as f:
                f.write("\n".join(lines))

            # Analyze for issues
            warning_count = sum(1 for line in lines if "warning" in line.lower())
            error_count = sum(1 for line in lines if "error" in line.lower())

            return {
                "captured": True,
                "lines": len(lines),
                "warnings": warning_count,
                "errors": error_count,
            }
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            return {"captured": False, "error": str(e)}

    def capture_device_info(self) -> dict:
        """Get device information."""
        cmd = ["xcrun", "simctl", "list", "devices", "booted"]

        if self.udid:
            # Specific device info
            cmd = ["xcrun", "simctl", "list", "devices"]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Parse output for device info (simplified)
            lines = result.stdout.split("\n")
            device_info = {}

            for line in lines:
                if "iPhone" in line or "iPad" in line:
                    # Extract device name and state
                    parts = line.strip().split("(")
                    if parts:
                        device_info["name"] = parts[0].strip()
                        if len(parts) > 2:
                            device_info["udid"] = parts[1].replace(")", "").strip()
                            device_info["state"] = parts[2].replace(")", "").strip()
                    break

            return device_info
        except subprocess.CalledProcessError:
            return {}

    def capture_all(self, output_dir: str, log_lines: int = 100) -> dict:
        """
        Capture complete app state.

        Args:
            output_dir: Directory to save artifacts
            log_lines: Number of log lines to capture

        Returns:
            Summary of captured state
        """
        # Create output directory
        output_path = Path(output_dir)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        capture_dir = output_path / f"app-state-{timestamp}"
        capture_dir.mkdir(parents=True, exist_ok=True)

        summary = {"timestamp": datetime.now().isoformat(), "output_dir": str(capture_dir)}

        # Capture screenshot
        screenshot_path = capture_dir / "screenshot.png"
        if self.capture_screenshot(screenshot_path):
            summary["screenshot"] = "screenshot.png"

        # Capture accessibility tree
        accessibility_path = capture_dir / "accessibility-tree.json"
        tree_info = self.capture_accessibility_tree(accessibility_path)
        summary["accessibility"] = tree_info

        # Capture logs (if app ID provided)
        if self.app_bundle_id:
            logs_path = capture_dir / "app-logs.txt"
            log_info = self.capture_logs(logs_path, log_lines)
            summary["logs"] = log_info

        # Get device info
        device_info = self.capture_device_info()
        if device_info:
            summary["device"] = device_info
            # Save device info
            with open(capture_dir / "device-info.json", "w") as f:
                json.dump(device_info, f, indent=2)

        # Save summary
        with open(capture_dir / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)

        # Create markdown summary
        self._create_summary_md(capture_dir, summary)

        return summary

    def _create_summary_md(self, capture_dir: Path, summary: dict) -> None:
        """Create markdown summary file."""
        md_path = capture_dir / "summary.md"

        with open(md_path, "w") as f:
            f.write("# App State Capture\n\n")
            f.write(f"**Timestamp:** {summary['timestamp']}\n\n")

            if "device" in summary:
                f.write("## Device\n")
                device = summary["device"]
                f.write(f"- Name: {device.get('name', 'Unknown')}\n")
                f.write(f"- UDID: {device.get('udid', 'N/A')}\n")
                f.write(f"- State: {device.get('state', 'Unknown')}\n\n")

            f.write("## Screenshot\n")
            f.write("![Current Screen](screenshot.png)\n\n")

            if "accessibility" in summary:
                acc = summary["accessibility"]
                f.write("## Accessibility\n")
                if acc.get("captured"):
                    f.write(f"- Elements: {acc.get('element_count', 0)}\n")
                else:
                    f.write(f"- Error: {acc.get('error', 'Unknown')}\n")
                f.write("\n")

            if "logs" in summary:
                logs = summary["logs"]
                f.write("## Logs\n")
                if logs.get("captured"):
                    f.write(f"- Lines: {logs.get('lines', 0)}\n")
                    f.write(f"- Warnings: {logs.get('warnings', 0)}\n")
                    f.write(f"- Errors: {logs.get('errors', 0)}\n")
                else:
                    f.write(f"- {logs.get('reason', logs.get('error', 'Not captured'))}\n")
                f.write("\n")

            f.write("## Files\n")
            f.write("- `screenshot.png` - Current screen\n")
            f.write("- `accessibility-tree.json` - Full UI hierarchy\n")
            if self.app_bundle_id:
                f.write("- `app-logs.txt` - Recent app logs\n")
            f.write("- `device-info.json` - Device details\n")
            f.write("- `summary.json` - Complete capture metadata\n")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Capture complete app state for debugging")
    parser.add_argument(
        "--app-bundle-id", help="App bundle ID for log filtering (e.g., com.example.app)"
    )
    parser.add_argument(
        "--output", default=".", help="Output directory (default: current directory)"
    )
    parser.add_argument(
        "--log-lines", type=int, default=100, help="Number of log lines to capture (default: 100)"
    )
    parser.add_argument("--udid", help="Device UDID (uses booted if not specified)")

    args = parser.parse_args()

    # Create capturer
    capturer = AppStateCapture(app_bundle_id=args.app_bundle_id, udid=args.udid)

    # Capture state
    try:
        summary = capturer.capture_all(output_dir=args.output, log_lines=args.log_lines)

        # Token-efficient output
        print(f"State captured: {summary['output_dir']}/")

        # Report any issues found
        if "logs" in summary and summary["logs"].get("captured"):
            logs = summary["logs"]
            if logs["errors"] > 0 or logs["warnings"] > 0:
                print(f"Issues found: {logs['errors']} errors, {logs['warnings']} warnings")

        if "accessibility" in summary and summary["accessibility"].get("captured"):
            print(f"Elements: {summary['accessibility']['element_count']}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
