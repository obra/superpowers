"""Tests for agent-hub router.py"""
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock
import requests
import pytest

# Add parent dir so we can import router directly
sys.path.insert(0, str(Path(__file__).parent.parent))
import router


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    """Redirect DATA_DIR, USAGE_FILE, ENV_FILE to tmp paths for isolation."""
    d = tmp_path / "agent-hub"
    d.mkdir()
    monkeypatch.setattr(router, "DATA_DIR", d)
    monkeypatch.setattr(router, "USAGE_FILE", d / "usage.json")
    monkeypatch.setattr(router, "ENV_FILE", d / ".env")
    return d


# ── Task 1 tests: usage state ─────────────────────────────────────────────────

class TestInitUsage:
    def test_all_providers_present(self):
        data = router._init_usage()
        assert set(data.keys()) == {"groq", "codex", "gemini", "minimax"}

    def test_groq_starts_at_zero(self):
        data = router._init_usage()
        assert data["groq"]["requests_used"] == 0
        assert data["groq"]["requests_limit"] == 14400
        assert data["groq"]["reset_window"] == "daily"

    def test_codex_starts_at_zero(self):
        data = router._init_usage()
        assert data["codex"]["requests_used"] == 0
        assert data["codex"]["requests_limit"] == 500
        assert data["codex"]["reset_window"] == "monthly"

    def test_gemini_starts_at_zero(self):
        data = router._init_usage()
        assert data["gemini"]["tokens_used"] == 0
        assert data["gemini"]["tokens_limit"] == 1000000

    def test_minimax_starts_at_zero(self):
        data = router._init_usage()
        assert data["minimax"]["tokens_used"] == 0
        assert data["minimax"]["tokens_limit"] == 1000000


class TestLoadUsage:
    def test_creates_file_when_missing(self, data_dir):
        assert not (data_dir / "usage.json").exists()
        data = router.load_usage()
        assert (data_dir / "usage.json").exists()
        assert data["groq"]["requests_used"] == 0

    def test_reinitializes_on_malformed_json(self, data_dir):
        (data_dir / "usage.json").write_text("not valid json {{{")
        data = router.load_usage()
        assert data["groq"]["requests_used"] == 0

    def test_reinitializes_when_provider_missing(self, data_dir):
        bad = {"groq": {"requests_used": 5, "requests_limit": 14400,
                        "reset_window": "daily", "last_reset": "2026-03-27T00:00:00+00:00"}}
        (data_dir / "usage.json").write_text(json.dumps(bad))
        data = router.load_usage()
        assert "codex" in data
        assert "gemini" in data
        assert "minimax" in data

    def test_loads_existing_state(self, data_dir):
        init = router._init_usage()
        init["groq"]["requests_used"] = 1200
        (data_dir / "usage.json").write_text(json.dumps(init))
        data = router.load_usage()
        assert data["groq"]["requests_used"] == 1200


class TestAutoReset:
    def test_daily_resets_when_window_elapsed(self, data_dir):
        data = router._init_usage()
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        data["groq"]["requests_used"] = 5000
        data["groq"]["last_reset"] = yesterday.isoformat()
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router._auto_reset(data)
        assert result["groq"]["requests_used"] == 0

    def test_no_reset_when_window_not_elapsed(self, data_dir):
        data = router._init_usage()
        data["groq"]["requests_used"] = 5000
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router._auto_reset(data)
        assert result["groq"]["requests_used"] == 5000

    def test_monthly_resets_when_new_month(self, data_dir):
        data = router._init_usage()
        last_month_start = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=1)
        last_month_start = last_month_start.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        data["codex"]["requests_used"] = 400
        data["codex"]["last_reset"] = last_month_start.isoformat()
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router._auto_reset(data)
        assert result["codex"]["requests_used"] == 0

    def test_only_daily_providers_reset_on_new_day(self, data_dir):
        data = router._init_usage()
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        data["groq"]["requests_used"] = 5000
        data["groq"]["last_reset"] = yesterday.isoformat()
        data["codex"]["requests_used"] = 400  # monthly — should NOT reset
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router._auto_reset(data)
        assert result["groq"]["requests_used"] == 0
        assert result["codex"]["requests_used"] == 400


class TestIncrementUsage:
    def test_increments_groq_request_count(self, data_dir):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router.increment_usage(data, "groq", 1)
        assert result["groq"]["requests_used"] == 1

    def test_increments_gemini_token_count(self, data_dir):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        result = router.increment_usage(data, "gemini", 3500)
        assert result["gemini"]["tokens_used"] == 3500

    def test_persists_to_file(self, data_dir):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        router.increment_usage(data, "groq", 1)
        saved = json.loads((data_dir / "usage.json").read_text())
        assert saved["groq"]["requests_used"] == 1


# ── Task 2 tests: classify, select, status bar ────────────────────────────────

class TestClassify:
    def test_code_signal_from_keyword(self):
        assert router.classify("write a function to sort a list") == "code"

    def test_code_signal_from_def(self):
        assert router.classify("def foo(): pass — what's wrong?") == "code"

    def test_research_signal(self):
        assert router.classify("explain how transformers work") == "research"

    def test_creative_signal(self):
        assert router.classify("write a story about a dragon") == "creative"

    def test_fast_signal(self):
        assert router.classify("how many days in a leap year") == "fast"

    def test_general_fallback(self):
        assert router.classify("what should I have for lunch") == "general"


class TestSelectProvider:
    def _make_data(self, overrides=None):
        data = router._init_usage()
        if overrides:
            for provider, fields in overrides.items():
                data[provider].update(fields)
        return data

    def test_returns_primary_when_healthy(self):
        data = self._make_data()
        provider, warning = router.select_provider(data, "code")
        assert provider == "codex"
        assert warning is None

    def test_falls_back_when_below_threshold(self):
        # codex at 456/500 = 91.2% used → 8.8% remaining → below 10% threshold
        data = self._make_data({"codex": {"requests_used": 456}})
        provider, warning = router.select_provider(data, "code")
        assert provider == "groq"
        assert warning is not None
        assert "Codex" in warning

    def test_falls_back_when_primary_exhausted(self):
        data = self._make_data({"codex": {"requests_used": 500}})
        provider, warning = router.select_provider(data, "code")
        assert provider == "groq"
        assert warning is not None

    def test_hard_stop_when_both_exhausted(self):
        data = self._make_data({
            "codex": {"requests_used": 500},
            "groq": {"requests_used": 14400},
        })
        with pytest.raises(SystemExit):
            router.select_provider(data, "code")

    def test_general_routes_to_groq(self):
        data = self._make_data()
        provider, _ = router.select_provider(data, "general")
        assert provider == "groq"

    def test_research_routes_to_gemini(self):
        data = self._make_data()
        provider, _ = router.select_provider(data, "research")
        assert provider == "gemini"

    def test_creative_routes_to_minimax(self):
        data = self._make_data()
        provider, _ = router.select_provider(data, "creative")
        assert provider == "minimax"

    def test_exactly_at_threshold_triggers_fallback(self):
        # 500 * 0.10 = 50 remaining (exactly 10%) → should trigger fallback
        data = self._make_data({"codex": {"requests_used": 450}})  # 50/500 = 10% remaining
        provider, warning = router.select_provider(data, "code")
        assert provider == "groq"
        assert warning is not None


class TestStatusBar:
    def _make_data(self):
        return router._init_usage()

    def test_format_count_small_number(self):
        data = self._make_data()
        data["groq"]["requests_used"] = 42
        result = router.format_count(data, "groq")
        assert result == "42/14400"

    def test_format_count_thousands(self):
        data = self._make_data()
        data["groq"]["requests_used"] = 12340
        result = router.format_count(data, "groq")
        assert result == "12K/14400"

    def test_format_count_millions(self):
        data = self._make_data()
        data["gemini"]["tokens_used"] = 892000
        result = router.format_count(data, "gemini")
        assert result == "892K/1M"

    def test_indicator_green_above_50pct(self):
        data = self._make_data()
        data["groq"]["requests_used"] = 0
        assert router._indicator(data, "groq") == "●"

    def test_indicator_gray_when_exhausted(self):
        data = self._make_data()
        data["groq"]["requests_used"] = 14400
        assert router._indicator(data, "groq") == "○"

    def test_status_bar_normal_contains_all_providers(self):
        data = self._make_data()
        bar = router.build_status_bar(data, "groq")
        assert "[GROQ" in bar
        assert "Codex" in bar
        assert "Gemini" in bar
        assert "Minimax" in bar

    def test_status_bar_fallback_contains_warning(self):
        data = self._make_data()
        bar = router.build_status_bar(data, "groq", warning="⚠ Codex at limit — routing code task to Groq")
        assert "⚠" in bar
        assert "Codex" in bar


# ── Task 3 tests: API calls ────────────────────────────────────────────────────

def _groq_response(content="hello"):
    m = MagicMock()
    m.json.return_value = {"choices": [{"message": {"content": content}}]}
    m.raise_for_status = MagicMock()
    return m


def _openai_response(content="hello"):
    m = MagicMock()
    m.json.return_value = {"choices": [{"message": {"content": content}}]}
    m.raise_for_status = MagicMock()
    return m


def _gemini_response(content="hello", tokens=50):
    m = MagicMock()
    m.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": content}]}}],
        "usageMetadata": {"totalTokenCount": tokens},
    }
    m.raise_for_status = MagicMock()
    return m


def _minimax_response(content="hello", tokens=40):
    m = MagicMock()
    m.json.return_value = {
        "choices": [{"message": {"content": content}}],
        "usage": {"total_tokens": tokens},
    }
    m.raise_for_status = MagicMock()
    return m


class TestAPICallGroq:
    def test_returns_text_and_one_request(self, data_dir, monkeypatch):
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        with patch("requests.post", return_value=_groq_response("groq says hi")):
            text, count = router.call_groq("hello")
        assert text == "groq says hi"
        assert count == 1

    def test_raises_when_key_missing(self, data_dir, monkeypatch):
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        (data_dir / ".env").write_text("")
        with pytest.raises(ValueError, match="GROQ_API_KEY"):
            router.call_groq("hello")


class TestAPICallCodex:
    def test_returns_text_and_one_request(self, data_dir, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "test_key")
        (data_dir / ".env").write_text("OPENAI_API_KEY=test_key\n")
        with patch("requests.post", return_value=_openai_response("codex says hi")):
            text, count = router.call_codex("write a function")
        assert text == "codex says hi"
        assert count == 1

    def test_raises_when_key_missing(self, data_dir, monkeypatch):
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        (data_dir / ".env").write_text("")
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            router.call_codex("hello")


class TestAPICallGemini:
    def test_returns_text_and_token_count(self, data_dir, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "test_key")
        (data_dir / ".env").write_text("GEMINI_API_KEY=test_key\n")
        with patch("requests.post", return_value=_gemini_response("gemini says hi", 120)):
            text, tokens = router.call_gemini("explain something")
        assert text == "gemini says hi"
        assert tokens == 120

    def test_raises_when_key_missing(self, data_dir, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        (data_dir / ".env").write_text("")
        with pytest.raises(ValueError, match="GEMINI_API_KEY"):
            router.call_gemini("hello")


class TestAPICallMiniMax:
    def test_returns_text_and_token_count(self, data_dir, monkeypatch):
        monkeypatch.setenv("MINIMAX_API_KEY", "test_key")
        monkeypatch.setenv("MINIMAX_GROUP_ID", "group123")
        (data_dir / ".env").write_text("MINIMAX_API_KEY=test_key\nMINIMAX_GROUP_ID=group123\n")
        with patch("requests.post", return_value=_minimax_response("minimax says hi", 85)):
            text, tokens = router.call_minimax("write a story")
        assert text == "minimax says hi"
        assert tokens == 85

    def test_raises_when_api_key_missing(self, data_dir, monkeypatch):
        monkeypatch.delenv("MINIMAX_API_KEY", raising=False)
        monkeypatch.delenv("MINIMAX_GROUP_ID", raising=False)
        (data_dir / ".env").write_text("")
        with pytest.raises(ValueError, match="MINIMAX_API_KEY"):
            router.call_minimax("hello")

    def test_raises_when_group_id_missing(self, data_dir, monkeypatch):
        monkeypatch.setenv("MINIMAX_API_KEY", "test_key")
        monkeypatch.delenv("MINIMAX_GROUP_ID", raising=False)
        (data_dir / ".env").write_text("MINIMAX_API_KEY=test_key\n")
        with pytest.raises(ValueError, match="MINIMAX_GROUP_ID"):
            router.call_minimax("hello")


class TestCallWithRetry:
    def test_succeeds_on_first_try(self, data_dir, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")
        with patch("requests.post", return_value=_groq_response("ok")):
            text, count = router.call_with_retry("groq", "hello")
        assert text == "ok"

    def test_retries_once_on_failure_then_succeeds(self, data_dir, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")
        call_count = {"n": 0}

        def flaky(*args, **kwargs):
            call_count["n"] += 1
            if call_count["n"] == 1:
                raise requests.exceptions.ConnectionError("network error")
            return _groq_response("ok on retry")

        with patch("requests.post", side_effect=flaky):
            with patch("time.sleep"):
                text, _ = router.call_with_retry("groq", "hello")
        assert text == "ok on retry"
        assert call_count["n"] == 2

    def test_raises_if_both_attempts_fail(self, data_dir, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")
        with patch("requests.post", side_effect=requests.exceptions.ConnectionError("down")):
            with patch("time.sleep"):
                with pytest.raises(requests.exceptions.ConnectionError):
                    router.call_with_retry("groq", "hello")


# ── Task 4 tests: CLI commands ─────────────────────────────────────────────────

class TestCLIStatus:
    def test_prints_all_providers(self, data_dir, capsys):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        args = MagicMock()
        router.cmd_status(args)
        out = capsys.readouterr().out
        assert "Groq" in out
        assert "Codex" in out
        assert "Gemini" in out
        assert "Minimax" in out


class TestCLIReset:
    def test_resets_groq_to_zero(self, data_dir):
        data = router._init_usage()
        data["groq"]["requests_used"] = 9000
        (data_dir / "usage.json").write_text(json.dumps(data))
        args = MagicMock()
        args.provider = "groq"
        router.cmd_reset(args)
        saved = json.loads((data_dir / "usage.json").read_text())
        assert saved["groq"]["requests_used"] == 0

    def test_resets_gemini_to_zero(self, data_dir):
        data = router._init_usage()
        data["gemini"]["tokens_used"] = 500000
        (data_dir / "usage.json").write_text(json.dumps(data))
        args = MagicMock()
        args.provider = "gemini"
        router.cmd_reset(args)
        saved = json.loads((data_dir / "usage.json").read_text())
        assert saved["gemini"]["tokens_used"] == 0


class TestCLISetKey:
    def test_writes_groq_key_to_env(self, data_dir):
        args = MagicMock()
        args.key_name = "groq"
        args.key_value = "gsk_test123"
        router.cmd_set_key(args)
        content = (data_dir / ".env").read_text()
        assert "GROQ_API_KEY=gsk_test123" in content

    def test_writes_openai_key_as_codex(self, data_dir):
        args = MagicMock()
        args.key_name = "codex"
        args.key_value = "sk-test456"
        router.cmd_set_key(args)
        content = (data_dir / ".env").read_text()
        assert "OPENAI_API_KEY=sk-test456" in content

    def test_writes_minimax_group_id(self, data_dir):
        args = MagicMock()
        args.key_name = "minimax-group-id"
        args.key_value = "group999"
        router.cmd_set_key(args)
        content = (data_dir / ".env").read_text()
        assert "MINIMAX_GROUP_ID=group999" in content

    def test_preserves_existing_keys(self, data_dir):
        (data_dir / ".env").write_text("GROQ_API_KEY=existing\n")
        args = MagicMock()
        args.key_name = "codex"
        args.key_value = "new_key"
        router.cmd_set_key(args)
        content = (data_dir / ".env").read_text()
        assert "GROQ_API_KEY=existing" in content
        assert "OPENAI_API_KEY=new_key" in content

    def test_unknown_key_name_exits(self, data_dir):
        args = MagicMock()
        args.key_name = "unknown-provider"
        args.key_value = "somekey"
        with pytest.raises(SystemExit):
            router.cmd_set_key(args)


class TestCLIRoute:
    def test_route_calls_provider_and_prints_response(self, data_dir, monkeypatch, capsys):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")

        with patch.object(router, "call_with_retry", return_value=("response text", 1)):
            args = MagicMock()
            args.task = "quick question"
            args.type = "fast"
            router.cmd_route(args)

        out = capsys.readouterr()
        assert "response text" in out.out
        assert "GROQ" in out.err

    def test_route_classifies_when_no_type_given(self, data_dir, monkeypatch, capsys):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")

        with patch.object(router, "call_with_retry", return_value=("classified response", 1)):
            args = MagicMock()
            args.task = "what is machine learning"
            args.type = None
            router.cmd_route(args)

        out = capsys.readouterr()
        assert "classified response" in out.out

    def test_route_falls_back_when_primary_key_missing(self, data_dir, monkeypatch, capsys):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.setenv("GROQ_API_KEY", "test_key")
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")

        call_counts = {"n": 0}

        def fake_call(provider, task):
            call_counts["n"] += 1
            if provider == "codex":
                raise ValueError("OPENAI_API_KEY not set")
            return ("fallback response", 1)

        with patch.object(router, "call_with_retry", side_effect=fake_call):
            args = MagicMock()
            args.task = "write a function"
            args.type = "code"
            router.cmd_route(args)

        out = capsys.readouterr()
        assert "fallback response" in out.out

    def test_route_exits_when_both_providers_fail(self, data_dir, monkeypatch, capsys):
        data = router._init_usage()
        (data_dir / "usage.json").write_text(json.dumps(data))
        (data_dir / ".env").write_text("GROQ_API_KEY=test_key\n")

        import requests as req

        def always_fail(provider, task):
            raise req.exceptions.RequestException("network error")

        with patch.object(router, "call_with_retry", side_effect=always_fail):
            args = MagicMock()
            args.task = "quick question"
            args.type = "fast"
            with pytest.raises(SystemExit) as exc_info:
                router.cmd_route(args)

        assert exc_info.value.code == 1
        out = capsys.readouterr()
        assert "failed" in out.err
