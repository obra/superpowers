"""
Configuration management for iOS Simulator Skill.

Handles loading, validation, and auto-updating of project-local config files.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


class Config:
    """
    Project-local configuration with auto-learning.

    Config file location: .claude/skills/<skill-directory-name>/config.json

    The skill directory name is auto-detected from the installation location,
    so configs work regardless of what users name the skill directory.

    Auto-updates last_used_simulator after successful builds.
    """

    DEFAULT_CONFIG = {
        "device": {
            "preferred_simulator": None,
            "preferred_os_version": None,
            "fallback_to_any_iphone": True,
            "last_used_simulator": None,
            "last_used_at": None,
        }
    }

    def __init__(self, data: dict[str, Any], config_path: Path):
        """
        Initialize config.

        Args:
            data: Config data dict
            config_path: Path to config file
        """
        self.data = data
        self.config_path = config_path

    @staticmethod
    def load(project_dir: Path | None = None) -> "Config":
        """
        Load config from project directory.

        Args:
            project_dir: Project root (defaults to cwd)

        Returns:
            Config instance (creates default if not found)

        Note:
            The skill directory name is auto-detected from the installation location,
            so configs work regardless of what users name the skill directory.
        """
        if project_dir is None:
            project_dir = Path.cwd()

        # Auto-detect skill directory name from actual installation location
        # This file is at: skill/scripts/xcode/config.py
        # Navigate up to skill/ directory and use its name
        skill_root = Path(__file__).parent.parent.parent  # xcode/ -> scripts/ -> skill/
        skill_name = skill_root.name

        config_path = project_dir / ".claude" / "skills" / skill_name / "config.json"

        # Load existing config
        if config_path.exists():
            try:
                with open(config_path) as f:
                    data = json.load(f)

                # Merge with defaults (in case new fields added)
                merged = Config._merge_with_defaults(data)
                return Config(merged, config_path)

            except json.JSONDecodeError as e:
                print(f"Warning: Invalid JSON in {config_path}: {e}", file=sys.stderr)
                print("Using default config", file=sys.stderr)
                return Config(Config.DEFAULT_CONFIG.copy(), config_path)
            except Exception as e:
                print(f"Warning: Could not load config: {e}", file=sys.stderr)
                return Config(Config.DEFAULT_CONFIG.copy(), config_path)

        # Return default config (will be created on first save)
        return Config(Config.DEFAULT_CONFIG.copy(), config_path)

    @staticmethod
    def _merge_with_defaults(data: dict[str, Any]) -> dict[str, Any]:
        """
        Merge user config with defaults.

        Args:
            data: User config data

        Returns:
            Merged config with all default fields
        """
        merged = Config.DEFAULT_CONFIG.copy()

        # Deep merge device section
        if "device" in data:
            merged["device"].update(data["device"])

        return merged

    def save(self) -> None:
        """
        Save config to file atomically.

        Uses temp file + rename for atomic writes.
        Creates parent directories if needed.
        """
        try:
            # Create parent directories
            self.config_path.parent.mkdir(parents=True, exist_ok=True)

            # Atomic write: temp file + rename
            temp_path = self.config_path.with_suffix(".tmp")

            with open(temp_path, "w") as f:
                json.dump(self.data, f, indent=2)
                f.write("\n")  # Trailing newline

            # Atomic rename
            temp_path.replace(self.config_path)

        except Exception as e:
            print(f"Warning: Could not save config: {e}", file=sys.stderr)

    def update_last_used_simulator(self, name: str) -> None:
        """
        Update last used simulator and timestamp.

        Args:
            name: Simulator name (e.g., "iPhone 16 Pro")
        """
        self.data["device"]["last_used_simulator"] = name
        self.data["device"]["last_used_at"] = datetime.utcnow().isoformat() + "Z"

    def get_preferred_simulator(self) -> str | None:
        """
        Get preferred simulator.

        Returns:
            Simulator name or None

        Priority:
            1. preferred_simulator (manual preference)
            2. last_used_simulator (auto-learned)
            3. None (use auto-detection)
        """
        device = self.data.get("device", {})

        # Manual preference takes priority
        if device.get("preferred_simulator"):
            return device["preferred_simulator"]

        # Auto-learned preference
        if device.get("last_used_simulator"):
            return device["last_used_simulator"]

        return None

    def should_fallback_to_any_iphone(self) -> bool:
        """
        Check if fallback to any iPhone is enabled.

        Returns:
            True if should fallback, False otherwise
        """
        return self.data.get("device", {}).get("fallback_to_any_iphone", True)
