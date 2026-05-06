import json

from drill.normalizer import (
    collect_new_logs,
    filter_codex_logs_by_cwd,
    normalize_claude_logs,
    normalize_codex_logs,
    normalize_gemini_logs,
    snapshot_log_dir,
)


class TestSnapshotAndCollect:
    def test_snapshot_and_collect_new_files(self, tmp_path):
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        (log_dir / "old.jsonl").write_text('{"old": true}\n')
        snapshot = snapshot_log_dir(log_dir)
        (log_dir / "new.jsonl").write_text('{"new": true}\n')
        new_files = collect_new_logs(log_dir, snapshot)
        assert len(new_files) == 1
        assert new_files[0].name == "new.jsonl"

    def test_empty_dir_returns_empty(self, tmp_path):
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        snapshot = snapshot_log_dir(log_dir)
        new_files = collect_new_logs(log_dir, snapshot)
        assert new_files == []


class TestNormalizeClaudeLogs:
    def test_normalizes_tool_use(self):
        lines = [
            json.dumps(
                {"type": "tool_use", "name": "EnterWorktree", "input": {"branch": "add-login"}}
            ),
            json.dumps({"type": "tool_use", "name": "Bash", "input": {"command": "git status"}}),
            json.dumps({"type": "text", "text": "I'll create a worktree"}),
        ]
        normalized = normalize_claude_logs("\n".join(lines))
        assert len(normalized) == 2
        assert normalized[0]["tool"] == "EnterWorktree"
        assert normalized[0]["source"] == "native"
        assert normalized[1]["tool"] == "Bash"
        assert normalized[1]["source"] == "shell"


class TestNormalizeCodexLogs:
    def test_normalizes_local_shell_call(self):
        lines = [
            json.dumps(
                {
                    "type": "response_item",
                    "item": {
                        "type": "local_shell_call",
                        "action": {"command": ["git", "worktree", "add", "feature"]},
                        "status": "completed",
                    },
                }
            ),
            json.dumps(
                {
                    "type": "response_item",
                    "item": {"type": "message", "content": [{"text": "Creating worktree"}]},
                }
            ),
        ]
        normalized = normalize_codex_logs("\n".join(lines))
        assert len(normalized) == 1
        assert normalized[0]["tool"] == "Bash"
        assert "git worktree add" in normalized[0]["args"]["command"]
        assert normalized[0]["source"] == "shell"

    def test_filter_by_cwd_keeps_matching_drops_others(self, tmp_path):
        target = "/private/tmp/drill-target"
        match = tmp_path / "match.jsonl"
        match.write_text(
            json.dumps(
                {
                    "type": "session_meta",
                    "payload": {"id": "abc", "cwd": target},
                }
            )
            + "\n"
        )
        other = tmp_path / "other.jsonl"
        other.write_text(
            json.dumps(
                {
                    "type": "session_meta",
                    "payload": {"id": "def", "cwd": "/private/tmp/drill-other"},
                }
            )
            + "\n"
        )
        no_meta = tmp_path / "no-meta.jsonl"
        no_meta.write_text(json.dumps({"type": "response_item", "payload": {}}) + "\n")
        empty = tmp_path / "empty.jsonl"
        empty.write_text("")
        kept = filter_codex_logs_by_cwd([match, other, no_meta, empty], target)
        assert kept == [match]

    def test_normalizes_function_call_with_payload(self):
        """Test the actual codex rollout format using payload instead of item."""
        lines = [
            json.dumps(
                {
                    "type": "response_item",
                    "payload": {
                        "type": "function_call",
                        "name": "exec_command",
                        "arguments": '{"cmd":"git worktree add .worktrees/feature",'
                        '"workdir":"/tmp/test"}',
                        "call_id": "call_123",
                    },
                }
            ),
            json.dumps(
                {
                    "type": "response_item",
                    "payload": {
                        "type": "function_call",
                        "name": "apply_patch",
                        "arguments": '{"patch":"--- a/file\\n+++ b/file"}',
                        "call_id": "call_456",
                    },
                }
            ),
        ]
        normalized = normalize_codex_logs("\n".join(lines))
        assert len(normalized) == 2
        assert normalized[0]["tool"] == "Bash"
        assert "git worktree add" in normalized[0]["args"]["command"]
        assert normalized[0]["source"] == "shell"
        assert normalized[1]["tool"] == "Edit"
        assert normalized[1]["source"] == "native"


class TestNormalizeGeminiLogs:
    def test_normalizes_jsonl_tool_calls(self):
        lines = [
            json.dumps({"kind": "main"}),
            json.dumps(
                {
                    "type": "gemini",
                    "content": "Reading file",
                    "toolCalls": [
                        {
                            "id": "read_file_1",
                            "name": "read_file",
                            "args": {"file_path": "GEMINI.md"},
                            "status": "success",
                        }
                    ],
                }
            ),
            json.dumps(
                {
                    "type": "gemini",
                    "content": "Running command",
                    "toolCalls": [
                        {
                            "id": "shell_1",
                            "name": "run_shell_command",
                            "args": {"command": "git status"},
                            "status": "success",
                        }
                    ],
                }
            ),
        ]

        normalized = normalize_gemini_logs("\n".join(lines))

        assert normalized == [
            {"tool": "Read", "args": {"file_path": "GEMINI.md"}, "source": "native"},
            {"tool": "Bash", "args": {"command": "git status"}, "source": "shell"},
        ]
