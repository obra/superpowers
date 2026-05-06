import subprocess
from pathlib import Path

BIN_DIR = Path(__file__).parent.parent / "bin"
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def run_helper(name: str, args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(BIN_DIR / name), *args],
        cwd=cwd,
        capture_output=True,
        text=True,
    )


class TestToolCalled:
    def test_tool_present(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-called", ["Read"], tmp_path)
        assert result.returncode == 0

    def test_tool_absent(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-called", ["Write"], tmp_path)
        assert result.returncode == 1
        assert "FAIL" in result.stdout

    def test_empty_jsonl(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text("")
        result = run_helper("tool-called", ["Read"], tmp_path)
        assert result.returncode == 1


class TestToolNotCalled:
    def test_tool_absent(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-not-called", ["Write"], tmp_path)
        assert result.returncode == 0

    def test_tool_present(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-not-called", ["Read"], tmp_path)
        assert result.returncode == 1
        assert "FAIL" in result.stdout

    def test_empty_jsonl(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text("")
        result = run_helper("tool-not-called", ["Read"], tmp_path)
        assert result.returncode == 0


class TestToolCount:
    def test_gte_passes(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-count", ["Read", "gte", "2"], tmp_path)
        assert result.returncode == 0

    def test_gte_fails(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-count", ["Read", "gte", "5"], tmp_path)
        assert result.returncode == 1
        assert "FAIL" in result.stdout

    def test_eq(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-count", ["Read", "eq", "2"], tmp_path)
        assert result.returncode == 0

    def test_lt(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-count", ["Read", "lt", "3"], tmp_path)
        assert result.returncode == 0


class TestToolBefore:
    def test_correct_order(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text(
            (FIXTURES_DIR / "tools_ordered.jsonl").read_text()
        )
        result = run_helper("tool-before", ["Read", "Edit"], tmp_path)
        assert result.returncode == 0

    def test_wrong_order(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text(
            (FIXTURES_DIR / "tools_ordered.jsonl").read_text()
        )
        result = run_helper("tool-before", ["Edit", "EnterWorktree"], tmp_path)
        assert result.returncode == 1
        assert "FAIL" in result.stdout

    def test_first_tool_missing(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text(
            (FIXTURES_DIR / "tools_ordered.jsonl").read_text()
        )
        result = run_helper("tool-before", ["Write", "Read"], tmp_path)
        assert result.returncode == 1
        assert "never called" in result.stdout

    def test_second_tool_missing(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text(
            (FIXTURES_DIR / "tools_ordered.jsonl").read_text()
        )
        result = run_helper("tool-before", ["Read", "Write"], tmp_path)
        assert result.returncode == 1
        assert "never called" in result.stdout


class TestToolArgMatch:
    def test_matching_arg(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper(
            "tool-arg-match", ["Skill", '.skill == "superpowers:worktree"'], tmp_path
        )
        assert result.returncode == 0

    def test_no_matching_arg(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-arg-match", ["Skill", '.skill == "nonexistent"'], tmp_path)
        assert result.returncode == 1
        assert "FAIL" in result.stdout

    def test_tool_not_present(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text((FIXTURES_DIR / "tools_multi.jsonl").read_text())
        result = run_helper("tool-arg-match", ["Write", '.file_path == "/tmp/foo"'], tmp_path)
        assert result.returncode == 1
