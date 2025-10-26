#!/usr/bin/env python3
"""
Intelligent Simulator Selector

Suggests the best available iOS simulators based on:
- Recently used (from config)
- Latest iOS version
- Common models for testing
- Boot status

Usage Examples:
    # Get suggestions for user selection
    python scripts/simulator_selector.py --suggest

    # List all available simulators
    python scripts/simulator_selector.py --list

    # Boot a specific simulator
    python scripts/simulator_selector.py --boot "67A99DF0-27BD-4507-A3DE-B7D8C38F764A"

    # Get suggestions as JSON for programmatic use
    python scripts/simulator_selector.py --suggest --json
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# Try to import config from build_and_test if available
try:
    from xcode.config import Config
except ImportError:
    Config = None


class SimulatorInfo:
    """Information about an iOS simulator."""

    def __init__(
        self,
        name: str,
        udid: str,
        ios_version: str,
        status: str,
    ):
        """Initialize simulator info."""
        self.name = name
        self.udid = udid
        self.ios_version = ios_version
        self.status = status
        self.reasons: list[str] = []

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "device": self.name,
            "udid": self.udid,
            "ios": self.ios_version,
            "status": self.status,
            "reasons": self.reasons,
        }


class SimulatorSelector:
    """Intelligent simulator selection."""

    # Common iPhone models ranked by testing priority
    COMMON_MODELS = [
        "iPhone 16 Pro",
        "iPhone 16",
        "iPhone 15 Pro",
        "iPhone 15",
        "iPhone SE (3rd generation)",
    ]

    def __init__(self):
        """Initialize selector."""
        self.simulators: list[SimulatorInfo] = []
        self.config: dict | None = None
        self.last_used_simulator: str | None = None

        # Load config if available
        if Config:
            try:
                config = Config.load()
                self.last_used_simulator = config.get_preferred_simulator()
            except Exception:
                pass

    def list_simulators(self) -> list[SimulatorInfo]:
        """
        List all available simulators.

        Returns:
            List of SimulatorInfo objects
        """
        try:
            result = subprocess.run(
                ["xcrun", "simctl", "list", "devices", "--json"],
                capture_output=True,
                text=True,
                check=True,
            )

            data = json.loads(result.stdout)
            simulators = []

            # Parse devices by iOS version
            for runtime, devices in data.get("devices", {}).items():
                # Extract iOS version from runtime (e.g., "com.apple.CoreSimulator.SimRuntime.iOS-18-0")
                ios_version_match = re.search(r"iOS-(\d+-\d+)", runtime)
                if not ios_version_match:
                    continue

                ios_version = ios_version_match.group(1).replace("-", ".")

                for device in devices:
                    name = device.get("name", "")
                    udid = device.get("udid", "")
                    is_available = device.get("isAvailable", False)

                    if not is_available or "iPhone" not in name:
                        continue

                    status = device.get("state", "").capitalize()
                    sim_info = SimulatorInfo(name, udid, ios_version, status)
                    simulators.append(sim_info)

            self.simulators = simulators
            return simulators

        except subprocess.CalledProcessError as e:
            print(f"Error listing simulators: {e.stderr}", file=sys.stderr)
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing simulator list: {e}", file=sys.stderr)
            return []

    def get_suggestions(self, count: int = 4) -> list[SimulatorInfo]:
        """
        Get top N suggested simulators.

        Ranking factors:
        1. Recently used (from config)
        2. Latest iOS version
        3. Common models
        4. Boot status (Booted preferred)

        Args:
            count: Number of suggestions to return

        Returns:
            List of suggested SimulatorInfo objects
        """
        if not self.simulators:
            return []

        # Score each simulator
        scored = []
        for sim in self.simulators:
            score = self._score_simulator(sim)
            scored.append((score, sim))

        # Sort by score (descending)
        scored.sort(key=lambda x: x[0], reverse=True)

        # Return top N
        suggestions = [sim for _, sim in scored[:count]]

        # Add reasons to each suggestion
        for i, sim in enumerate(suggestions, 1):
            if i == 1:
                sim.reasons.append("Recommended")

            # Check if recently used
            if self.last_used_simulator and self.last_used_simulator == sim.name:
                sim.reasons.append("Recently used")

            # Check if latest iOS
            latest_ios = max(s.ios_version for s in self.simulators)
            if sim.ios_version == latest_ios:
                sim.reasons.append("Latest iOS")

            # Check if common model
            for j, model in enumerate(self.COMMON_MODELS):
                if model in sim.name:
                    sim.reasons.append(f"#{j+1} common model")
                    break

            # Check if booted
            if sim.status == "Booted":
                sim.reasons.append("Currently running")

        return suggestions

    def _score_simulator(self, sim: SimulatorInfo) -> float:
        """
        Score a simulator for ranking.

        Higher score = better recommendation.

        Args:
            sim: Simulator to score

        Returns:
            Score value
        """
        score = 0.0

        # Recently used gets highest priority (100 points)
        if self.last_used_simulator and self.last_used_simulator == sim.name:
            score += 100

        # Latest iOS version (50 points)
        latest_ios = max(s.ios_version for s in self.simulators)
        if sim.ios_version == latest_ios:
            score += 50

        # Common models (30-20 points based on ranking)
        for i, model in enumerate(self.COMMON_MODELS):
            if model in sim.name:
                score += 30 - (i * 2)  # Higher ranking models get more points
                break

        # Currently booted (10 points)
        if sim.status == "Booted":
            score += 10

        # iOS version number (minor factor for breaking ties)
        ios_numeric = float(sim.ios_version.replace(".", ""))
        score += ios_numeric * 0.1

        return score

    def boot_simulator(self, udid: str) -> bool:
        """
        Boot a simulator.

        Args:
            udid: Simulator UDID

        Returns:
            True if successful, False otherwise
        """
        try:
            subprocess.run(
                ["xcrun", "simctl", "boot", udid],
                capture_output=True,
                check=True,
            )
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error booting simulator: {e.stderr}", file=sys.stderr)
            return False


def format_suggestions(suggestions: list[SimulatorInfo], json_format: bool = False) -> str:
    """
    Format suggestions for output.

    Args:
        suggestions: List of suggestions
        json_format: If True, output as JSON

    Returns:
        Formatted string
    """
    if json_format:
        data = {"suggestions": [s.to_dict() for s in suggestions]}
        return json.dumps(data, indent=2)

    if not suggestions:
        return "No simulators available"

    lines = ["Available Simulators:\n"]
    for i, sim in enumerate(suggestions, 1):
        lines.append(f"{i}. {sim.name} (iOS {sim.ios_version})")
        if sim.reasons:
            lines.append(f"   {', '.join(sim.reasons)}")
        lines.append(f"   UDID: {sim.udid}")
        lines.append("")

    return "\n".join(lines)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Intelligent iOS simulator selector",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Get suggestions for user selection
  python scripts/simulator_selector.py --suggest

  # List all available simulators
  python scripts/simulator_selector.py --list

  # Boot a specific simulator
  python scripts/simulator_selector.py --boot <UDID>

  # Get suggestions as JSON
  python scripts/simulator_selector.py --suggest --json
        """,
    )

    parser.add_argument(
        "--suggest",
        action="store_true",
        help="Get top simulator suggestions",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all available simulators",
    )
    parser.add_argument(
        "--boot",
        metavar="UDID",
        help="Boot specific simulator by UDID",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=4,
        help="Number of suggestions (default: 4)",
    )

    args = parser.parse_args()

    selector = SimulatorSelector()

    if args.boot:
        # Boot specific simulator
        success = selector.boot_simulator(args.boot)
        if success:
            print(f"Booted simulator: {args.boot}")
            return 0
        return 1

    if args.list:
        # List all simulators
        simulators = selector.list_simulators()
        output = format_suggestions(simulators, args.json)
        print(output)
        return 0

    if args.suggest:
        # Get suggestions
        selector.list_simulators()
        suggestions = selector.get_suggestions(args.count)
        output = format_suggestions(suggestions, args.json)
        print(output)
        return 0

    # Default: show suggestions
    selector.list_simulators()
    suggestions = selector.get_suggestions(args.count)
    output = format_suggestions(suggestions, args.json)
    print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
