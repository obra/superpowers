import importlib
import importlib.util
import os
import shutil
import sys
from pathlib import Path

import pytest

# Point at the plugin directory
_PLUGIN_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../.hermes-plugin")
)
sys.path.insert(0, _PLUGIN_DIR)

BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for hermes"


def _load_plugin():
    """Re-import plugin module fresh."""
    if "__init__" in sys.modules:
        del sys.modules["__init__"]
    return importlib.import_module("__init__")


def _fire_pre_llm(ctx, **kwargs):
    hook = ctx._hooks["pre_llm_call"]
    defaults = {
        "session_id": "s1",
        "user_message": "hi",
        "conversation_history": [],
        "is_first_turn": False,
        "model": "test-model",
        "platform": "cli",
    }
    defaults.update(kwargs)
    return hook(**defaults)


class TestPluginRegistration:
    def test_register_attaches_only_pre_llm_call_hook(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        assert list(mock_ctx._hooks.keys()) == ["pre_llm_call"]

    def test_register_registers_every_stock_skill_as_path(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        # The conftest mock raises on non-Path (mirroring hermes' real
        # register_skill), so reaching these asserts proves every
        # registration passed a pathlib.Path.
        assert "using-superpowers" in mock_ctx._skills
        assert "brainstorming" in mock_ctx._skills
        for name, path in mock_ctx._skills.items():
            assert isinstance(path, Path)
            assert path.name == "SKILL.md"
            assert path.parent.name == name
            assert path.is_file()

    def test_registered_skills_match_skill_directories(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        skills_root = plugin._skills_dir()
        expected = {
            entry
            for entry in os.listdir(skills_root)
            if os.path.isfile(os.path.join(skills_root, entry, "SKILL.md"))
        }
        assert set(mock_ctx._skills.keys()) == expected


class TestBootstrapInjection:
    def test_first_turn_returns_bootstrap_context(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        result = _fire_pre_llm(mock_ctx, is_first_turn=True)
        assert isinstance(result, dict)
        content = result["context"]
        assert BOOTSTRAP_MARKER in content
        assert content.startswith("<EXTREMELY_IMPORTANT>")
        assert content.rstrip().endswith("</EXTREMELY_IMPORTANT>")

    def test_later_turns_return_none(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        assert _fire_pre_llm(mock_ctx, is_first_turn=False) is None
        assert _fire_pre_llm(mock_ctx, is_first_turn=None) is None

    def test_hook_tolerates_future_kwargs(self, mock_ctx):
        plugin = _load_plugin()
        plugin.register(mock_ctx)
        result = _fire_pre_llm(
            mock_ctx, is_first_turn=True, telemetry_schema_version=3
        )
        assert BOOTSTRAP_MARKER in result["context"]


class TestLayoutResolution:
    def _stage(self, tmp_path, layout):
        """Copy the plugin module + a minimal skills tree in the given layout."""
        src_skills = Path(_PLUGIN_DIR).parent / "skills"
        if layout == "clone":
            plugdir = tmp_path / "superpowers" / ".hermes-plugin"
        else:  # flat: module at the plugin dir root, skills nested inside it
            plugdir = tmp_path / "superpowers"
        skills = tmp_path / "superpowers" / "skills"
        plugdir.mkdir(parents=True, exist_ok=True)
        shutil.copy(Path(_PLUGIN_DIR) / "__init__.py", plugdir / "__init__.py")
        for skill in ("using-superpowers", "brainstorming"):
            shutil.copytree(src_skills / skill, skills / skill)
        return plugdir

    def _load_from(self, plugdir):
        spec = importlib.util.spec_from_file_location(
            f"hermes_plugin_test_{plugdir.parent.name}_{plugdir.name}",
            plugdir / "__init__.py",
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    def test_clone_layout_resolves_sibling_skills(self, tmp_path, mock_ctx):
        # git-clone install: .hermes-plugin/ and skills/ are siblings.
        plugdir = self._stage(tmp_path, "clone")
        mod = self._load_from(plugdir)
        mod.register(mock_ctx)
        assert "using-superpowers" in mock_ctx._skills

    def test_flat_layout_resolves_nested_skills(self, tmp_path, mock_ctx):
        # flattened install: module at the plugin dir root, skills/ inside it.
        plugdir = self._stage(tmp_path, "flat")
        mod = self._load_from(plugdir)
        mod.register(mock_ctx)
        assert "using-superpowers" in mock_ctx._skills

    def test_missing_skills_raises_loudly(self, tmp_path, mock_ctx):
        plugdir = tmp_path / "superpowers"
        plugdir.mkdir(parents=True)
        shutil.copy(Path(_PLUGIN_DIR) / "__init__.py", plugdir / "__init__.py")
        mod = self._load_from(plugdir)
        with pytest.raises(RuntimeError, match="cannot find the skills"):
            mod.register(mock_ctx)
