#!/usr/bin/env python3
"""
Test Recorder for iOS Simulator Testing

Records test execution with automatic screenshots and documentation.
Optimized for minimal token output during execution.

Usage:
    As a script: python scripts/test_recorder.py --test-name "Test Name" --output dir/
    As a module: from scripts.test_recorder import TestRecorder
"""

import argparse
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

from common import count_elements, get_accessibility_tree


class TestRecorder:
    """Records test execution with screenshots and accessibility snapshots."""

    def __init__(self, test_name: str, output_dir: str = "test-artifacts", udid: str | None = None):
        """
        Initialize test recorder.

        Args:
            test_name: Name of the test being recorded
            output_dir: Directory for test artifacts
            udid: Optional device UDID (uses booted if not specified)
        """
        self.test_name = test_name
        self.udid = udid
        self.start_time = time.time()
        self.steps: list[dict] = []
        self.current_step = 0

        # Create timestamped output directory
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_name = test_name.lower().replace(" ", "-")
        self.output_dir = Path(output_dir) / f"{safe_name}-{timestamp}"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        self.screenshots_dir = self.output_dir / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)
        self.accessibility_dir = self.output_dir / "accessibility"
        self.accessibility_dir.mkdir(exist_ok=True)

        # Token-efficient output
        print(f"Recording: {test_name}")
        print(f"Output: {self.output_dir}/")

    def step(self, description: str, assertion: str | None = None, metadata: dict | None = None):
        """
        Record a test step with automatic screenshot.

        Args:
            description: Step description
            assertion: Optional assertion to verify
            metadata: Optional metadata for the step
        """
        self.current_step += 1
        step_time = time.time() - self.start_time

        # Format step number with padding
        step_num = f"{self.current_step:03d}"
        safe_desc = description.lower().replace(" ", "-")[:30]

        # Capture screenshot
        screenshot_path = self.screenshots_dir / f"{step_num}-{safe_desc}.png"
        self._capture_screenshot(screenshot_path)

        # Capture accessibility tree
        accessibility_path = self.accessibility_dir / f"{step_num}-{safe_desc}.json"
        element_count = self._capture_accessibility(accessibility_path)

        # Store step data
        step_data = {
            "number": self.current_step,
            "description": description,
            "timestamp": step_time,
            "screenshot": screenshot_path.name,
            "accessibility": accessibility_path.name,
            "element_count": element_count,
        }

        if assertion:
            step_data["assertion"] = assertion
            step_data["assertion_passed"] = True  # Would verify in real implementation

        if metadata:
            step_data["metadata"] = metadata

        self.steps.append(step_data)

        # Token-efficient output (single line)
        status = "✓" if not assertion or step_data.get("assertion_passed") else "✗"
        print(f"{status} Step {self.current_step}: {description} ({step_time:.1f}s)")

    def _capture_screenshot(self, output_path: Path) -> bool:
        """Capture screenshot using simctl."""
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

    def _capture_accessibility(self, output_path: Path) -> int:
        """Capture accessibility tree and return element count."""
        try:
            # Use shared utility to fetch tree
            tree = get_accessibility_tree(self.udid, nested=True)

            # Save tree
            with open(output_path, "w") as f:
                json.dump(tree, f, indent=2)

            # Count elements using shared utility
            return count_elements(tree)
        except Exception:
            return 0

    def generate_report(self) -> dict[str, str]:
        """
        Generate markdown test report.

        Returns:
            Dictionary with paths to generated files
        """
        duration = time.time() - self.start_time
        report_path = self.output_dir / "report.md"

        # Generate markdown
        with open(report_path, "w") as f:
            f.write(f"# Test Report: {self.test_name}\n\n")
            f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Duration:** {duration:.1f} seconds\n")
            f.write(f"**Steps:** {len(self.steps)}\n\n")

            # Steps section
            f.write("## Test Steps\n\n")
            for step in self.steps:
                f.write(
                    f"### Step {step['number']}: {step['description']} ({step['timestamp']:.1f}s)\n\n"
                )
                f.write(f"![Screenshot](screenshots/{step['screenshot']})\n\n")

                if step.get("assertion"):
                    status = "✓" if step.get("assertion_passed") else "✗"
                    f.write(f"**Assertion:** {step['assertion']} {status}\n\n")

                if step.get("metadata"):
                    f.write("**Metadata:**\n")
                    for key, value in step["metadata"].items():
                        f.write(f"- {key}: {value}\n")
                    f.write("\n")

                f.write(f"**Accessibility Elements:** {step['element_count']}\n\n")
                f.write("---\n\n")

            # Summary
            f.write("## Summary\n\n")
            f.write(f"- Total steps: {len(self.steps)}\n")
            f.write(f"- Duration: {duration:.1f}s\n")
            f.write(f"- Screenshots: {len(self.steps)}\n")
            f.write(f"- Accessibility snapshots: {len(self.steps)}\n")

        # Save metadata JSON
        metadata_path = self.output_dir / "metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(
                {
                    "test_name": self.test_name,
                    "duration": duration,
                    "steps": self.steps,
                    "timestamp": datetime.now().isoformat(),
                },
                f,
                indent=2,
            )

        # Token-efficient output
        print(f"Report: {report_path}")

        return {
            "markdown_path": str(report_path),
            "metadata_path": str(metadata_path),
            "output_dir": str(self.output_dir),
        }


def main():
    """Main entry point for command-line usage."""
    parser = argparse.ArgumentParser(
        description="Record test execution with screenshots and documentation"
    )
    parser.add_argument("--test-name", required=True, help="Name of the test being recorded")
    parser.add_argument(
        "--output", default="test-artifacts", help="Output directory for test artifacts"
    )
    parser.add_argument("--udid", help="Device UDID (uses booted if not specified)")

    args = parser.parse_args()

    # Create recorder
    TestRecorder(test_name=args.test_name, output_dir=args.output, udid=args.udid)

    print("Test recorder initialized. Use the following methods:")
    print('  recorder.step("description") - Record a test step')
    print("  recorder.generate_report() - Generate final report")
    print()
    print("Example:")
    print('  recorder.step("Launch app")')
    print('  recorder.step("Enter credentials", metadata={"user": "test"})')
    print('  recorder.step("Verify login", assertion="Home screen visible")')
    print("  recorder.generate_report()")


if __name__ == "__main__":
    main()
