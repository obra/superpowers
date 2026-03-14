#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = ROOT / "skills"
CODEX_EXAMPLES = ROOT / ".codex" / "examples"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def expect(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def parse_skill_name(skill_md: Path) -> str | None:
    match = re.search(r"^name:\s*\"?([A-Za-z0-9-]+)\"?\s*$", read_text(skill_md), re.MULTILINE)
    if not match:
        return None
    return match.group(1)


def parse_openai_yaml_values(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for key in ("display_name", "short_description", "default_prompt"):
        match = re.search(rf"^\s*{key}:\s*\"([^\"]+)\"\s*$", read_text(path), re.MULTILINE)
        if match:
            values[key] = match.group(1)
    policy = re.search(
        r"^\s*allow_implicit_invocation:\s*(true|false)\s*$",
        read_text(path),
        re.MULTILINE,
    )
    if policy:
        values["allow_implicit_invocation"] = policy.group(1)
    return values


def validate_openai_yaml(errors: list[str]) -> None:
    for skill_dir in sorted(path for path in SKILLS_DIR.iterdir() if path.is_dir()):
        skill_md = skill_dir / "SKILL.md"
        openai_yaml = skill_dir / "agents" / "openai.yaml"
        expect(skill_md.exists(), f"Missing SKILL.md for {skill_dir.name}", errors)
        expect(openai_yaml.exists(), f"Missing agents/openai.yaml for {skill_dir.name}", errors)
        if not skill_md.exists() or not openai_yaml.exists():
            continue

        skill_name = parse_skill_name(skill_md)
        expect(skill_name is not None, f"Could not parse skill name for {skill_dir.name}", errors)
        values = parse_openai_yaml_values(openai_yaml)
        expect("display_name" in values, f"Missing display_name in {openai_yaml}", errors)
        expect("short_description" in values, f"Missing short_description in {openai_yaml}", errors)
        expect("default_prompt" in values, f"Missing default_prompt in {openai_yaml}", errors)
        expect(
            "allow_implicit_invocation" in values,
            f"Missing allow_implicit_invocation in {openai_yaml}",
            errors,
        )
        if skill_name and "default_prompt" in values:
            expect(
                f"${skill_name}" in values["default_prompt"],
                f"default_prompt in {openai_yaml} must mention ${skill_name}",
                errors,
            )
        if "allow_implicit_invocation" in values:
            expected = "false" if skill_dir.name == "writing-skills" else "true"
            expect(
                values["allow_implicit_invocation"] == expected,
                f"{openai_yaml} should set allow_implicit_invocation to {expected}",
                errors,
            )


def validate_config_and_roles(errors: list[str]) -> dict[str, dict]:
    config_path = CODEX_EXAMPLES / "config.toml"
    config = tomllib.loads(read_text(config_path))

    expect(config.get("features", {}).get("multi_agent") is True, "multi_agent must be true", errors)
    agents = config.get("agents", {})
    expect(agents.get("max_threads") == 6, "agents.max_threads must be 6", errors)
    expect(agents.get("max_depth") == 1, "agents.max_depth must be 1", errors)

    expected_roles = {
        "explorer": "agents/explorer.toml",
        "worker": "agents/worker.toml",
        "reviewer": "agents/reviewer.toml",
        "monitor": "agents/monitor.toml",
        "browser_debugger": "agents/browser-debugger.toml",
        "spec_reviewer": "agents/spec-reviewer.toml",
        "quality_reviewer": "agents/quality-reviewer.toml",
    }
    for role, rel_path in expected_roles.items():
        role_cfg = agents.get(role)
        expect(role_cfg is not None, f"Missing [agents.{role}] in config.toml", errors)
        if role_cfg is None:
            continue
        expect(
            role_cfg.get("config_file") == rel_path,
            f"[agents.{role}] should point to {rel_path}",
            errors,
        )
        expect((CODEX_EXAMPLES / rel_path).exists(), f"Missing role config {rel_path}", errors)
        role_path = CODEX_EXAMPLES / rel_path
        if role_path.exists():
            role_data = tomllib.loads(read_text(role_path))
            expect(role_data.get("name") == role, f"{role_path} should set name = {role!r}", errors)
            instructions = role_data.get("developer_instructions")
            expect(
                isinstance(instructions, str) and instructions.strip() != "",
                f"{role_path} should define non-empty developer_instructions",
                errors,
            )
            if role == "browser_debugger":
                expect(
                    "mcp_servers" not in role_data,
                    f"{role_path} should inherit browser MCP config from the main config instead of defining transport-specific MCP entries",
                    errors,
                )

    return expected_roles


def validate_prompts(expected_roles: dict[str, str], errors: list[str]) -> None:
    dispatch_path = CODEX_EXAMPLES / "prompts" / "dispatching-parallel-agents.md"
    dispatch_text = read_text(dispatch_path)
    for token in ("browser_debugger", "explorer", "worker", "reviewer", "spawn_agents_on_csv"):
        expect(token in dispatch_text, f"{dispatch_path} should mention {token}", errors)

    sdd_path = CODEX_EXAMPLES / "prompts" / "subagent-driven-development.md"
    sdd_text = read_text(sdd_path)
    for token in ("worker", "spec_reviewer", "quality_reviewer", "monitor", "reviewer"):
        expect(token in sdd_text, f"{sdd_path} should mention {token}", errors)

    for token in ("browser_debugger", "explorer", "worker", "reviewer", "monitor", "spec_reviewer", "quality_reviewer"):
        expect(token in expected_roles, f"Prompt library references unknown role {token}", errors)


def validate_hooks_and_scripts(errors: list[str]) -> None:
    hooks_path = CODEX_EXAMPLES / "hooks.json"
    hooks = json.loads(read_text(hooks_path))
    expect("hooks" in hooks, "hooks.json must define hooks", errors)
    hook_keys = set(hooks.get("hooks", {}).keys())
    expect({"SessionStart", "Stop"} <= hook_keys, "hooks.json must include SessionStart and Stop", errors)

    relative_hook_command = re.compile(r"(^|[\"'])((python|python3|py)\s+)?hooks[/\\]")
    for event_name, event_defs in hooks.get("hooks", {}).items():
        for event_def in event_defs:
            for hook in event_def.get("hooks", []):
                command = hook.get("command", "")
                expect(
                    isinstance(command, str) and command.strip() != "",
                    f"{hooks_path} {event_name} hook should define a non-empty command",
                    errors,
                )
                expect(
                    not relative_hook_command.search(command),
                    f"{hooks_path} {event_name} hook must use an absolute path or wrapper, not a relative hooks/... command",
                    errors,
                )

    script_paths = [
        CODEX_EXAMPLES / "notify.py",
        CODEX_EXAMPLES / "hooks" / "session-start.py",
        CODEX_EXAMPLES / "hooks" / "stop.py",
    ]
    for script_path in script_paths:
        try:
            compile(read_text(script_path), str(script_path), "exec")
        except SyntaxError as exc:
            errors.append(f"Python syntax error in {script_path}: {exc}")


def validate_docs(errors: list[str]) -> None:
    codex_doc = read_text(ROOT / "docs" / "README.codex.md")
    install_doc = read_text(ROOT / ".codex" / "INSTALL.md")
    expect("browser_debugger" in codex_doc, "docs/README.codex.md should mention browser_debugger", errors)
    expect("optional" in codex_doc.lower(), "docs/README.codex.md should mark browser_debugger as optional", errors)
    expect("MCP" in codex_doc, "docs/README.codex.md should mention MCP for browser_debugger", errors)
    expect("explorer + worker" in codex_doc, "docs/README.codex.md should describe the explorer + worker fallback", errors)
    expect("inherit" in codex_doc.lower(), "docs/README.codex.md should describe role inheritance for browser_debugger", errors)
    expect("absolute path" in codex_doc.lower(), "docs/README.codex.md should explain absolute hook command paths", errors)
    expect("absolute path" in install_doc.lower(), ".codex/INSTALL.md should explain absolute hook command paths", errors)


def validate_obsolete_strings(errors: list[str]) -> None:
    active_files = [
        ROOT / "README.md",
        ROOT / "docs" / "README.codex.md",
        ROOT / ".codex" / "INSTALL.md",
        ROOT / ".codex" / "examples" / "config.toml",
        ROOT / ".codex" / "examples" / "agents" / "browser-debugger.toml",
        ROOT / "skills" / "using-superpowers" / "SKILL.md",
        ROOT / "skills" / "dispatching-parallel-agents" / "SKILL.md",
        ROOT / "skills" / "subagent-driven-development" / "SKILL.md",
        ROOT / "skills" / "subagent-driven-development" / "implementer-prompt.md",
        ROOT / "skills" / "subagent-driven-development" / "spec-reviewer-prompt.md",
        ROOT / "skills" / "subagent-driven-development" / "code-quality-reviewer-prompt.md",
        ROOT / "skills" / "requesting-code-review" / "SKILL.md",
    ]
    banned_literals = [
        "Task(",
        "Task tool",
        "TodoWrite",
        "code-reviewer subagent",
        "collab = true",
        "chrome_devtools",
    ]
    for path in active_files:
        text = read_text(path)
        for literal in banned_literals:
            expect(literal not in text, f"{path} should not contain obsolete literal {literal!r}", errors)


def main() -> int:
    errors: list[str] = []
    validate_openai_yaml(errors)
    expected_roles = validate_config_and_roles(errors)
    validate_prompts(expected_roles, errors)
    validate_hooks_and_scripts(errors)
    validate_docs(errors)
    validate_obsolete_strings(errors)

    if errors:
        for error in errors:
            print(f"[FAIL] {error}")
        return 1

    print("[PASS] Codex examples, roles, prompts, and skill metadata look consistent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
