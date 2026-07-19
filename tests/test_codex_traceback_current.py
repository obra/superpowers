"""Tests for the Codex PreToolUse hook that bridges traceback metadata into the CLI."""

from __future__ import annotations

import importlib.util
import json
import shlex
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
HOOK_PATH = REPO_ROOT / "hooks" / "codex-traceback-current.py"
WRAPPER_PATH = REPO_ROOT / "hooks" / "codex-traceback-current"
HOOKS_CONFIG_PATH = REPO_ROOT / "hooks" / "hooks-codex.json"
ATTRIBUTES_PATH = REPO_ROOT / ".gitattributes"


def base_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "tool_name": "Bash",
        "session_id": "codex-session-123",
        "transcript_path": "/home/user/.codex/sessions/codex-session-123.jsonl",
        "tool_input": {
            "command": "ace traceback --codex-current --dry-run --json",
            "timeout": 5000,
        },
    }
    payload.update(overrides)
    return payload


def hook_output(
    decision: str,
    **fields: Any,
) -> dict[str, Any]:
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            **fields,
        },
    }


def load_hook_module():
    spec = importlib.util.spec_from_file_location("codex_traceback_current", HOOK_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load hook module from {HOOK_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CodexHookTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.hook = load_hook_module()

    def run_hook_text(self, stdin_text: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HOOK_PATH)],
            input=stdin_text,
            capture_output=True,
            text=True,
            check=False,
        )

    def run_hook(self, payload: dict[str, Any]) -> dict[str, Any]:
        completed = self.run_hook_text(json.dumps(payload))
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertTrue(completed.stdout.strip(), completed.stderr)
        return json.loads(completed.stdout)

    def assert_passthrough_text(self, stdin_text: str) -> None:
        completed = self.run_hook_text(stdin_text)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout, "")
        self.assertEqual(completed.stderr, "")

    def assert_passthrough(self, payload: Any) -> None:
        self.assert_passthrough_text(json.dumps(payload))


class TestRewritePayload(CodexHookTestCase):
    def test_non_bash_tool_returns_none_and_emits_no_output(self) -> None:
        payload = base_payload(tool_name="Read")

        self.assertIsNone(self.hook.rewrite_payload(payload))
        self.assert_passthrough(payload)

    def test_non_target_bash_command_returns_none_and_emits_no_output(self) -> None:
        payload = base_payload(
            tool_input={"command": "git status", "timeout": 5000},
        )

        self.assertIsNone(self.hook.rewrite_payload(payload))
        self.assert_passthrough(payload)

    def test_target_command_is_rewritten_with_quoted_env_vars(self) -> None:
        session_id = "codex-session-123"
        transcript_path = "/home/user/.codex/sessions/codex-session-123.jsonl"
        command = "ace traceback --codex-current --dry-run --json"
        tool_input = {"command": command, "timeout": 5000}

        result = self.run_hook(
            base_payload(
                session_id=session_id,
                transcript_path=transcript_path,
                tool_input=tool_input,
            ),
        )

        expected_command = (
            f"env ACE_CODEX_SESSION_ID={shlex.quote(session_id)} "
            f"ACE_CODEX_TRANSCRIPT_PATH={shlex.quote(transcript_path)} "
            f"{command}"
        )
        self.assertEqual(
            result,
            hook_output(
                "allow",
                updatedInput={"command": expected_command, "timeout": 5000},
            ),
        )

    def test_target_command_quotes_spaces_and_shell_metacharacters(self) -> None:
        session_id = "session with spaces"
        transcript_path = "/tmp/cur's transcript;$(false).jsonl"
        command = "ace traceback --codex-current --yes"

        result = self.run_hook(
            base_payload(
                session_id=session_id,
                transcript_path=transcript_path,
                tool_input={"command": command},
            ),
        )

        expected = (
            f"env ACE_CODEX_SESSION_ID={shlex.quote(session_id)} "
            f"ACE_CODEX_TRANSCRIPT_PATH={shlex.quote(transcript_path)} "
            f"{command}"
        )
        self.assertEqual(
            result["hookSpecificOutput"]["updatedInput"]["command"],
            expected,
        )

    def test_target_command_preserves_all_tool_input_fields(self) -> None:
        tool_input = {
            "command": "ace traceback --codex-current",
            "timeout": 5000,
            "description": "upload current Codex session",
        }

        result = self.run_hook(base_payload(tool_input=tool_input))

        updated_input = result["hookSpecificOutput"]["updatedInput"]
        self.assertEqual(updated_input["timeout"], 5000)
        self.assertEqual(updated_input["description"], tool_input["description"])

    def test_target_accepts_whitespace_and_quoted_tokens(self) -> None:
        commands = (
            "ace  traceback   --codex-current --dry-run",
            "ace\ttraceback\t--codex-current --dry-run",
            "ace traceback '--codex-current' --dry-run",
            'ace traceback "--codex-current" --dry-run',
            "'ace' traceback --codex-current --dry-run",
            "ace traceback --codex-'current' --dry-run",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.run_hook(
                    base_payload(tool_input={"command": command}),
                )
                output = result["hookSpecificOutput"]
                self.assertEqual(output["permissionDecision"], "allow")
                self.assertTrue(output["updatedInput"]["command"].endswith(command))

    def test_target_accepts_adjacent_operators_and_redirections(self) -> None:
        commands = (
            "ace traceback --codex-current; echo done",
            "ace traceback --codex-current| tee output.json",
            "ace traceback --codex-current>output.json",
            "ace traceback --codex-current<input.json",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.run_hook(
                    base_payload(tool_input={"command": command}),
                )
                output = result["hookSpecificOutput"]
                self.assertEqual(output["permissionDecision"], "allow")
                self.assertTrue(output["updatedInput"]["command"].endswith(command))

    def test_subshell_target_is_outside_direct_call_scope(self) -> None:
        payload = base_payload(
            tool_input={"command": "(ace traceback --codex-current)"},
        )

        self.assert_passthrough(payload)

    def test_missing_session_id_denies_with_reason(self) -> None:
        result = self.run_hook(base_payload(session_id=""))

        output = result["hookSpecificOutput"]
        self.assertEqual(output["permissionDecision"], "deny")
        self.assertIn("session_id", output["permissionDecisionReason"])
        self.assertNotIn("updatedInput", output)

    def test_missing_transcript_path_denies_with_reason(self) -> None:
        result = self.run_hook(base_payload(transcript_path=""))

        output = result["hookSpecificOutput"]
        self.assertEqual(output["permissionDecision"], "deny")
        self.assertIn("transcript_path", output["permissionDecisionReason"])
        self.assertNotIn("updatedInput", output)

    def test_target_text_inside_argument_is_not_rewritten(self) -> None:
        payload = base_payload(
            tool_input={
                "command": 'echo "ace traceback --codex-current" is not target',
            },
        )

        self.assert_passthrough(payload)

    def test_unrelated_malformed_command_passthrough_emits_no_output(self) -> None:
        payload = base_payload(
            tool_input={"command": "printf 'unclosed"},
        )

        self.assert_passthrough(payload)

    def test_flag_prefix_near_miss_with_malformed_quote_is_allowed(self) -> None:
        payload = base_payload(
            tool_input={"command": "ace traceback --codex-currently 'unclosed"},
        )

        self.assert_passthrough(payload)

    def test_malformed_target_command_denies(self) -> None:
        commands = (
            'ace traceback --codex-current --dry-run "unclosed',
            "'ace' traceback --codex-current \"unclosed",
            "ace 'traceback' --codex-current \"unclosed",
            "ace traceback --codex-'current' \"unclosed",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.run_hook(
                    base_payload(tool_input={"command": command}),
                )
                output = result["hookSpecificOutput"]
                self.assertEqual(output["permissionDecision"], "deny")
                self.assertIn("permissionDecisionReason", output)

    def test_invalid_tool_input_passthrough_emits_no_output(self) -> None:
        tool_inputs = (None, "invalid", {}, {"command": ""}, {"command": 7})

        for tool_input in tool_inputs:
            with self.subTest(tool_input=tool_input):
                payload = base_payload(tool_input=tool_input)
                self.assertIsNone(self.hook.rewrite_payload(payload))
                self.assert_passthrough(payload)


class TestMainEntrypoint(CodexHookTestCase):
    def test_invalid_json_exits_zero_with_no_output(self) -> None:
        self.assert_passthrough_text("{not-json")

    def test_non_object_json_exits_zero_with_no_output(self) -> None:
        self.assert_passthrough(["not", "an", "object"])


class TestHookConfiguration(unittest.TestCase):
    def test_codex_config_keeps_session_start_and_adds_nested_pretooluse(self) -> None:
        config = json.loads(HOOKS_CONFIG_PATH.read_text(encoding="utf-8"))

        self.assertIn("SessionStart", config["hooks"])
        bash_entries = [
            entry
            for entry in config["hooks"].get("PreToolUse", [])
            if entry.get("matcher") == "Bash"
        ]
        self.assertEqual(len(bash_entries), 1)
        self.assertEqual(
            bash_entries[0]["hooks"],
            [
                {
                    "type": "command",
                    "command": (
                        '"${PLUGIN_ROOT}/hooks/run-hook.cmd" '
                        "codex-traceback-current"
                    ),
                    "timeout": 5,
                },
            ],
        )

    def test_wrapper_supports_python_fallback_and_valid_bash_syntax(self) -> None:
        self.assertTrue(WRAPPER_PATH.is_file(), f"missing wrapper: {WRAPPER_PATH}")
        wrapper = WRAPPER_PATH.read_text(encoding="utf-8")

        self.assertIn("command -v python3", wrapper)
        self.assertIn("elif command -v python ", wrapper)
        self.assertLess(
            wrapper.index("command -v python3"),
            wrapper.index("elif command -v python "),
        )
        completed = subprocess.run(
            ["bash", "-n", str(WRAPPER_PATH)],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)

    def test_wrapper_normalizes_windows_script_path(self) -> None:
        completed = subprocess.run(
            [
                "/bin/bash",
                "-c",
                'source "$1"; normalize_script_path "$2"',
                "_",
                str(WRAPPER_PATH),
                r"C:\dir\hook",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "C:/dir/hook")

    def test_wrapper_uses_python_when_python3_is_unavailable(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            marker = temp_path / "fallback-called"
            python_stub = temp_path / "python"
            python_stub.write_text(
                "#!/bin/sh\n"
                'printf "%s\\n" "$1" > "$WRAPPER_FALLBACK_MARKER"\n',
                encoding="utf-8",
            )
            python_stub.chmod(0o755)

            completed = subprocess.run(
                ["/bin/bash", str(WRAPPER_PATH)],
                input="{}",
                capture_output=True,
                text=True,
                check=False,
                env={
                    "PATH": temp_dir,
                    "WRAPPER_FALLBACK_MARKER": str(marker),
                },
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertEqual(completed.stdout, "")
            self.assertEqual(
                marker.read_text(encoding="utf-8").strip(),
                str(HOOK_PATH),
            )

    def test_extensionless_traceback_wrappers_are_forced_to_lf(self) -> None:
        attributes = ATTRIBUTES_PATH.read_text(encoding="utf-8").splitlines()

        self.assertIn("hooks/codex-traceback-current text eol=lf", attributes)
        self.assertIn("hooks/cursor-traceback-current text eol=lf", attributes)

    def test_hook_documents_posix_shell_limitation(self) -> None:
        hook_source = HOOK_PATH.read_text(encoding="utf-8")

        self.assertIn("POSIX-compatible shell", hook_source)
        self.assertIn("traceback skill checks", hook_source)


if __name__ == "__main__":
    unittest.main()
