#!/usr/bin/env python3
"""Validate deterministic contracts for the iTradeAIMS skill source repo."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


CHECK_ID_RE = re.compile(r"^[a-z0-9-]+$")
CONTROLLED_PROFILES = {
    "core-methodology",
    "itradeaims-control",
    "product-runtime",
}
CONTROLLED_EVALUATION_STATUSES = {"accepted", "exempt-reference-only"}
OVERLAY_REQUIRED_PHRASES = (
    "itradeaims-agent-workflows",
    "AGENTS.md",
    "bypass iTradeAIMS gates",
    "validation evidence",
)
SCENARIO_REQUIRED_KEYS = {
    "scenario_id",
    "profile_id",
    "skill_id",
    "runtime",
    "prompt",
    "expected_behavior",
    "deterministic_checks",
}


def load_json(path: Path, errors: list[str]) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        errors.append(f"missing file: {path}")
    except json.JSONDecodeError as exc:
        errors.append(f"{path}: invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}")
    except OSError as exc:
        errors.append(f"{path}: cannot read: {exc}")
    return None


def parse_frontmatter(path: Path, errors: list[str]) -> dict[str, str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        errors.append(f"{path}: cannot read: {exc}")
        return {}

    if not lines or lines[0].strip() != "---":
        errors.append(f"{path}: missing YAML-ish frontmatter")
        return {}

    frontmatter: dict[str, str] = {}
    end_index = None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = index
            break
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip("\"'")

    if end_index is None:
        errors.append(f"{path}: unterminated YAML-ish frontmatter")
        return frontmatter

    return frontmatter


def validate_skill_sources(root: Path, errors: list[str]) -> set[str]:
    skills_dir = root / "skills"
    skill_ids: set[str] = set()

    if not skills_dir.is_dir():
        errors.append(f"missing directory: {skills_dir}")
        return skill_ids

    for skill_dir in sorted(path for path in skills_dir.iterdir() if path.is_dir()):
        skill_path = skill_dir / "SKILL.md"
        if not skill_path.is_file():
            errors.append(f"{skill_dir}: missing SKILL.md")
            continue

        frontmatter = parse_frontmatter(skill_path, errors)
        name = frontmatter.get("name", "").strip()
        description = frontmatter.get("description", "").strip()

        if not name:
            errors.append(f"{skill_path}: frontmatter name is required")
        else:
            if name in skill_ids:
                errors.append(f"{skill_path}: duplicate frontmatter name: {name}")
            skill_ids.add(name)

        if not description:
            errors.append(f"{skill_path}: frontmatter description is required")
        elif len(description) > 260:
            errors.append(f"{skill_path}: description exceeds 260 characters")

    return skill_ids


def validate_registry(root: Path, skill_ids: set[str], errors: list[str]) -> dict[str, dict[str, Any]]:
    registry_path = root / "registry" / "skills.json"
    registry = load_json(registry_path, errors)
    registry_entries: dict[str, dict[str, Any]] = {}

    if not isinstance(registry, dict):
        errors.append(f"{registry_path}: expected JSON object")
        return registry_entries

    skills = registry.get("skills")
    if not isinstance(skills, list):
        errors.append(f"{registry_path}: skills must be a list")
        return registry_entries

    seen: set[str] = set()
    for index, entry in enumerate(skills):
        location = f"{registry_path}: skills[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{location}: expected object")
            continue

        skill_id = entry.get("skill_id")
        if not isinstance(skill_id, str) or not skill_id.strip():
            errors.append(f"{location}: skill_id is required")
            continue

        if skill_id in seen:
            errors.append(f"{location}: duplicate skill_id: {skill_id}")
        seen.add(skill_id)
        registry_entries[skill_id] = entry

    registry_ids = set(registry_entries)
    missing = sorted(skill_ids - registry_ids)
    extra = sorted(registry_ids - skill_ids)
    if missing:
        errors.append(f"{registry_path}: missing registry entries for skills: {', '.join(missing)}")
    if extra:
        errors.append(f"{registry_path}: extra registry entries without skill sources: {', '.join(extra)}")

    return registry_entries


def validate_profiles(
    root: Path,
    skill_ids: set[str],
    registry_entries: dict[str, dict[str, Any]],
    errors: list[str],
) -> dict[str, set[str]]:
    profiles_dir = root / "profiles"
    profiles: dict[str, set[str]] = {}

    if not profiles_dir.is_dir():
        errors.append(f"missing directory: {profiles_dir}")
        return profiles

    for profile_path in sorted(profiles_dir.glob("*.json")):
        if "schema" in profile_path.relative_to(profiles_dir).parts:
            continue

        profile = load_json(profile_path, errors)
        if not isinstance(profile, dict):
            errors.append(f"{profile_path}: expected JSON object")
            continue

        profile_id = profile.get("profile_id")
        if not isinstance(profile_id, str) or not profile_id.strip():
            errors.append(f"{profile_path}: profile_id is required")
            continue

        profile_skills = profile.get("skills")
        if not isinstance(profile_skills, list):
            errors.append(f"{profile_path}: skills must be a list")
            profiles[profile_id] = set()
            continue

        included_skills: set[str] = set()
        for index, skill_id in enumerate(profile_skills):
            location = f"{profile_path}: skills[{index}]"
            if not isinstance(skill_id, str) or not skill_id.strip():
                errors.append(f"{location}: skill id must be a non-empty string")
                continue
            included_skills.add(skill_id)

            if skill_id not in skill_ids:
                errors.append(f"{location}: skill does not exist in skills/: {skill_id}")
            if skill_id not in registry_entries:
                errors.append(f"{location}: skill is not registered: {skill_id}")

            if profile_id in CONTROLLED_PROFILES and skill_id in registry_entries:
                status = registry_entries[skill_id].get("evaluation_status")
                if status not in CONTROLLED_EVALUATION_STATUSES:
                    errors.append(
                        f"{location}: controlled profile skill has invalid "
                        f"evaluation_status {status!r}"
                    )

        profiles[profile_id] = included_skills

    experimental_skills = profiles.get("experimental-lab", set())
    for profile_id, included_skills in sorted(profiles.items()):
        if profile_id == "experimental-lab":
            continue
        overlap = sorted(experimental_skills & included_skills)
        if overlap:
            errors.append(
                f"profiles/{profile_id}: experimental-lab skills also included: {', '.join(overlap)}"
            )

    return profiles


def validate_overlay(root: Path, errors: list[str]) -> None:
    overlay_path = root / "overlays" / "runtime-guidance-contract.md"
    try:
        text = overlay_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        errors.append(f"missing file: {overlay_path}")
        return
    except OSError as exc:
        errors.append(f"{overlay_path}: cannot read: {exc}")
        return

    for phrase in OVERLAY_REQUIRED_PHRASES:
        if phrase not in text:
            errors.append(f"{overlay_path}: missing required phrase: {phrase}")


def validate_scenarios(root: Path, skill_ids: set[str], profile_ids: set[str], errors: list[str]) -> None:
    scenarios_dir = root / "evaluations" / "scenarios"
    if not scenarios_dir.is_dir():
        errors.append(f"missing directory: {scenarios_dir}")
        return

    for scenario_path in sorted(scenarios_dir.glob("*.jsonl")):
        try:
            lines = scenario_path.read_text(encoding="utf-8").splitlines()
        except OSError as exc:
            errors.append(f"{scenario_path}: cannot read: {exc}")
            continue

        for line_number, line in enumerate(lines, start=1):
            location = f"{scenario_path}:{line_number}"
            try:
                scenario = json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f"{location}: invalid JSON at column {exc.colno}: {exc.msg}")
                continue

            if not isinstance(scenario, dict):
                errors.append(f"{location}: scenario must be an object")
                continue

            missing_keys = sorted(SCENARIO_REQUIRED_KEYS - set(scenario))
            if missing_keys:
                errors.append(f"{location}: missing required keys: {', '.join(missing_keys)}")

            skill_id = scenario.get("skill_id")
            if skill_id not in skill_ids:
                errors.append(f"{location}: skill_id does not exist in skills/: {skill_id!r}")

            profile_id = scenario.get("profile_id")
            if profile_id not in profile_ids:
                errors.append(f"{location}: profile_id does not exist in profiles/: {profile_id!r}")

            checks = scenario.get("deterministic_checks")
            if not isinstance(checks, list):
                errors.append(f"{location}: deterministic_checks must be a list")
                continue

            seen_check_ids: set[str] = set()
            for index, check in enumerate(checks):
                check_location = f"{location}: deterministic_checks[{index}]"
                if not isinstance(check, dict):
                    errors.append(f"{check_location}: expected object")
                    continue

                check_id = check.get("check_id")
                assertion = check.get("assertion")
                if not isinstance(check_id, str) or not check_id:
                    errors.append(f"{check_location}: check_id is required")
                elif not CHECK_ID_RE.match(check_id):
                    errors.append(f"{check_location}: check_id must match {CHECK_ID_RE.pattern}")
                elif check_id in seen_check_ids:
                    errors.append(f"{check_location}: duplicate check_id in scenario: {check_id}")
                else:
                    seen_check_ids.add(check_id)

                if not isinstance(assertion, str) or not assertion.strip():
                    errors.append(f"{check_location}: assertion is required")


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    errors: list[str] = []

    skill_ids = validate_skill_sources(root, errors)
    registry_entries = validate_registry(root, skill_ids, errors)
    profiles = validate_profiles(root, skill_ids, registry_entries, errors)
    validate_overlay(root, errors)
    validate_scenarios(root, skill_ids, set(profiles), errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("skill-source-repo-validation: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
