"""
Xcode build execution.

Handles xcodebuild command construction and execution with xcresult generation.
"""

import re
import subprocess
import sys
from pathlib import Path

from .cache import XCResultCache
from .config import Config


class BuildRunner:
    """
    Execute xcodebuild commands with xcresult bundle generation.

    Handles scheme auto-detection, command construction, and build/test execution.
    """

    def __init__(
        self,
        project_path: str | None = None,
        workspace_path: str | None = None,
        scheme: str | None = None,
        configuration: str = "Debug",
        simulator: str | None = None,
        cache: XCResultCache | None = None,
    ):
        """
        Initialize build runner.

        Args:
            project_path: Path to .xcodeproj
            workspace_path: Path to .xcworkspace
            scheme: Build scheme (auto-detected if not provided)
            configuration: Build configuration (Debug/Release)
            simulator: Simulator name
            cache: XCResult cache (creates default if not provided)
        """
        self.project_path = project_path
        self.workspace_path = workspace_path
        self.scheme = scheme
        self.configuration = configuration
        self.simulator = simulator
        self.cache = cache or XCResultCache()

    def auto_detect_scheme(self) -> str | None:
        """
        Auto-detect build scheme from project/workspace.

        Returns:
            Detected scheme name or None
        """
        cmd = ["xcodebuild", "-list"]

        if self.workspace_path:
            cmd.extend(["-workspace", self.workspace_path])
        elif self.project_path:
            cmd.extend(["-project", self.project_path])
        else:
            return None

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Parse schemes from output
            in_schemes_section = False
            for line in result.stdout.split("\n"):
                line = line.strip()

                if "Schemes:" in line:
                    in_schemes_section = True
                    continue

                if in_schemes_section and line and not line.startswith("Build"):
                    # First scheme in list
                    return line

        except subprocess.CalledProcessError as e:
            print(f"Error auto-detecting scheme: {e}", file=sys.stderr)

        return None

    def get_simulator_destination(self) -> str:
        """
        Get xcodebuild destination string.

        Uses config preferences with fallback to auto-detection.

        Priority:
            1. --simulator CLI flag (self.simulator)
            2. Config preferred_simulator
            3. Config last_used_simulator
            4. Auto-detect first iPhone
            5. Generic iOS Simulator

        Returns:
            Destination string for -destination flag
        """
        # Priority 1: CLI flag
        if self.simulator:
            return f"platform=iOS Simulator,name={self.simulator}"

        # Priority 2-3: Config preferences
        try:
            # Determine project directory from project/workspace path
            project_dir = None
            if self.project_path:
                project_dir = Path(self.project_path).parent
            elif self.workspace_path:
                project_dir = Path(self.workspace_path).parent

            config = Config.load(project_dir=project_dir)
            preferred = config.get_preferred_simulator()

            if preferred:
                # Check if preferred simulator exists
                if self._simulator_exists(preferred):
                    return f"platform=iOS Simulator,name={preferred}"
                print(f"Warning: Preferred simulator '{preferred}' not available", file=sys.stderr)
                if config.should_fallback_to_any_iphone():
                    print("Falling back to auto-detection...", file=sys.stderr)
                else:
                    # Strict mode: don't fallback
                    return f"platform=iOS Simulator,name={preferred}"

        except Exception as e:
            print(f"Warning: Could not load config: {e}", file=sys.stderr)

        # Priority 4-5: Auto-detect
        return self._auto_detect_simulator()

    def _simulator_exists(self, name: str) -> bool:
        """
        Check if simulator with given name exists and is available.

        Args:
            name: Simulator name (e.g., "iPhone 16 Pro")

        Returns:
            True if simulator exists and is available
        """
        try:
            result = subprocess.run(
                ["xcrun", "simctl", "list", "devices", "available", "iOS"],
                capture_output=True,
                text=True,
                check=True,
            )

            # Check if simulator name appears in available devices
            return any(name in line and "(" in line for line in result.stdout.split("\n"))

        except subprocess.CalledProcessError:
            return False

    def _extract_simulator_name_from_destination(self, destination: str) -> str | None:
        """
        Extract simulator name from destination string.

        Args:
            destination: Destination string (e.g., "platform=iOS Simulator,name=iPhone 16 Pro")

        Returns:
            Simulator name or None
        """
        # Pattern: name=<simulator name>
        match = re.search(r"name=([^,]+)", destination)
        if match:
            return match.group(1).strip()
        return None

    def _auto_detect_simulator(self) -> str:
        """
        Auto-detect best available iOS simulator.

        Returns:
            Destination string for -destination flag
        """
        try:
            result = subprocess.run(
                ["xcrun", "simctl", "list", "devices", "available", "iOS"],
                capture_output=True,
                text=True,
                check=True,
            )

            # Parse available simulators, prefer latest iPhone
            # Looking for lines like: "iPhone 16 Pro (12345678-1234-1234-1234-123456789012) (Shutdown)"
            for line in result.stdout.split("\n"):
                if "iPhone" in line and "(" in line:
                    # Extract device name
                    name = line.split("(")[0].strip()
                    if name:
                        return f"platform=iOS Simulator,name={name}"

            # Fallback to generic iOS Simulator if no iPhone found
            return "generic/platform=iOS Simulator"

        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not auto-detect simulator: {e}", file=sys.stderr)
            return "generic/platform=iOS Simulator"

    def build(self, clean: bool = False) -> tuple[bool, str, str]:
        """
        Build the project.

        Args:
            clean: Perform clean build

        Returns:
            Tuple of (success: bool, xcresult_id: str, stderr: str)
        """
        # Auto-detect scheme if needed
        if not self.scheme:
            self.scheme = self.auto_detect_scheme()
            if not self.scheme:
                print("Error: Could not auto-detect scheme. Use --scheme", file=sys.stderr)
                return (False, "", "")

        # Generate xcresult ID and path
        xcresult_id = self.cache.generate_id()
        xcresult_path = self.cache.get_path(xcresult_id)

        # Build command
        cmd = ["xcodebuild", "-quiet"]  # Suppress verbose output

        if clean:
            cmd.append("clean")

        cmd.append("build")

        if self.workspace_path:
            cmd.extend(["-workspace", self.workspace_path])
        elif self.project_path:
            cmd.extend(["-project", self.project_path])
        else:
            print("Error: No project or workspace specified", file=sys.stderr)
            return (False, "", "")

        cmd.extend(
            [
                "-scheme",
                self.scheme,
                "-configuration",
                self.configuration,
                "-destination",
                self.get_simulator_destination(),
                "-resultBundlePath",
                str(xcresult_path),
            ]
        )

        # Execute build
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, check=False  # Don't raise on non-zero exit
            )

            success = result.returncode == 0

            # xcresult bundle should be created even on failure
            if not xcresult_path.exists():
                print("Warning: xcresult bundle was not created", file=sys.stderr)
                return (success, "", result.stderr)

            # Auto-update config with last used simulator (on success only)
            if success:
                try:
                    # Determine project directory from project/workspace path
                    project_dir = None
                    if self.project_path:
                        project_dir = Path(self.project_path).parent
                    elif self.workspace_path:
                        project_dir = Path(self.workspace_path).parent

                    config = Config.load(project_dir=project_dir)
                    destination = self.get_simulator_destination()
                    simulator_name = self._extract_simulator_name_from_destination(destination)

                    if simulator_name:
                        config.update_last_used_simulator(simulator_name)
                        config.save()

                except Exception as e:
                    # Don't fail build if config update fails
                    print(f"Warning: Could not update config: {e}", file=sys.stderr)

            return (success, xcresult_id, result.stderr)

        except Exception as e:
            print(f"Error executing build: {e}", file=sys.stderr)
            return (False, "", str(e))

    def test(self, test_suite: str | None = None) -> tuple[bool, str, str]:
        """
        Run tests.

        Args:
            test_suite: Specific test suite to run

        Returns:
            Tuple of (success: bool, xcresult_id: str, stderr: str)
        """
        # Auto-detect scheme if needed
        if not self.scheme:
            self.scheme = self.auto_detect_scheme()
            if not self.scheme:
                print("Error: Could not auto-detect scheme. Use --scheme", file=sys.stderr)
                return (False, "", "")

        # Generate xcresult ID and path
        xcresult_id = self.cache.generate_id()
        xcresult_path = self.cache.get_path(xcresult_id)

        # Build command
        cmd = ["xcodebuild", "-quiet", "test"]

        if self.workspace_path:
            cmd.extend(["-workspace", self.workspace_path])
        elif self.project_path:
            cmd.extend(["-project", self.project_path])
        else:
            print("Error: No project or workspace specified", file=sys.stderr)
            return (False, "", "")

        cmd.extend(
            [
                "-scheme",
                self.scheme,
                "-destination",
                self.get_simulator_destination(),
                "-resultBundlePath",
                str(xcresult_path),
            ]
        )

        if test_suite:
            cmd.extend(["-only-testing", test_suite])

        # Execute tests
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)

            success = result.returncode == 0

            # xcresult bundle should be created even on failure
            if not xcresult_path.exists():
                print("Warning: xcresult bundle was not created", file=sys.stderr)
                return (success, "", result.stderr)

            # Auto-update config with last used simulator (on success only)
            if success:
                try:
                    # Determine project directory from project/workspace path
                    project_dir = None
                    if self.project_path:
                        project_dir = Path(self.project_path).parent
                    elif self.workspace_path:
                        project_dir = Path(self.workspace_path).parent

                    config = Config.load(project_dir=project_dir)
                    destination = self.get_simulator_destination()
                    simulator_name = self._extract_simulator_name_from_destination(destination)

                    if simulator_name:
                        config.update_last_used_simulator(simulator_name)
                        config.save()

                except Exception as e:
                    # Don't fail test if config update fails
                    print(f"Warning: Could not update config: {e}", file=sys.stderr)

            return (success, xcresult_id, result.stderr)

        except Exception as e:
            print(f"Error executing tests: {e}", file=sys.stderr)
            return (False, "", str(e))
