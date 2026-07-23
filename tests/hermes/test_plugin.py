import os
import sys
import importlib
import pytest

# Point at the plugin directory
_PLUGIN_DIR = os.path.join(os.path.dirname(__file__), "../../.hermes-plugin")
sys.path.insert(0, os.path.abspath(_PLUGIN_DIR))

BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for hermes"


def _load_plugin():
    """Re-import plugin module fresh (clears module-level cache)."""
    if "__init__" in sys.modules:
        del sys.modules["__init__"]
    return importlib.import_module("__init__")


class TestPluginRegistration:
    def test_register_attaches_session_start_hook(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        mock_ctx.register_hook.assert_called_once()
        event_name = mock_ctx.register_hook.call_args[0][0]
        assert event_name == "on_session_start"


class TestBootstrapInjection:
    def test_first_session_start_injects_bootstrap(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        assert len(mock_ctx._injected) == 1
        assert BOOTSTRAP_MARKER in mock_ctx._injected[0]["content"]

    def test_injection_uses_user_role(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        assert mock_ctx._injected[0]["role"] == "user"

    def test_dedup_skips_on_same_session_id(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        handler(session_id="sess-1", model="test-model", platform="test")
        assert len(mock_ctx._injected) == 1

    def test_reinjects_on_new_session_id(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        handler(session_id="sess-2", model="test-model", platform="test")
        assert len(mock_ctx._injected) == 2

    def test_missing_skill_file_skips_silently(self, mock_ctx, tmp_path):
        plugin = _load_plugin()
        plugin._bootstrap_cache = None
        plugin._SKILLS_DIR = str(tmp_path / "nonexistent")
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        assert len(mock_ctx._injected) == 0

    def test_cache_populated_after_first_call(self, mock_ctx):
        plugin = _load_plugin()
        plugin._bootstrap_cache = None
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        assert plugin._bootstrap_cache is not None
        assert plugin._bootstrap_cache is not False


class TestBootstrapContent:
    def test_contains_extremely_important_tags(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        content = mock_ctx._injected[0]["content"]
        assert "<EXTREMELY_IMPORTANT>" in content
        assert "</EXTREMELY_IMPORTANT>" in content

    def test_frontmatter_stripped(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        content = mock_ctx._injected[0]["content"]
        assert "---\nname:" not in content

    def test_tool_mapping_present(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        handler = mock_ctx._hooks["on_session_start"]
        handler(session_id="sess-1", model="test-model", platform="test")
        content = mock_ctx._injected[0]["content"]
        assert "Hermes tool mapping" in content
        assert "read_file" in content
