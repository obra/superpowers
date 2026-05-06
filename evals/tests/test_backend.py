from pathlib import Path

import pytest

from drill.backend import Backend, load_backend


@pytest.fixture
def backends_dir():
    return Path(__file__).parent.parent / "backends"


class TestLoadBackend:
    def test_loads_claude_backend(self, backends_dir):
        backend = load_backend("claude", backends_dir)
        assert backend.name == "claude"
        assert backend.cli == "claude"
        assert "--dangerously-skip-permissions" in backend.args

    def test_loads_codex_backend(self, backends_dir):
        backend = load_backend("codex", backends_dir)
        assert backend.name == "codex"
        assert backend.cli == "codex"

    def test_unknown_backend_raises(self, backends_dir):
        with pytest.raises(FileNotFoundError):
            load_backend("nonexistent", backends_dir)

    def test_loads_claude_opus_4_6_variant(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/sp")
        backend = load_backend("claude-opus-4-6", backends_dir)
        assert backend.name == "claude-opus-4-6"
        assert backend.family == "claude"
        assert backend.model == "claude-opus-4-6"


class TestBackendBuildCommand:
    def test_claude_build_command(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/superpowers")
        backend = load_backend("claude", backends_dir)
        cmd = backend.build_command("/tmp/workdir")
        assert cmd[0] == "claude"
        assert "--plugin-dir" in cmd
        assert "/tmp/superpowers" in cmd

    def test_codex_build_command(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/superpowers")
        backend = load_backend("codex", backends_dir)
        cmd = backend.build_command("/tmp/workdir")
        assert cmd[0] == "codex"


class TestBackendEnvValidation:
    def test_missing_env_raises(self, backends_dir, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("SUPERPOWERS_ROOT", raising=False)
        backend = load_backend("claude", backends_dir)
        with pytest.raises(EnvironmentError, match="ANTHROPIC_API_KEY"):
            backend.validate_env()


class TestBackendIdleDetection:
    def test_ready_pattern_matches(self, backends_dir):
        backend = load_backend("claude", backends_dir)
        assert backend.is_ready_line("❯ ")
        assert backend.is_ready_line("Human: ")
        assert not backend.is_ready_line("Running tool...")


class TestBackendModelExtraction:
    def test_extract_model_from_args(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/sp")
        backend = load_backend("claude", backends_dir)
        assert backend.model == "opus"

    def test_no_model_flag_returns_none(self):
        backend = Backend(
            name="test",
            cli="test",
            args=["--foo", "bar"],
            required_env=[],
            hooks={"pre_run": [], "post_run": []},
            shutdown="/exit",
            idle={},
            startup_timeout=30,
            terminal={},
            session_logs={},
        )
        assert backend.model is None

    def test_extracts_from_short_m_flag(self):
        backend = Backend(
            name="test",
            cli="test",
            args=["-m", "gemini-2.5-flash"],
            required_env=[],
            hooks={"pre_run": [], "post_run": []},
            shutdown="/exit",
            idle={},
            startup_timeout=30,
            terminal={},
            session_logs={},
        )
        assert backend.model == "gemini-2.5-flash"


class TestBackendFamily:
    def test_claude_backend_family(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/sp")
        backend = load_backend("claude", backends_dir)
        assert backend.family == "claude"

    def test_codex_backend_family(self, backends_dir):
        backend = load_backend("codex", backends_dir)
        assert backend.family == "codex"

    def test_variant_name_preserves_family(self):
        backend = Backend(
            name="claude-opus-4-6",
            cli="claude",
            args=[],
            required_env=[],
            hooks={"pre_run": [], "post_run": []},
            shutdown="/exit",
            idle={},
            startup_timeout=30,
            terminal={},
            session_logs={},
        )
        assert backend.family == "claude"

    def test_unknown_family_is_other(self):
        backend = Backend(
            name="random-xyz",
            cli="xyz",
            args=[],
            required_env=[],
            hooks={"pre_run": [], "post_run": []},
            shutdown="/exit",
            idle={},
            startup_timeout=30,
            terminal={},
            session_logs={},
        )
        assert backend.family == "other"
