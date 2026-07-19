"""Tests for the Cursor preToolUse hook that bridges traceback metadata into the CLI."""

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
HOOK_PATH = REPO_ROOT / "hooks" / "cursor-traceback-current.py"
WRAPPER_PATH = REPO_ROOT / "hooks" / "cursor-traceback-current"
HOOKS_CONFIG_PATH = REPO_ROOT / "hooks" / "hooks-cursor.json"


def load_hook_module():
    spec = importlib.util.spec_from_file_location("cursor_traceback_current", HOOK_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load hook module from {HOOK_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def base_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "tool_name": "Shell",
        "conversation_id": "cursor-session-123",
        "transcript_path": "/home/user/.cursor/projects/demo/agent-transcripts/cursor-session-123/cursor-session-123.jsonl",
        "tool_input": {
            "command": "ace traceback --cursor-current --dry-run --json",
            "working_directory": "/data2/dzf/code",
        },
    }
    payload.update(overrides)
    return payload


class TestRewritePayload(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.hook = load_hook_module()

    def test_non_target_shell_command_is_allowed_without_updated_input(self) -> None:
        payload = base_payload(
            tool_input={"command": "git status", "working_directory": "/tmp"},
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result, {"permission": "allow"})

    def test_target_command_is_rewritten_with_quoted_env_vars(self) -> None:
        conversation_id = "cursor-session-123"
        transcript_path = (
            "/home/user/.cursor/projects/demo/agent-transcripts/"
            "cursor-session-123/cursor-session-123.jsonl"
        )
        command = "ace traceback --cursor-current --dry-run --json"
        payload = base_payload(
            conversation_id=conversation_id,
            transcript_path=transcript_path,
            tool_input={"command": command, "working_directory": "/data2/dzf/code"},
        )

        result = self.hook.rewrite_payload(payload)

        expected_command = (
            f"env ACE_CURSOR_CONVERSATION_ID={shlex.quote(conversation_id)} "
            f"ACE_CURSOR_TRANSCRIPT_PATH={shlex.quote(transcript_path)} "
            f"{command}"
        )
        self.assertEqual(result["permission"], "allow")
        self.assertEqual(
            result["updated_input"],
            {
                "command": expected_command,
                "working_directory": "/data2/dzf/code",
            },
        )

    def test_target_command_quotes_paths_with_spaces_and_special_chars(self) -> None:
        conversation_id = "session with spaces"
        transcript_path = "/home/user/my transcripts/cur's session.jsonl"
        command = "ace traceback --cursor-current --yes --json -m summary"
        payload = base_payload(
            conversation_id=conversation_id,
            transcript_path=transcript_path,
            tool_input={"command": command},
        )

        result = self.hook.rewrite_payload(payload)

        expected_command = (
            f"env ACE_CURSOR_CONVERSATION_ID={shlex.quote(conversation_id)} "
            f"ACE_CURSOR_TRANSCRIPT_PATH={shlex.quote(transcript_path)} "
            f"{command}"
        )
        self.assertEqual(result["updated_input"]["command"], expected_command)

    def test_target_command_preserves_existing_tool_input_fields(self) -> None:
        payload = base_payload(
            tool_input={
                "command": "ace traceback --cursor-current --dry-run --json",
                "working_directory": "/data2/dzf/code/ace",
                "description": "preview current cursor session",
            },
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result["permission"], "allow")
        self.assertEqual(result["updated_input"]["working_directory"], "/data2/dzf/code/ace")
        self.assertEqual(result["updated_input"]["description"], "preview current cursor session")
        self.assertIn("ACE_CURSOR_CONVERSATION_ID=", result["updated_input"]["command"])

    def test_target_command_accepts_shell_whitespace_and_quoted_flag(self) -> None:
        commands = (
            "ace  traceback   --cursor-current --dry-run",
            "ace\ttraceback\t--cursor-current --dry-run",
            "ace traceback '--cursor-current' --dry-run",
            'ace traceback "--cursor-current" --dry-run',
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.hook.rewrite_payload(
                    base_payload(tool_input={"command": command}),
                )

                self.assertEqual(result["permission"], "allow")
                self.assertTrue(result["updated_input"]["command"].endswith(command))

    def test_target_command_accepts_adjacent_shell_operators(self) -> None:
        commands = (
            "ace traceback --cursor-current; echo done",
            "ace traceback --cursor-current| tee output.json",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.hook.rewrite_payload(
                    base_payload(tool_input={"command": command}),
                )

                self.assertEqual(result["permission"], "allow")
                self.assertTrue(result["updated_input"]["command"].endswith(command))

    def test_target_command_accepts_adjacent_redirections(self) -> None:
        commands = (
            "ace traceback --cursor-current>output.json",
            "ace traceback --cursor-current<input.json",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.hook.rewrite_payload(
                    base_payload(tool_input={"command": command}),
                )

                self.assertEqual(result["permission"], "allow")
                self.assertTrue(result["updated_input"]["command"].endswith(command))

    def test_target_command_uses_parsed_tokens_for_shell_quoting(self) -> None:
        commands = (
            "'ace' traceback --cursor-current --dry-run",
            "ace traceback --cursor-'current' --dry-run",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.hook.rewrite_payload(
                    base_payload(tool_input={"command": command}),
                )

                self.assertEqual(result["permission"], "allow")
                self.assertTrue(result["updated_input"]["command"].endswith(command))

    def test_subshell_form_is_outside_direct_call_scope(self) -> None:
        result = self.hook.rewrite_payload(
            base_payload(tool_input={"command": "(ace traceback --cursor-current)"}),
        )

        self.assertEqual(result, {"permission": "allow"})

    def test_missing_conversation_id_denies_with_clear_message(self) -> None:
        payload = base_payload(conversation_id="")

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result["permission"], "deny")
        self.assertIn("conversation_id", result["user_message"])

    def test_missing_transcript_path_denies_with_clear_message(self) -> None:
        payload = base_payload(transcript_path="")

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result["permission"], "deny")
        self.assertIn("transcript_path", result["user_message"])

    def test_target_text_only_inside_argument_is_not_rewritten(self) -> None:
        payload = base_payload(
            tool_input={
                "command": 'echo "ace traceback --cursor-current" is not the target',
            },
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result, {"permission": "allow"})

    def test_unrelated_invalid_shlex_command_is_allowed(self) -> None:
        payload = base_payload(
            tool_input={"command": "printf 'unclosed"},
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result, {"permission": "allow"})

    def test_flag_prefix_near_miss_with_invalid_quote_is_allowed(self) -> None:
        payload = base_payload(
            tool_input={"command": "ace traceback --cursor-currently 'unclosed"},
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result, {"permission": "allow"})

    def test_target_invalid_shlex_command_fails_closed(self) -> None:
        payload = base_payload(
            tool_input={"command": 'ace traceback --cursor-current --dry-run "unclosed'},
        )

        result = self.hook.rewrite_payload(payload)

        self.assertEqual(result["permission"], "deny")
        self.assertIn("user_message", result)

    def test_malformed_command_keeps_confirmed_target_tokens(self) -> None:
        commands = (
            "'ace' traceback --cursor-current \"unclosed",
            "ace 'traceback' --cursor-current \"unclosed",
            "ace traceback --cursor-'current' \"unclosed",
        )

        for command in commands:
            with self.subTest(command=command):
                result = self.hook.rewrite_payload(
                    base_payload(tool_input={"command": command}),
                )

                self.assertEqual(result["permission"], "deny")
                self.assertIn("user_message", result)


class TestMainEntrypoint(unittest.TestCase):
    def run_main(self, stdin_text: str) -> tuple[int, dict[str, Any], str, str]:
        completed = subprocess.run(
            [sys.executable, str(HOOK_PATH)],
            input=stdin_text,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertTrue(completed.stdout.strip(), "stdout must contain JSON")
        output = json.loads(completed.stdout)
        return completed.returncode, output, completed.stdout, completed.stderr

    def test_main_invalid_json_fails_closed_with_valid_stdout(self) -> None:
        _returncode, output, stdout, stderr = self.run_main("{not-json")

        self.assertEqual(output["permission"], "deny")
        self.assertIn("user_message", output)
        json.loads(stdout)
        self.assertNotIn("Traceback", stdout)
        self.assertNotIn("Traceback", stderr)


class TestHookConfiguration(unittest.TestCase):
    def test_shell_pretool_hook_is_fail_open_on_wrapper_failure(self) -> None:
        config = json.loads(HOOKS_CONFIG_PATH.read_text(encoding="utf-8"))
        shell_hooks = [
            hook
            for hook in config["hooks"]["preToolUse"]
            if hook.get("matcher") == "Shell"
        ]

        self.assertEqual(len(shell_hooks), 1)
        self.assertIs(shell_hooks[0]["failClosed"], False)

    def test_wrapper_supports_python_fallback_and_has_valid_bash_syntax(self) -> None:
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
                'printf "%s\\n" "$1" > "$WRAPPER_FALLBACK_MARKER"\n'
                'printf \'{"permission":"allow"}\\n\'\n',
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
            self.assertEqual(json.loads(completed.stdout), {"permission": "allow"})
            self.assertEqual(marker.read_text(encoding="utf-8").strip(), str(HOOK_PATH))


if __name__ == "__main__":
    unittest.main()
